'use client'

import { useState, useTransition } from 'react'
import { updateLeadStatus } from '@/lib/actions/leads-admin'

const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const

type LeadStatus = (typeof statuses)[number]

export function LeadStatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const [value, setValue] = useState(status)
  const [pending, startTransition] = useTransition()

  function change(next: LeadStatus) {
    const previous = value
    setValue(next)
    startTransition(async () => {
      const result = await updateLeadStatus({ leadId, status: next })
      if (!result.success) setValue(previous)
    })
  }

  return <select aria-label="Lead status" value={value} disabled={pending} onChange={(event) => change(event.target.value as LeadStatus)} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold capitalize text-slate-700 disabled:opacity-50">{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select>
}
