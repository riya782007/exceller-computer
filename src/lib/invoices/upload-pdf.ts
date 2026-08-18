import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'invoices'

export interface UploadResult {
  success: boolean
  url: string | null
  error: string | null
}

/**
 * Upload invoice PDF to Supabase Storage.
 * Uses admin client (service role) to bypass RLS.
 * 
 * Storage path: invoices/{year}/{invoice_number}.pdf
 * 
 * @param pdfBuffer - The PDF file as a Buffer/Uint8Array
 * @param invoiceNumber - Invoice number for naming (e.g., EXC-2024-0001)
 * @returns UploadResult with public URL or error
 */
export async function uploadInvoicePdf(
  pdfBuffer: Uint8Array,
  invoiceNumber: string
): Promise<UploadResult> {
  try {
    const admin = createAdminClient()
    const year = new Date().getFullYear().toString()
    const sanitizedName = invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_')
    const filePath = `${year}/${sanitizedName}.pdf`

    // Upload with upsert (in case of regeneration)
    const { error: uploadError } = await admin.storage
      .from(BUCKET_NAME)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('[Invoice Upload] Storage upload failed:', uploadError.message)
      return {
        success: false,
        url: null,
        error: `Storage upload failed: ${uploadError.message}`,
      }
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error'
    console.error('[Invoice Upload] Unexpected error:', message)
    return {
      success: false,
      url: null,
      error: message,
    }
  }
}

/**
 * Generate a signed URL for private invoice access.
 * Useful if the bucket is not public.
 * 
 * @param invoiceNumber - Invoice number
 * @param expiresInSeconds - URL validity period (default: 1 hour)
 */
export async function getSignedInvoiceUrl(
  invoiceNumber: string,
  expiresInSeconds: number = 3600
): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const year = invoiceNumber.split('-')[1] || new Date().getFullYear().toString()
    const sanitizedName = invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_')
    const filePath = `${year}/${sanitizedName}.pdf`

    const { data, error } = await admin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresInSeconds)

    if (error || !data) {
      console.error('[Invoice URL] Signed URL generation failed:', error?.message)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('[Invoice URL] Unexpected error:', error)
    return null
  }
}
