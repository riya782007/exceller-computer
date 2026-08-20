'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/require-role'
import { createInvoiceSchema, updatePaymentStatusSchema } from '@/lib/validations/schemas'
import {
  calculateTax,
  calculateLineAmount,
  calculateSubtotal,
} from '@/lib/utils/tax-engine'
import { generateInvoicePdfBuffer } from '@/lib/invoices/generate-pdf'
import { uploadInvoicePdf } from '@/lib/invoices/upload-pdf'
import type { InvoicePdfData } from '@/lib/invoices/pdf-template'
import type { ActionResult, TaxType } from '@/types'

// ============================================
// Types
// ============================================

export interface CreateInvoiceResult {
  invoiceId: string
  invoiceNumber: string
  pdfUrl: string | null
  total: number
  warning?: string
}

export interface InvoiceInput {
  customer_id: string
  job_id?: string
  tax_type: TaxType
  items: Array<{
    description: string
    quantity: number
    unit_price: number
    hsn_sac?: string
  }>
  notes?: string
}

// ============================================
// Create Invoice
// ============================================

/**
 * Create a new GST invoice.
 * 
 * Flow:
 * 1. Authenticate + authorize (admin only)
 * 2. Validate input via Zod
 * 3. Verify customer exists
 * 4. Verify job exists (if provided)
 * 5. Calculate line amounts + subtotal + tax
 * 6. Insert invoice + items in DB
 * 7. Generate PDF
 * 8. Upload PDF to Supabase Storage
 * 9. Update invoice with pdf_url
 * 10. Return result
 * 
 * If PDF generation or upload fails, the invoice is still created
 * but pdf_url remains null. A warning is returned.
 */
export async function createInvoice(
  input: InvoiceInput
): Promise<ActionResult<CreateInvoiceResult>> {
  try {
    // 1. Auth check — admin only
    await requireRole('admin')

    // 2. Validate input
    const validation = createInvoiceSchema.safeParse(input)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join('; ')
      return { success: false, error: `Validation failed: ${errors}` }
    }

    const validatedData = validation.data

    // 3. Use admin client for privileged operations
    const adminClient = createAdminClient()

    // 4. Verify customer exists
    const { data: customer, error: customerError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, phone, address')
      .eq('id', validatedData.customer_id)
      .single()

    if (customerError || !customer) {
      return { success: false, error: 'Customer not found. Please select a valid customer.' }
    }

    // 5. Verify job exists (if provided)
    let jobCardNumber: string | null = null
    if (validatedData.job_id) {
      const { data: job, error: jobError } = await adminClient
        .from('repair_jobs')
        .select('id, job_card_number')
        .eq('id', validatedData.job_id)
        .single()

      if (jobError || !job) {
        return { success: false, error: 'Repair job not found. Please select a valid job.' }
      }
      jobCardNumber = job.job_card_number
    }

    // 6. Calculate financials using centralized tax engine
    const itemsWithAmounts = validatedData.items.map((item) => ({
      ...item,
      amount: calculateLineAmount(item.quantity, item.unit_price),
    }))

    const subtotal = calculateSubtotal(
      validatedData.items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price }))
    )

    if (subtotal <= 0) {
      return { success: false, error: 'Invoice subtotal must be greater than zero.' }
    }

    const taxResult = calculateTax(subtotal, validatedData.tax_type)

    // 7. Insert invoice record (DB auto-generates invoice_number via default)
    const { data: invoice, error: insertError } = await adminClient
      .from('invoices')
      .insert({
        customer_id: validatedData.customer_id,
        job_id: validatedData.job_id || null,
        subtotal: taxResult.subtotal,
        tax_type: validatedData.tax_type,
        cgst: taxResult.cgst,
        sgst: taxResult.sgst,
        igst: taxResult.igst,
        total: taxResult.total,
        payment_status: 'pending',
        notes: validatedData.notes || null,
      })
      .select('id, invoice_number')
      .single()

    if (insertError || !invoice) {
      // Handle duplicate invoice number race condition
      if (insertError?.code === '23505') {
        return { success: false, error: 'Duplicate invoice number generated. Please try again.' }
      }
      console.error('[Create Invoice] DB insert failed:', insertError?.message)
      return { success: false, error: 'Failed to create invoice record. Please try again.' }
    }

    // 8. Insert invoice items
    const invoiceItems = itemsWithAmounts.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      hsn_sac: item.hsn_sac || null,
      amount: item.amount,
    }))

    const { error: itemsError } = await adminClient
      .from('invoice_items')
      .insert(invoiceItems)

    if (itemsError) {
      // Rollback: delete the invoice if items insert fails
      await adminClient.from('invoices').delete().eq('id', invoice.id)
      console.error('[Create Invoice] Items insert failed:', itemsError.message)
      return { success: false, error: 'Failed to save invoice items. Invoice was not created.' }
    }

    // 9. Generate PDF
    let pdfUrl: string | null = null
    let warning: string | undefined

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      customer: {
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      jobCardNumber,
      items: itemsWithAmounts.map((item) => ({
        description: item.description,
        hsnSac: item.hsn_sac || null,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
      })),
      subtotal: taxResult.subtotal,
      taxType: validatedData.tax_type,
      cgst: taxResult.cgst,
      sgst: taxResult.sgst,
      igst: taxResult.igst,
      total: taxResult.total,
      paymentStatus: 'pending',
      notes: validatedData.notes || null,
    }

    const { buffer: pdfBuffer, error: pdfError } = await generateInvoicePdfBuffer(pdfData)

    if (pdfError || !pdfBuffer) {
      warning = `Invoice created successfully but PDF generation failed: ${pdfError || 'Unknown error'}. You can regenerate it later.`
    } else {
      // 10. Upload PDF to storage
      const uploadResult = await uploadInvoicePdf(pdfBuffer, invoice.invoice_number)

      if (uploadResult.success && uploadResult.url) {
        pdfUrl = uploadResult.url

        // 11. Update invoice with pdf_url
        const { error: updateError } = await adminClient
          .from('invoices')
          .update({ pdf_url: pdfUrl })
          .eq('id', invoice.id)

        if (updateError) {
          console.error('[Create Invoice] pdf_url update failed:', updateError.message)
          warning = 'Invoice created and PDF uploaded, but URL reference failed to save. Contact support.'
        }
      } else {
        warning = `Invoice created but PDF upload failed: ${uploadResult.error || 'Unknown error'}. You can regenerate it later.`
      }
    }

    // Revalidate admin invoices list
    revalidatePath('/admin/invoices')

    return {
      success: true,
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        pdfUrl,
        total: taxResult.total,
        warning,
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      // Auth errors from requireRole
      if (error.message.startsWith('Unauthorized') || error.message.startsWith('Forbidden')) {
        return { success: false, error: error.message }
      }
    }
    console.error('[Create Invoice] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ============================================
// Update Payment Status
// ============================================

/**
 * Update invoice payment status.
 * Admin only.
 */
export async function updateInvoicePaymentStatus(
  data: { invoice_id: string; payment_status: string }
): Promise<ActionResult<{ invoiceId: string; newStatus: string }>> {
  try {
    await requireRole('admin')

    const validation = updatePaymentStatusSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: 'Invalid payment status data.' }
    }

    const { invoice_id, payment_status } = validation.data

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('invoices')
      .update({ payment_status })
      .eq('id', invoice_id)

    if (error) {
      console.error('[Update Payment Status] Error:', error.message)
      return { success: false, error: 'Failed to update payment status.' }
    }

    revalidatePath('/admin/invoices')
    revalidatePath(`/admin/invoices/${invoice_id}`)

    return {
      success: true,
      data: { invoiceId: invoice_id, newStatus: payment_status },
    }
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('Forbidden'))) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

