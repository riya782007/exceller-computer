'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRepairJob } from '@/lib/actions/jobs'

interface ProfileOption { id: string; full_name: string; phone: string | null }

export function JobForm({ customers, technicians }: { customers: ProfileOption[]; technicians: ProfileOption[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const estimatedCost = String(formData.get('estimatedCost') ?? '')
      const result = await createRepairJob({
        customer_id: String(formData.get('customerId') ?? ''),
        technician_id: String(formData.get('technicianId') ?? '') || undefined,
        device_type: String(formData.get('deviceType') ?? ''),
        device_brand: String(formData.get('deviceBrand') ?? ''),
        device_model: String(formData.get('deviceModel') ?? ''),
        serial_number: String(formData.get('serialNumber') ?? ''),
        reported_fault: String(formData.get('reportedFault') ?? ''),
        estimated_cost: estimatedCost ? Number(estimatedCost) : undefined,
        notes: String(formData.get('notes') ?? ''),
      })
      if (!result.success) { setError(result.error); return }
      router.push('/admin/jobs')
      router.refresh()
    })
  }

  const fieldClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
  if (customers.length === 0) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900"><h2 className="font-bold">No customer profiles are available yet.</h2><p className="mt-2 text-sm leading-6">The current repair-job system requires a customer profile. Import or create the customer profile first; the next CRM migration will add walk-in customer intake without requiring a login.</p></div>

  return <form action={submit} className="max-w-4xl space-y-6">{error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Intake details</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><label><span className="text-sm font-semibold">Customer</span><select required name="customerId" className={fieldClass}><option value="">Choose customer…</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}{customer.phone ? ` · ${customer.phone}` : ''}</option>)}</select></label><label><span className="text-sm font-semibold">Assign technician</span><select name="technicianId" className={fieldClass}><option value="">Unassigned</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.full_name}</option>)}</select></label><label><span className="text-sm font-semibold">Device type</span><input required name="deviceType" placeholder="Laptop, desktop, printer…" className={fieldClass} /></label><label><span className="text-sm font-semibold">Brand</span><input required name="deviceBrand" placeholder="Dell, HP, Lenovo…" className={fieldClass} /></label><label><span className="text-sm font-semibold">Model</span><input name="deviceModel" placeholder="Inspiron 15 3511" className={fieldClass} /></label><label><span className="text-sm font-semibold">Serial / service tag</span><input name="serialNumber" className={fieldClass} /></label></div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Reported issue</h2><div className="mt-5 grid gap-5"><label><span className="text-sm font-semibold">What did the customer report?</span><textarea required name="reportedFault" minLength={5} rows={4} placeholder="Describe the symptom, circumstances, and urgency." className={fieldClass} /></label><label><span className="text-sm font-semibold">Initial estimate (₹)</span><input name="estimatedCost" type="number" min="0" step="0.01" className={fieldClass} /></label><label><span className="text-sm font-semibold">Front-desk notes</span><textarea name="notes" rows={3} placeholder="Accessories received, physical condition, promised follow-up…" className={fieldClass} /></label></div></section><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={pending} className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">{pending ? 'Creating job…' : 'Create job card'}</button></div></form>
}
