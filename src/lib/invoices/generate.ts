import { InvoiceDocument, type InvoicePdfData } from '@/lib/invoices/document'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const element = createElement(InvoiceDocument, { data })
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0])
  return Buffer.from(buffer)
}

export async function storeInvoicePdf(
  invoiceId: string,
  invoiceNumber: string,
  data: InvoicePdfData
): Promise<string | null> {
  const supabase = createAdminClient()
  const pdf = await renderInvoicePdf(data)
  const path = `${invoiceId}/${invoiceNumber}.pdf`

  const { error } = await supabase.storage.from('invoices').upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) {
    logger.error('Invoice PDF upload failed', { invoiceId, message: error.message })
    return null
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from('invoices')
    .createSignedUrl(path, 60 * 60 * 24 * 30)

  if (signedError || !signed) {
    logger.error('Invoice signed URL failed', { invoiceId, message: signedError?.message })
    return path
  }

  return signed.signedUrl
}