// ============================================
// Regenerate Invoice PDF
// ============================================

/**
 * Regenerate and re-upload PDF for an existing invoice.
 * Useful when initial generation failed or template was updated.
 * Admin only.
 */
export async function regenerateInvoicePdf(
  invoiceId: string
): Promise<ActionResult<{ pdfUrl: string }>> {
  try {
    await requireRole('admin')

    if (!invoiceId || typeof invoiceId !== 'string') {
      return { success: false, error: 'Invalid invoice ID.' }
    }

    const adminClient = createAdminClient()

    // Fetch full invoice data
    const { data: invoice, error: invoiceError } = await adminClient
      .from('invoices')
      .select(`
        id,
        invoice_number,
        subtotal,
        tax_type,
        cgst,
        sgst,
        igst,
        total,
        payment_status,
        notes,
        job_id,
        created_at,
        customer:profiles!invoices_customer_id_fkey(full_name, email, phone, address),
        job:repair_jobs!invoices_job_id_fkey(job_card_number)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found.' }
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await adminClient
      .from('invoice_items')
      .select('description, quantity, unit_price, hsn_sac, amount')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: true })

    if (itemsError || !items) {
      return { success: false, error: 'Failed to load invoice items.' }
    }

    // Build PDF data
    const customerData = invoice.customer as unknown as { full_name: string; email: string | null; phone: string | null; address: string | null } | null
    const jobData = invoice.job as unknown as { job_card_number: string } | null

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: new Date(invoice.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      customer: {
        name: customerData?.full_name || 'Unknown Customer',
        email: customerData?.email,
        phone: customerData?.phone,
        address: customerData?.address,
      },
      jobCardNumber: jobData?.job_card_number || null,
      items: items.map((item) => ({
        description: item.description,
        hsnSac: item.hsn_sac,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
      })),
      subtotal: invoice.subtotal,
      taxType: invoice.tax_type,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      total: invoice.total,
      paymentStatus: invoice.payment_status,
      notes: invoice.notes,
    }

    // Generate PDF
    const { buffer, error: pdfError } = await generateInvoicePdfBuffer(pdfData)

    if (pdfError || !buffer) {
      return { success: false, error: `PDF generation failed: ${pdfError || 'Unknown error'}` }
    }

    // Upload
    const uploadResult = await uploadInvoicePdf(buffer, invoice.invoice_number)

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: `PDF upload failed: ${uploadResult.error || 'Unknown error'}` }
    }

    // Update pdf_url
    const { error: updateError } = await adminClient
      .from('invoices')
      .update({ pdf_url: uploadResult.url })
      .eq('id', invoiceId)

    if (updateError) {
      return { success: false, error: 'PDF uploaded but URL reference failed to save.' }
    }

    revalidatePath(`/admin/invoices/${invoiceId}`)

    return {
      success: true,
      data: { pdfUrl: uploadResult.url },
    }
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith('Unauthorized') || error.message.startsWith('Forbidden'))) {
      return { success: false, error: error.message }
    }
    console.error('[Regenerate PDF] Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
