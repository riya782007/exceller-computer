'use client'

import { updateInvoicePaymentStatus } from '@/lib/actions/invoices'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import type { PaymentStatus } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function InvoicePaymentForm({
  invoiceId,
  status,
}: {
  invoiceId: string
  status: PaymentStatus
}): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function onSubmit(formData: FormData): Promise<void> {
    setError(null)
    setSuccess(null)
    const result = await updateInvoicePaymentStatus({
      invoice_id: invoiceId,
      payment_status: String(formData.get('payment_status')),
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    setSuccess('Payment status saved')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      <label className="text-sm">
        Payment status
        <select name="payment_status" defaultValue={status} className="mt-1 block h-9 rounded-md border px-3 text-sm">
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="partial">partial</option>
          <option value="cancelled">cancelled</option>
          <option value="refunded">refunded</option>
        </select>
      </label>
      <Button type="submit" size="sm">
        Update
      </Button>
    </form>
  )
}
