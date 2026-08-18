import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { InvoiceActions } from './invoice-actions'

export const metadata: Metadata = {
  title: 'Invoice Detail',
}

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Fetch invoice with customer and job details
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      subtotal,
      tax_type,
      cgst,
      sgst,
      igst,
      total,
      payment_status,
      pdf_url,
      notes,
      created_at,
      updated_at,
      customer:profiles!invoices_customer_id_fkey(id, full_name, email, phone, address),
      job:repair_jobs!invoices_job_id_fkey(id, job_card_number, device_brand, device_model, status)
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Fetch invoice items
  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, hsn_sac, amount')
    .eq('invoice_id', id)
    .order('created_at', { ascending: true })

  const customer = invoice.customer as { id: string; full_name: string; email: string | null; phone: string | null; address: string | null } | null
  const job = invoice.job as { id: string; job_card_number: string; device_brand: string; device_model: string | null; status: string } | null

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'partial': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${getPaymentStatusColor(invoice.payment_status)}`}>
              {invoice.payment_status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Created {formatDateTime(invoice.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.pdf_url && (
            <a
              href={invoice.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              📄 Download PDF
            </a>
          )}
          <InvoiceActions
            invoiceId={invoice.id}
            currentStatus={invoice.payment_status}
            hasPdf={!!invoice.pdf_url}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items Table */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Invoice Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">HSN/SAC</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items?.map((item, index) => (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 font-mono">{item.hsn_sac || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{item.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax_type === 'intra_state' ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">CGST @ 9%</span>
                        <span className="text-gray-900">{formatCurrency(invoice.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">SGST @ 9%</span>
                        <span className="text-gray-900">{formatCurrency(invoice.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGST @ 18%</span>
                      <span className="text-gray-900">{formatCurrency(invoice.igst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-base font-bold text-brand-700">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Customer</h3>
            {customer ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">{customer.full_name}</p>
                {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
                {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
                {customer.address && <p className="text-sm text-gray-500 mt-1">{customer.address}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Customer data unavailable</p>
            )}
          </div>

          {/* Linked Job */}
          {job && (
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Linked Job</h3>
              <div className="space-y-1">
                <a href={`/admin/jobs/${job.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                  {job.job_card_number}
                </a>
                <p className="text-sm text-gray-600">{job.device_brand} {job.device_model || ''}</p>
                <p className="text-xs text-gray-500 capitalize">Status: {job.status.replace('_', ' ')}</p>
              </div>
            </div>
          )}

          {/* Invoice Meta */}
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Tax Type</dt>
                <dd className="font-medium text-gray-900 capitalize">{invoice.tax_type.replace('_', '-')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(invoice.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">{formatDate(invoice.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">PDF</dt>
                <dd className="text-gray-900">{invoice.pdf_url ? '✅ Available' : '❌ Not generated'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
