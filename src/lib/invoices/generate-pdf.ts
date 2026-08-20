import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePdfDocument, type InvoicePdfData } from './pdf-template'

/**
 * Generate invoice PDF as a buffer.
 * Server-side only — renderToBuffer relies on Node APIs.
 *
 * Note: the template is invoked directly rather than via React.createElement.
 * renderToBuffer requires a ReactElement<DocumentProps>, and createElement
 * would type the result as ReactElement<{ data: InvoicePdfData }>, which is
 * not assignable to it. Calling the function returns the <Document> element
 * with the correct type, so no cast is needed.
 *
 * @param data - Complete invoice data for the PDF template
 * @returns PDF as Uint8Array buffer, or an error message on failure
 */
export async function generateInvoicePdfBuffer(
  data: InvoicePdfData
): Promise<{ buffer: Uint8Array | null; error: string | null }> {
  try {
    const buffer = await renderToBuffer(InvoicePdfDocument({ data }))

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
