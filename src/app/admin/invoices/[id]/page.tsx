import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InvoicePaymentForm } from '@/components/admin/invoice-payment-form'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Invoice' }

export default async function InvoiceDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      'id, invoice_number, total, subtotal, cgst, sgst, igst, tax_type, payment_status, pdf_url, created_at, job_id, customer:profiles!invoices_customer_id_fkey(full_name, phone)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) return <ErrorState message="Could not load this invoice." />
  if (!invoice) notFound()

  const { data: items } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, hsn_sac, amount')
    .eq('invoice_id', id)

  const customer = invoice.customer as { full_name: string; phone: string | null } | null

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoice_number}
        description={`${customer?.full_name ?? 'Customer'} · ${formatDate(invoice.created_at)}`}
      />
      <InvoicePaymentForm invoiceId={invoice.id} status={invoice.payment_status} />
      <div className="rounded-xl border bg-white p-4 text-sm">
        <p>Tax: {invoice.tax_type}</p>
        <p>Subtotal {formatCurrency(invoice.subtotal)}</p>
        <p>CGST {formatCurrency(invoice.cgst)} · SGST {formatCurrency(invoice.sgst)} · IGST {formatCurrency(invoice.igst)}</p>
        <p className="font-semibold">Total {formatCurrency(invoice.total)}</p>
        {invoice.job_id ? (
          <p className="mt-2">
            Job:{' '}
            <Link className="text-brand-700" href={`/admin/jobs/${invoice.job_id}`}>
              open job card
            </Link>
          </p>
        ) : null}
        {invoice.pdf_url ? (
          <p className="mt-2">
            <a className="text-brand-700" href={invoice.pdf_url} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          </p>
        ) : (
          <p className="mt-2 text-gray-500">PDF not stored yet.</p>
        )}
      </div>
      <ul className="rounded-xl border bg-white p-4 text-sm">
        {(items ?? []).length === 0 ? <li>No line items.</li> : null}
        {(items ?? []).map((item) => (
          <li key={item.id}>
            {item.description} × {item.quantity} · {formatCurrency(item.amount)}
            {item.hsn_sac ? ` · HSN ${item.hsn_sac}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
