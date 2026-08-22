import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/utils/job-status'
import { JobWorkspace } from './job-workspace'

type JobDetail = Pick<
  Database['public']['Tables']['repair_jobs']['Row'],
  | 'id'
  | 'job_card_number'
  | 'device_type'
  | 'device_brand'
  | 'device_model'
  | 'serial_number'
  | 'reported_fault'
  | 'diagnosis'
  | 'estimated_cost'
  | 'final_cost'
  | 'status'
  | 'received_at'
  | 'updated_at'
  | 'notes'
> & {
  customer: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'email' | 'phone' | 'address'> | null
  technician: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export const metadata: Metadata = { title: 'Repair Job' }

export default async function RepairJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('repair_jobs')
    .select(`
      id, job_card_number, device_type, device_brand, device_model, serial_number,
      reported_fault, diagnosis, estimated_cost, final_cost, status, received_at,
      updated_at, notes,
      customer:profiles!repair_jobs_customer_id_fkey(full_name, email, phone, address),
      technician:profiles!repair_jobs_technician_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()
  const job: JobDetail = data

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Link href="/admin/jobs" className="text-sm font-bold text-brand-700 hover:text-brand-900">← All repair jobs</Link><p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Job card {job.job_card_number}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{job.device_brand} {job.device_model || job.device_type}</h1><p className="mt-2 text-sm text-slate-600">Received {formatDateTime(job.received_at)} · Last updated {formatDateTime(job.updated_at)}</p></div><span className={`inline-flex self-start rounded-full px-3 py-1.5 text-sm font-bold ${getStatusColor(job.status)}`}>{getStatusLabel(job.status)}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6"><JobWorkspace jobId={job.id} status={job.status} diagnosis={job.diagnosis} estimatedCost={job.estimated_cost} finalCost={job.final_cost} notes={job.notes} /></div>
        <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Device intake</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Device</dt><dd className="mt-1 font-semibold text-slate-950">{job.device_type} · {job.device_brand} {job.device_model || ''}</dd></div><div><dt className="text-slate-500">Serial / tag</dt><dd className="mt-1 font-mono text-slate-800">{job.serial_number || 'Not recorded'}</dd></div><div><dt className="text-slate-500">Reported fault</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-800">{job.reported_fault}</dd></div><div><dt className="text-slate-500">Assigned technician</dt><dd className="mt-1 font-semibold text-slate-800">{job.technician?.full_name || 'Unassigned'}</dd></div></dl></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Customer</h2>{job.customer ? <div className="mt-5 space-y-2 text-sm"><p className="font-bold text-slate-950">{job.customer.full_name}</p>{job.customer.phone && <a href={`tel:${job.customer.phone}`} className="block font-semibold text-brand-700 hover:text-brand-900">{job.customer.phone}</a>}{job.customer.email && <a href={`mailto:${job.customer.email}`} className="block text-slate-700 hover:text-brand-700">{job.customer.email}</a>}{job.customer.address && <p className="pt-2 leading-6 text-slate-600">{job.customer.address}</p>}</div> : <p className="mt-5 text-sm text-slate-500">Customer details are unavailable.</p>}</section><section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Financial snapshot</p><div className="mt-4 grid grid-cols-2 gap-4"><div><p className="text-xs text-slate-400">Estimate</p><p className="mt-1 text-lg font-black">{job.estimated_cost === null ? '—' : formatCurrency(job.estimated_cost)}</p></div><div><p className="text-xs text-slate-400">Final cost</p><p className="mt-1 text-lg font-black">{job.final_cost === null ? '—' : formatCurrency(job.final_cost)}</p></div></div></section></aside>
      </div>
    </div>
  )
}
