'use client'

import { useState, useTransition } from 'react'
import { transitionRepairJobStatus, updateRepairJobWork } from '@/lib/actions/jobs'
import { getNextStatuses, getStatusLabel } from '@/lib/utils/job-status'
import type { JobStatus } from '@/types'

interface JobWorkspaceProps {
  jobId: string
  status: JobStatus
  diagnosis: string | null
  estimatedCost: number | null
  finalCost: number | null
  notes: string | null
}

export function JobWorkspace({ jobId, status, diagnosis, estimatedCost, finalCost, notes }: JobWorkspaceProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  const nextStatuses = getNextStatuses(status)

  function saveWork(formData: FormData) {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const estimated = String(formData.get('estimatedCost') ?? '')
      const final = String(formData.get('finalCost') ?? '')
      const result = await updateRepairJobWork({
        jobId,
        diagnosis: String(formData.get('diagnosis') ?? ''),
        estimated_cost: estimated ? Number(estimated) : undefined,
        final_cost: final ? Number(final) : undefined,
        notes: String(formData.get('notes') ?? ''),
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setMessage('Repair work details saved.')
    })
  }

  function changeStatus(nextStatus: JobStatus) {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await transitionRepairJobStatus({ jobId, newStatus: nextStatus })
      if (!result.success) {
        setError(result.error)
        return
      }
      setMessage(`Job moved to ${getStatusLabel(nextStatus)}.`)
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">Move the repair forward</p>
            <p className="mt-1 text-sm text-slate-600">Only valid lifecycle steps are available. Status changes are enforced by the database.</p>
          </div>
          {nextStatuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((nextStatus) => <button key={nextStatus} disabled={isPending} onClick={() => changeStatus(nextStatus)} className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-700 disabled:opacity-50">Mark {getStatusLabel(nextStatus)}</button>)}
            </div>
          ) : <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">This job is complete</span>}
        </div>
      </section>

      <form action={saveWork} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-950">Technician workbench</h2><p className="mt-1 text-sm text-slate-600">Record diagnosis, approved costs, and handover notes in the job card.</p></div><button disabled={isPending} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">{isPending ? 'Saving…' : 'Save work update'}</button></div>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="text-sm font-semibold text-slate-900">Diagnosis</span><textarea name="diagnosis" defaultValue={diagnosis ?? ''} rows={5} placeholder="What failed, what was tested, and the recommended repair…" className={inputClass} /></label><label className="block"><span className="text-sm font-semibold text-slate-900">Estimated repair cost (₹)</span><input name="estimatedCost" type="number" min="0" step="0.01" defaultValue={estimatedCost ?? ''} className={inputClass} /></label><label className="block"><span className="text-sm font-semibold text-slate-900">Final billed cost (₹)</span><input name="finalCost" type="number" min="0" step="0.01" defaultValue={finalCost ?? ''} className={inputClass} /></label><label className="block sm:col-span-2"><span className="text-sm font-semibold text-slate-900">Internal handover notes</span><textarea name="notes" defaultValue={notes ?? ''} rows={4} placeholder="Parts used, QC outcome, customer instructions, pickup note…" className={inputClass} /></label></div>
      </form>
    </div>
  )
}
