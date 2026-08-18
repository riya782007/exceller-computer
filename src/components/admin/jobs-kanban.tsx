'use client'

import { assignTechnician, transitionJobStatus } from '@/lib/actions/jobs'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getNextStatuses, getStatusColor, getStatusLabel } from '@/lib/utils/job-status'
import type { JobStatus } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition, type ReactElement } from 'react'

export interface KanbanJob {
  id: string
  job_card_number: string
  device_brand: string
  device_model: string | null
  reported_fault: string
  status: JobStatus
  estimated_cost: number | null
  created_at: string
  customer: { full_name: string } | null
  technician: { id: string; full_name: string } | null
}

interface TechnicianOption {
  id: string
  full_name: string
}

const COLUMNS: JobStatus[] = [
  'received',
  'diagnosed',
  'quoted',
  'approved',
  'in_repair',
  'ready',
  'delivered',
  'cancelled',
]

export function JobsKanban({
  initialJobs,
  technicians,
  canAssign,
}: {
  initialJobs: KanbanJob[]
  technicians: TechnicianOption[]
  canAssign: boolean
}): ReactElement {
  const [jobs, setJobs] = useState(initialJobs)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('repair-jobs-board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'repair_jobs' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [router])

  const grouped = useMemo(() => {
    const map: Record<JobStatus, KanbanJob[]> = {
      received: [],
      diagnosed: [],
      quoted: [],
      approved: [],
      in_repair: [],
      ready: [],
      delivered: [],
      cancelled: [],
    }
    for (const job of jobs) {
      map[job.status].push(job)
    }
    return map
  }, [jobs])

  function move(job: KanbanJob, next: JobStatus): void {
    setError(null)
    startTransition(async () => {
      const result = await transitionJobStatus({ job_id: job.id, new_status: next })
      if (!result.success) {
        setError(result.error)
        return
      }
      setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, status: next } : item)))
      router.refresh()
    })
  }

  function assign(jobId: string, technicianId: string): void {
    setError(null)
    startTransition(async () => {
      const result = await assignTechnician({
        job_id: jobId,
        technician_id: technicianId || null,
      })
      if (!result.success) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <section key={status} className="w-72 shrink-0 rounded-lg border bg-gray-50">
            <header className="flex items-center justify-between border-b px-3 py-2">
              <h2 className="text-sm font-semibold text-gray-800">{getStatusLabel(status)}</h2>
              <span className="text-xs text-gray-500">{grouped[status].length}</span>
            </header>
            <div className="space-y-2 p-2">
              {grouped[status].map((job) => (
                <article key={job.id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <a href={`/admin/jobs/${job.id}`} className="text-sm font-semibold text-brand-700">
                    {job.job_card_number}
                  </a>
                  <p className="mt-1 text-sm text-gray-900">{job.customer?.full_name ?? 'Walk-in'}</p>
                  <p className="text-xs text-gray-600">
                    {job.device_brand} {job.device_model}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{job.reported_fault}</p>
                  <p className="mt-2 text-xs text-gray-600">
                    Tech: {job.technician?.full_name ?? 'Unassigned'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Est: {job.estimated_cost != null ? formatCurrency(job.estimated_cost) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                  {canAssign ? (
                    <label className="mt-2 block text-xs text-gray-500">
                      Assign
                      <select
                        className="mt-1 w-full rounded border bg-white px-2 py-1 text-xs"
                        defaultValue={job.technician?.id ?? ''}
                        disabled={pending}
                        onChange={(event) => assign(job.id, event.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.full_name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {getNextStatuses(job.status).map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={pending}
                        onClick={() => move(job, next)}
                        className="rounded border px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {getStatusLabel(next)}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
