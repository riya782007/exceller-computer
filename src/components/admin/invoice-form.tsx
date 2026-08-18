'use client'

import { createInvoice } from '@/lib/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Option {
  id: string
  label: string
}

export function InvoiceForm({
  customers,
  jobs,
}: {
  customers: Option[]
  jobs: Option[]
}): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData): Promise<void> {
    const result = await createInvoice({
      customer_id: String(formData.get('customer_id') ?? ''),
      job_id: String(formData.get('job_id') ?? '') || undefined,
      tax_type: String(formData.get('tax_type') ?? 'intra_state'),
      notes: String(formData.get('notes') ?? ''),
      items: [
        {
          description: String(formData.get('description') ?? ''),
          quantity: Number(formData.get('quantity') ?? 1),
          unit_price: Number(formData.get('unit_price') ?? 0),
          hsn_sac: String(formData.get('hsn_sac') ?? ''),
        },
      ],
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    router.push('/admin/invoices')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div>
        <Label htmlFor="customer_id">Customer</Label>
        <select id="customer_id" name="customer_id" required className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
          <option value="">Select</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="job_id">Job card (optional)</Label>
        <select id="job_id" name="job_id" className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
          <option value="">None</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="tax_type">Tax type</Label>
        <select id="tax_type" name="tax_type" className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
          <option value="intra_state">Delhi intra-state (CGST + SGST)</option>
          <option value="inter_state">Inter-state (IGST)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="description">Line item</Label>
        <Input id="description" name="description" required className="mt-1" placeholder="Screen replacement" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="quantity">Qty</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="unit_price">Rate</Label>
          <Input id="unit_price" name="unit_price" type="number" min={0} step="0.01" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="hsn_sac">HSN/SAC</Label>
          <Input id="hsn_sac" name="hsn_sac" className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" className="mt-1" />
      </div>
      <Button type="submit">Generate GST invoice</Button>
    </form>
  )
}
