import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JobWorkspace } from '@/components/admin/job-workspace'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/utils/job-status'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Job card' }

export default async function JobDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: job } = await supabase
    .from('repair_jobs')
    .select(
      `
      *,
      customer:profiles!repair_jobs_customer_id_fkey(full_name, phone),
      technician:profiles!repair_jobs_technician_id_fkey(full_name)
    `
    )
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: events } = await supabase
    .from('job_status_events')
    .select('id, from_status, to_status, created_at')
    .eq('job_id', id)
    .order('created_at', { ascending: true })

  const { data: parts } = await supabase
    .from('inventory_items')
    .select('id, sku, name, quantity')
    .eq('category', 'part')
    .gt('quantity', 0)
    .order('name')

  const { data: allocated } = await supabase
    .from('job_parts_allocated')
    .select('id, quantity, unit_price, item_id')
    .eq('job_id', id)

  const customer = job.customer as { full_name: string; phone: string | null } | null
  const technician = job.technician as { full_name: string } | null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">{job.job_card_number}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {job.device_brand} {job.device_model}
        </h1>
        <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
          {getStatusLabel(job.status)}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Customer</p>
          <p className="font-medium">{customer?.full_name}</p>
          <p className="text-gray-600">{customer?.phone}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Technician</p>
          <p className="font-medium">{technician?.full_name ?? 'Unassigned'}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Estimate</p>
          <p className="font-medium">{job.estimated_cost != null ? formatCurrency(Number(job.estimated_cost)) : '—'}</p>
        </div>
      </div>
      <p className="rounded-lg border bg-white p-4 text-sm text-gray-700">{job.reported_fault}</p>
      <JobWorkspace
        jobId={job.id}
        status={job.status}
        diagnosis={job.diagnosis}
        estimatedCost={job.estimated_cost}
        notes={job.notes}
        parts={parts ?? []}
      />
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Parts used</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {(allocated ?? []).length === 0 ? <li>None yet</li> : null}
          {(allocated ?? []).map((row) => (
              <li key={row.id}>
                Part {row.item_id.slice(0, 8)} × {row.quantity} @ {formatCurrency(Number(row.unit_price))}
              </li>
            ))}
        </ul>
      </section>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Audit trail</h2>
        <ol className="mt-2 space-y-1 text-sm text-gray-600">
          {(events ?? [])
            .map((event) => (
              <li key={event.id}>
                {event.from_status ?? '—'} → {event.to_status} · {formatDateTime(event.created_at)}
              </li>
            ))}
        </ol>
      </section>
    </div>
  )
}
