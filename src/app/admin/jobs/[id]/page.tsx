import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JobForm } from '@/components/admin/job-form'
import { JobLifecycleControls } from '@/components/admin/job-lifecycle-controls'
import { JobWorkspace } from '@/components/admin/job-workspace'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/auth/require-role'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/utils/job-status'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Job card' }

export default async function JobDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const { data: job, error } = await supabase
    .from('repair_jobs')
    .select(
      `
      *,
      customer:profiles!repair_jobs_customer_id_fkey(full_name, phone),
      technician:profiles!repair_jobs_technician_id_fkey(id, full_name)
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return <ErrorState message="Could not load this job card." />
  }
  if (!job) notFound()

  const [{ data: events }, { data: parts }, { data: allocated }, { data: customers }, { data: technicians }] =
    await Promise.all([
      supabase
        .from('job_status_events')
        .select('id, from_status, to_status, created_at')
        .eq('job_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('inventory_items')
        .select('id, sku, name, quantity')
        .eq('category', 'part')
        .gt('quantity', 0)
        .order('name'),
      supabase.from('job_parts_allocated').select('id, quantity, unit_price, item_id').eq('job_id', id),
      supabase.from('profiles').select('id, full_name').eq('role', 'customer').eq('is_active', true).order('full_name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'technician').eq('is_active', true).order('full_name'),
    ])

  const partIds = [...new Set((allocated ?? []).map((row) => row.item_id))]
  const { data: allocatedNames } =
    partIds.length > 0
      ? await supabase.from('inventory_items').select('id, sku, name').in('id', partIds)
      : { data: [] as Array<{ id: string; sku: string; name: string }> }

  const namesById = new Map((allocatedNames ?? []).map((item) => [item.id, item]))
  const customer = job.customer as { full_name: string; phone: string | null } | null
  const technician = job.technician as { id: string; full_name: string } | null

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${job.device_brand} ${job.device_model ?? ''}`.trim()}
        description={`Job ${job.job_card_number} · ${customer?.full_name ?? 'Customer'} · created ${formatDateTime(job.created_at)}`}
        action={
          <Link href="/admin/jobs" className="text-sm text-brand-700 hover:underline">
            Back to board
          </Link>
        }
      />
      <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Customer</p>
          <p className="font-medium">{customer?.full_name ?? '—'}</p>
          <p className="text-gray-600">{customer?.phone ?? '—'}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Technician</p>
          <p className="font-medium">{technician?.full_name ?? 'Unassigned'}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm">
          <p className="text-gray-500">Estimated cost</p>
          <p className="font-medium">
            {job.estimated_cost != null ? formatCurrency(Number(job.estimated_cost)) : '—'}
          </p>
        </div>
      </div>

      <JobLifecycleControls
        jobId={job.id}
        status={job.status}
        technicianId={job.technician_id}
        technicians={technicians ?? []}
        canAssign={user?.role === 'admin'}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold">Edit job</h2>
        <JobForm
          customers={customers ?? []}
          technicians={technicians ?? []}
          initial={{
            id: job.id,
            customer_id: job.customer_id,
            technician_id: job.technician_id,
            device_type: job.device_type,
            device_brand: job.device_brand,
            device_model: job.device_model,
            serial_number: job.serial_number,
            reported_fault: job.reported_fault,
            estimated_cost: job.estimated_cost,
            notes: job.notes,
          }}
        />
      </section>

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
        {(allocated ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No parts allocated on this job.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {(allocated ?? []).map((row) => {
              const item = namesById.get(row.item_id)
              return (
                <li key={row.id}>
                  {item ? `${item.sku} ${item.name}` : row.item_id} × {row.quantity} @{' '}
                  {formatCurrency(Number(row.unit_price))}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold">Audit trail</h2>
        {(events ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No status events recorded yet.</p>
        ) : (
          <ol className="mt-2 space-y-1 text-sm text-gray-600">
            {(events ?? []).map((event) => (
              <li key={event.id}>
                {event.from_status ?? '—'} → {event.to_status} · {formatDateTime(event.created_at)}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
