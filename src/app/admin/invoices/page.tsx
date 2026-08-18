import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Invoices',
}

function paymentClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-amber-100 text-amber-800'
    case 'partial':
      return 'bg-blue-100 text-blue-800'
    case 'refunded':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default async function InvoicesPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(
      `
      id,
      invoice_number,
      total,
      payment_status,
      created_at,
      customer:profiles!invoices_customer_id_fkey(full_name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return <ErrorState message="Could not load invoices." />
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="GST invoices generated on the server. Totals come from the tax engine."
        action={
          <Button asChild>
            <Link href="/admin/invoices/new">Create invoice</Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(invoices ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No invoices yet.
                </td>
              </tr>
            ) : (
              (invoices ?? []).map((invoice) => {
                const customer = invoice.customer as { full_name: string } | null
                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/invoices/${invoice.id}`} className="font-medium text-brand-600">
                        {invoice.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">{customer?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(invoice.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs capitalize ${paymentClass(invoice.payment_status)}`}>
                        {invoice.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
