'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoicePaymentStatus, regenerateInvoicePdf } from '@/lib/actions/invoices'

interface InvoiceActionsProps {
  invoiceId: string
  currentStatus: string
  hasPdf: boolean
}

export function InvoiceActions({ invoiceId, currentStatus, hasPdf }: InvoiceActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStatusUpdate(newStatus: string) {
    setError(null)
    setLoading(true)

    const result = await updateInvoicePaymentStatus({
      invoice_id: invoiceId,
      payment_status: newStatus,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  async function handleRegeneratePdf() {
    setError(null)
    setLoading(true)

    const result = await regenerateInvoicePdf(invoiceId)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute -bottom-12 right-0 z-10 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 shadow-sm whitespace-nowrap">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Payment status actions */}
        {currentStatus === 'pending' && (
          <button
            onClick={() => handleStatusUpdate('paid')}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            ✓ Mark Paid
          </button>
        )}

        {currentStatus === 'pending' && (
          <button
            onClick={() => handleStatusUpdate('partial')}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
          >
            Partial
          </button>
        )}

        {currentStatus === 'partial' && (
          <button
            onClick={() => handleStatusUpdate('paid')}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            ✓ Mark Paid
          </button>
        )}

        {(currentStatus === 'pending' || currentStatus === 'partial') && (
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}

        {/* Regenerate PDF */}
        {!hasPdf && (
          <button
            onClick={handleRegeneratePdf}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            🔄 Generate PDF
          </button>
        )}
      </div>
    </div>
  )
}
