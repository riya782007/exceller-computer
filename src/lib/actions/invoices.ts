'use server'

import { requireRole } from '@/lib/auth/require-role'
import { AppError, toUserMessage } from '@/lib/errors'
import { storeInvoicePdf } from '@/lib/invoices/generate'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { calculateLineAmount, calculateSubtotal, calculateTax } from '@/lib/utils/tax-engine'
import { createInvoiceSchema, updatePaymentStatusSchema } from '@/lib/validations/schemas'
import type { ActionResult } from '@/types'
import { z } from 'zod'

export async function createInvoice(input: unknown): Promise<ActionResult<{ id: string; invoice_number: string }>> {
  try {
    await requireRole('admin')
    const data = createInvoiceSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const lineItems = data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      hsn_sac: item.hsn_sac || null,
      amount: calculateLineAmount(item.quantity, item.unit_price),
    }))

    const subtotal = calculateSubtotal(lineItems)
    const tax = calculateTax(subtotal, data.tax_type)

    const { data: customer } = await supabase
      .from('profiles')
      .select('full_name, phone, address')
      .eq('id', data.customer_id)
      .single()

    if (!customer) {
      throw new AppError('Customer not found', 'NOT_FOUND', 404)
    }

    let jobCardNumber: string | null = null
    if (data.job_id) {
      const { data: job } = await supabase
        .from('repair_jobs')
        .select('job_card_number')
        .eq('id', data.job_id)
        .single()
      jobCardNumber = job?.job_card_number ?? null
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        customer_id: data.customer_id,
        job_id: data.job_id ?? null,
        subtotal: tax.subtotal,
        tax_type: tax.taxType,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        total: tax.total,
        payment_status: 'pending',
        notes: data.notes || null,
      })
      .select('id, invoice_number, created_at')
      .single()

    if (error || !invoice) {
      logger.error('createInvoice failed', { message: error?.message })
      throw new AppError('Could not create invoice', 'INVOICE_CREATE_FAILED', 400)
    }

    const { error: itemsError } = await supabase.from('invoice_items').insert(
      lineItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        hsn_sac: item.hsn_sac,
        amount: item.amount,
      }))
    )

    if (itemsError) {
      logger.error('createInvoice items failed', { message: itemsError.message })
      throw new AppError('Could not save invoice items', 'INVOICE_ITEMS_FAILED', 400)
    }

    const pdfUrl = await storeInvoicePdf(invoice.id, invoice.invoice_number, {
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.created_at,
      taxType: tax.taxType,
      customerName: customer.full_name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      jobCardNumber,
      items: lineItems,
      subtotal: tax.subtotal,
      cgst: tax.cgst,
      sgst: tax.sgst,
      igst: tax.igst,
      total: tax.total,
      paymentStatus: 'pending',
      notes: data.notes || null,
      upiUri: process.env.NEXT_PUBLIC_UPI_ID ?? null,
    })

    if (pdfUrl) {
      await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)
    }

    return { success: true, data: { id: invoice.id, invoice_number: invoice.invoice_number } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid invoice' }
    }
    return { success: false, error: toUserMessage(error, 'Could not create invoice') }
  }
}

export async function updateInvoicePaymentStatus(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = updatePaymentStatusSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('invoices')
      .update({ payment_status: data.payment_status })
      .eq('id', data.invoice_id)

    if (error) {
      logger.error('updateInvoicePaymentStatus failed', { message: error.message })
      throw new AppError('Could not update payment status', 'INVOICE_UPDATE_FAILED', 400)
    }

    return { success: true, data: { id: data.invoice_id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid payment status' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update payment status') }
  }
}
