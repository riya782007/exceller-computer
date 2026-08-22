import Link from 'next/link'
import type { Metadata } from 'next'
import { getAgentStudioState } from '@/lib/actions/public-agent'
import { AgentStudio } from './agent-studio'

export const metadata: Metadata = { title: 'Visitor Agent Studio' }

export default async function VisitorAgentStudioPage() {
  const state = await getAgentStudioState()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Public customer experience</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Visitor Agent Studio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Control the reviewed recommendations, public images and payment links the website assistant may display. Service facts still come from the approved catalog; no visitor can access internal jobs, invoices or private media.</p>
        </div>
        <Link href="/" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50">Preview public site ↗</Link>
      </div>
      <AgentStudio state={state} />
    </div>
  )
}
