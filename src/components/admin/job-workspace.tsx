'use client'

import { allocatePartToJob, updateRepairJob } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { canAllocateParts } from '@/lib/utils/job-status'
import type { JobStatus } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, type ReactElement } from 'react'

interface PartOption {
  id: string
  sku: string
  name: string
  quantity: number
}

export function JobWorkspace({
  jobId,
  status,
  diagnosis,
  estimatedCost,
  notes,
  parts,
}: {
  jobId: string
  status: JobStatus
  diagnosis: string | null
  estimatedCost: number | null
  notes: string | null
  parts: PartOption[]
}): ReactElement {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)

  async function saveDetails(formData: FormData): Promise<void> {
    const result = await updateRepairJob(jobId, {
      diagnosis: String(formData.get('diagnosis') ?? ''),
      estimated_cost: formData.get('estimated_cost') ? Number(formData.get('estimated_cost')) : undefined,
      notes: String(formData.get('notes') ?? ''),
    })
    setMessage(result.success ? 'Saved' : result.error)
    if (result.success) router.refresh()
  }

  async function allocate(formData: FormData): Promise<void> {
    const result = await allocatePartToJob({
      job_id: jobId,
      item_id: String(formData.get('item_id') ?? ''),
      quantity: Number(formData.get('quantity') ?? 1),
    })
    setMessage(result.success ? 'Part allocated and stock reduced' : result.error)
    if (result.success) router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={saveDetails} className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Diagnosis & quote</h2>
        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
        <div>
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Textarea id="diagnosis" name="diagnosis" defaultValue={diagnosis ?? ''} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="estimated_cost">Estimated cost</Label>
          <Input
            id="estimated_cost"
            name="estimated_cost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={estimatedCost ?? ''}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="notes">Internal notes</Label>
          <Textarea id="notes" name="notes" defaultValue={notes ?? ''} className="mt-1" />
        </div>
        <Button type="submit">Save</Button>
      </form>

      <form action={allocate} className="space-y-3 rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Allocate part (atomic stock deduction)</h2>
        {!canAllocateParts(status) ? (
          <p className="text-sm text-amber-700">Parts can be allocated only after approval, while the job is in repair.</p>
        ) : null}
        <div>
          <Label htmlFor="item_id">Part</Label>
          <select
            id="item_id"
            name="item_id"
            required
            disabled={!canAllocateParts(status)}
            className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="">Select part</option>
            {parts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.sku} — {part.name} ({part.quantity} in stock)
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} disabled={!canAllocateParts(status)} className="mt-1" />
        </div>
        <Button type="submit" disabled={!canAllocateParts(status)}>
          Deduct stock
        </Button>
      </form>
    </div>
  )
}
