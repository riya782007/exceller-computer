import type { Metadata } from 'next'
import { OwnerCopilot } from './copilot'

export const metadata: Metadata = { title: 'Owner Copilot' }

export default function OwnerCopilotPage() {
  return <div className="mx-auto max-w-7xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">AI decision support</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Owner Copilot</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Private, grounded guidance for operations, service quality, follow-up, and growth. Recommendations remain under owner control.</p></div><OwnerCopilot /></div>
}
