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
      subtotal,
      total,
      tax_type,
      payment_status,
      pdf_url,
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

  // Summary stats
  const totalRevenue = invoices?.reduce((sum, inv) => inv.payment_status === 'paid' ? sum + inv.total : sum, 0) ?? 0
  const pendingAmount = invoices?.reduce((sum, inv) => inv.payment_status === 'pending' ? sum + inv.total : sum, 0) ?? 0
  const invoiceCount = invoices?.length ?? 0

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

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Invoices</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{invoiceCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Revenue (Paid)</p>
          <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tax</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">PDF</th>
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
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                      {invoice.tax_type === 'intra_state' ? 'CGST+SGST' : 'IGST'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
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
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    {invoice.pdf_url ? (
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-brand-600 hover:text-brand-800"
                        title="Download PDF"
                      >
                        📄
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400" title="PDF not available">—</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
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
