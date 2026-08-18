'use client'

import { createRepairJob, updateRepairJob } from '@/lib/actions/jobs'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_BRANDS } from '@/types'
import { useRouter } from 'next/navigation'
import { useState, type ReactElement } from 'react'

interface Option {
  id: string
  full_name: string
}

export interface JobFormValues {
  id?: string
  customer_id: string
  technician_id: string | null
  device_type: string
  device_brand: string
  device_model: string | null
  serial_number: string | null
  reported_fault: string
  estimated_cost: number | null
  notes: string | null
}

export function JobForm({
  customers,
  technicians,
  initial,
}: {
  customers: Option[]
  technicians: Option[]
  initial?: JobFormValues
}): ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isEdit = Boolean(initial?.id)

  async function onSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setError(null)
    setSuccess(null)
    const technicianId = String(formData.get('technician_id') ?? '')
    const payload = {
      customer_id: String(formData.get('customer_id') ?? ''),
      technician_id: technicianId || null,
      device_type: String(formData.get('device_type') ?? 'Laptop'),
      device_brand: String(formData.get('device_brand') ?? ''),
      device_model: String(formData.get('device_model') ?? ''),
      serial_number: String(formData.get('serial_number') ?? ''),
      reported_fault: String(formData.get('reported_fault') ?? ''),
      estimated_cost: formData.get('estimated_cost') ? Number(formData.get('estimated_cost')) : undefined,
      notes: String(formData.get('notes') ?? ''),
    }

    const result = isEdit && initial?.id
      ? await updateRepairJob(initial.id, payload)
      : await createRepairJob({
          ...payload,
          technician_id: technicianId || undefined,
        })

    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    if (!isEdit && 'job_card_number' in result.data) {
      router.push(`/admin/jobs/${result.data.id}`)
      router.refresh()
      return
    }
    setSuccess('Job card saved')
    router.refresh()
  }

  if (customers.length === 0 && !isEdit) {
    return (
      <ErrorState message="Add a customer first. Job cards must be linked to a customer profile." />
    )
  }

  return (
    <form action={onSubmit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      <div>
        <Label htmlFor="customer_id">Customer</Label>
        <select
          id="customer_id"
          name="customer_id"
          required
          defaultValue={initial?.customer_id}
          className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="technician_id">Technician</Label>
        <select
          id="technician_id"
          name="technician_id"
          defaultValue={initial?.technician_id ?? ''}
          className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="">Unassigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="device_type">Device type</Label>
          <Input id="device_type" name="device_type" defaultValue={initial?.device_type ?? 'Laptop'} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="device_brand">Brand</Label>
          <select
            id="device_brand"
            name="device_brand"
            required
            defaultValue={initial?.device_brand ?? 'Dell'}
            className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            {SUPPORTED_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="device_model">Model</Label>
          <Input id="device_model" name="device_model" defaultValue={initial?.device_model ?? ''} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="serial_number">Serial number</Label>
          <Input id="serial_number" name="serial_number" defaultValue={initial?.serial_number ?? ''} className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="reported_fault">Reported issue</Label>
        <Textarea id="reported_fault" name="reported_fault" required defaultValue={initial?.reported_fault} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="estimated_cost">Estimated cost</Label>
        <Input
          id="estimated_cost"
          name="estimated_cost"
          type="number"
          min={0}
          step="0.01"
          defaultValue={initial?.estimated_cost ?? ''}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ''} className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : isEdit ? 'Save job card' : 'Create job card'}
      </Button>
    </form>
  )
}
