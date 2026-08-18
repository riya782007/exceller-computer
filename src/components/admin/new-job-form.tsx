'use client'

import { createRepairJob } from '@/lib/actions/jobs'
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

export function NewJobForm({
  customers,
  technicians,
}: {
  customers: Option[]
  technicians: Option[]
}): ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setError(null)
    const technicianId = String(formData.get('technician_id') ?? '')
    const result = await createRepairJob({
      customer_id: String(formData.get('customer_id') ?? ''),
      technician_id: technicianId || undefined,
      device_type: String(formData.get('device_type') ?? 'Laptop'),
      device_brand: String(formData.get('device_brand') ?? ''),
      device_model: String(formData.get('device_model') ?? ''),
      serial_number: String(formData.get('serial_number') ?? ''),
      reported_fault: String(formData.get('reported_fault') ?? ''),
      estimated_cost: formData.get('estimated_cost') ? Number(formData.get('estimated_cost')) : undefined,
      notes: String(formData.get('notes') ?? ''),
    })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.push(`/admin/jobs/${result.data.id}`)
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-2xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
      <div>
        <Label htmlFor="customer_id">Customer</Label>
        <select id="customer_id" name="customer_id" required className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
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
        <select id="technician_id" name="technician_id" className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
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
          <Input id="device_type" name="device_type" defaultValue="Laptop" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="device_brand">Brand</Label>
          <select id="device_brand" name="device_brand" required className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
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
          <Input id="device_model" name="device_model" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="serial_number">Serial number</Label>
          <Input id="serial_number" name="serial_number" className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="reported_fault">Reported fault</Label>
        <Textarea id="reported_fault" name="reported_fault" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="estimated_cost">Estimated cost (optional)</Label>
        <Input id="estimated_cost" name="estimated_cost" type="number" min={0} step="0.01" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" className="mt-1" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Create job card'}
      </Button>
    </form>
  )
}
