import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Invoices',
}

export default async function InvoicesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total,
      payment_status,
      created_at,
      customer:profiles!invoices_customer_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading invoices: {error.message}</p>
      </div>
    )
  }

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-amber-100 text-amber-800'
      case 'partial': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-600">Manage GST invoices and payment tracking</p>
        </div>
        <a
          href="/admin/invoices/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Create Invoice
        </a>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices && invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <a href={`/admin/invoices/${invoice.id}`} className="font-medium text-brand-600 hover:text-brand-800">
                      {invoice.invoice_number}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {(invoice.customer as { full_name: string } | null)?.full_name || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getPaymentStatusColor(invoice.payment_status)}`}>
                      {invoice.payment_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatDate(invoice.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No invoices found. Create your first invoice to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
