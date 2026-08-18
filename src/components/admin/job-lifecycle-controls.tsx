'use client'

import { assignTechnician, transitionJobStatus } from '@/lib/actions/jobs'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import { getNextStatuses, getStatusLabel } from '@/lib/utils/job-status'
import type { JobStatus } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, type ReactElement } from 'react'

interface TechnicianOption {
  id: string
  full_name: string
}

export function JobLifecycleControls({
  jobId,
  status,
  technicianId,
  technicians,
  canAssign,
}: {
  jobId: string
  status: JobStatus
  technicianId: string | null
  technicians: TechnicianOption[]
  canAssign: boolean
}): ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function move(next: JobStatus): Promise<void> {
    setPending(true)
    setError(null)
    setSuccess(null)
    const result = await transitionJobStatus({ job_id: jobId, new_status: next })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSuccess(`Status updated to ${getStatusLabel(next)}`)
    router.refresh()
  }

  async function assign(technician: string): Promise<void> {
    setPending(true)
    setError(null)
    setSuccess(null)
    const result = await assignTechnician({ job_id: jobId, technician_id: technician || null })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    setSuccess('Technician assignment saved')
    router.refresh()
  }

  const next = getNextStatuses(status)

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <h2 className="text-sm font-semibold">Lifecycle</h2>
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      {canAssign ? (
        <label className="block text-sm">
          <span className="text-gray-600">Technician</span>
          <select
            className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
            value={technicianId ?? ''}
            disabled={pending}
            onChange={(event) => void assign(event.target.value)}
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
      <div className="flex flex-wrap gap-2">
        {next.length === 0 ? <p className="text-sm text-gray-500">No further transitions.</p> : null}
        {next.map((statusOption) => (
          <Button
            key={statusOption}
            type="button"
            size="sm"
            variant={statusOption === 'cancelled' ? 'destructive' : 'outline'}
            disabled={pending}
            onClick={() => void move(statusOption)}
          >
            {getStatusLabel(statusOption)}
          </Button>
        ))}
      </div>
    </div>
  )
}
