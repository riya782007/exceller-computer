'use client'

import { assignTechnician, transitionJobStatus } from '@/lib/actions/jobs'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getNextStatuses, getStatusColor, getStatusLabel, isValidTransition } from '@/lib/utils/job-status'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Badge } from '@/components/ui/badge'
import type { JobStatus } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition, type ReactElement } from 'react'

export interface KanbanJob {
  id: string
  job_card_number: string
  device_type: string
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

const COLUMN_TITLES: Record<JobStatus, string> = {
  received: 'Received',
  diagnosed: 'Diagnosed',
  quoted: 'Quoted',
  approved: 'Approved',
  in_repair: 'In Repair',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

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
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    const supabase = createClient()
    const channel = supabase
      .channel('repair-jobs-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_jobs' }, () => {
        router.refresh()
      })
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
    if (job.status === next) return
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await transitionJobStatus({ job_id: job.id, new_status: next })
      if (!result.success) {
        setError(result.error)
        return
      }
      setJobs((current) => current.map((item) => (item.id === job.id ? { ...item, status: next } : item)))
      setSuccess(`${job.job_card_number} moved to ${getStatusLabel(next)}`)
      router.refresh()
    })
  }

  function assign(job: KanbanJob, technicianId: string): void {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await assignTechnician({
        job_id: job.id,
        technician_id: technicianId || null,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      const tech = technicians.find((item) => item.id === technicianId) ?? null
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, technician: tech ? { id: tech.id, full_name: tech.full_name } : null } : item
        )
      )
      setSuccess(tech ? `${job.job_card_number} assigned to ${tech.full_name}` : `${job.job_card_number} unassigned`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      {jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No job cards yet. Create one to populate the board.</p>
      ) : null}
      <div className="flex h-[calc(100vh-13rem)] gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((status) => (
          <section
            key={status}
            className="flex w-72 shrink-0 flex-col rounded-lg border bg-gray-50"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const id = event.dataTransfer.getData('text/job-id') || draggingId
              const job = jobs.find((item) => item.id === id)
              if (!job) return
              if (!isValidTransition(job.status, status) && job.status !== status) {
                setError(`Cannot move from ${getStatusLabel(job.status)} to ${getStatusLabel(status)}`)
                return
              }
              move(job, status)
              setDraggingId(null)
            }}
          >
            <header className="flex items-center justify-between border-b px-3 py-2">
              <h2 className="text-sm font-semibold text-gray-800">{COLUMN_TITLES[status]}</h2>
              <span className="text-xs tabular-nums text-gray-500">{grouped[status].length}</span>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {grouped[status].length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-gray-400">No jobs</p>
              ) : null}
              {grouped[status].map((job) => (
                <article
                  key={job.id}
                  draggable
                  onDragStart={(event) => {
                    setDraggingId(job.id)
                    event.dataTransfer.setData('text/job-id', job.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  className="cursor-grab rounded-lg border bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/jobs/${job.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                      {job.job_card_number}
                    </Link>
                    <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">{job.customer?.full_name ?? 'Unknown customer'}</p>
                  <p className="text-xs text-gray-600">
                    {job.device_type} · {job.device_brand} {job.device_model}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">{job.reported_fault}</p>
                  <p className="mt-2 text-xs text-gray-600">Technician: {job.technician?.full_name ?? 'Unassigned'}</p>
                  <p className="text-xs text-gray-600">
                    Est. {job.estimated_cost != null ? formatCurrency(job.estimated_cost) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
                  {canAssign ? (
                    <label className="mt-2 block text-xs text-gray-500">
                      Assign technician
                      <select
                        className="mt-1 w-full rounded border bg-white px-2 py-1 text-xs"
                        value={job.technician?.id ?? ''}
                        disabled={pending}
                        onChange={(event) => assign(job, event.target.value)}
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
