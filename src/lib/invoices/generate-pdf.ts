import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdfDocument, type InvoicePdfData } from './pdf-template'

/**
 * Generate invoice PDF as a buffer.
 * This runs server-side only.
 * 
 * @param data - Complete invoice data for the PDF template
 * @returns PDF as Uint8Array buffer, or null on failure
 */
export async function generateInvoicePdfBuffer(
  data: InvoicePdfData
): Promise<{ buffer: Uint8Array | null; error: string | null }> {
  try {
    const element = React.createElement(InvoicePdfDocument, { data })
    const buffer = await renderToBuffer(element)

    return {
      buffer: new Uint8Array(buffer),
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed'
    console.error('[PDF Generation] Error:', message)
    return {
      buffer: null,
      error: message,
    }
  }
}
