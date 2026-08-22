'use client'

import Link from 'next/link'
import { type KeyboardEvent, useState } from 'react'

const journeys = [
  { id: 'repair', navLabel: 'Repair my device', eyebrow: 'Repair with clarity', title: 'Fix the device you already trust.', copy: 'Choose the symptom, see a realistic range and only approve work after the workshop confirms the diagnosis.', details: ['Guided price range', 'Diagnosis before final quote', 'Approval before repair'], href: '/estimator', action: 'Get a repair estimate', accent: 'from-brand-700 via-blue-700 to-slate-950', icon: '🔧' },
  { id: 'upgrade', navLabel: 'Make my device faster', eyebrow: 'Make it feel new', title: 'Spend on speed, not a premature replacement.', copy: 'Explore SSD and RAM upgrades based on how the machine is actually used, with compatibility confirmed before work starts.', details: ['Workload-led recommendations', 'Compatibility check first', 'Data-aware upgrade path'], href: '/services/ssd-upgrade', action: 'Explore speed upgrades', accent: 'from-cyan-700 via-blue-700 to-slate-950', icon: '⚡' },
  { id: 'buy', navLabel: 'Choose the right computer', eyebrow: 'Buying guidance', title: 'Choose a machine for the job, not the hype.', copy: 'Tell Exeller Assist the workload and budget. It can explain the trade-offs, then hand you to the workshop for a verified recommendation.', details: ['Office, study and creative workloads', 'No fake stock promises', 'Human-verified recommendation'], href: '#agent', action: 'Ask Exeller Assist', accent: 'from-violet-700 via-indigo-700 to-slate-950', icon: '💻' },
  { id: 'business', navLabel: 'Support my business IT', eyebrow: 'Business IT support', title: 'Keep your team working, not waiting.', copy: 'For offices and institutions, start with a clear IT support conversation and build the right AMC or fleet-support plan.', details: ['Fleet-aware conversation', 'Transparent scope before contract', 'One accountable local team'], href: '/services/corporate-it-amc', action: 'Discuss business IT', accent: 'from-emerald-700 via-teal-700 to-slate-950', icon: '🏢' },
] as const

type JourneyId = (typeof journeys)[number]['id']

export function ServiceJourney() {
  const [selectedId, setSelectedId] = useState<JourneyId>('repair')
  const selectedIndex = journeys.findIndex((journey) => journey.id === selectedId)
  const selected = journeys[selectedIndex] ?? journeys[0]

  function selectJourney(index: number, focus = false) {
    const target = journeys[index]
    if (!target) return
    setSelectedId(target.id)
    if (focus) document.getElementById(`service-journey-tab-${target.id}`)?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = journeys.length - 1
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); selectJourney(index === lastIndex ? 0 : index + 1, true) }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); selectJourney(index === 0 ? lastIndex : index - 1, true) }
    if (event.key === 'Home') { event.preventDefault(); selectJourney(0, true) }
    if (event.key === 'End') { event.preventDefault(); selectJourney(lastIndex, true) }
  }

  function openAgent() {
    window.dispatchEvent(new Event('open-exeller-assist'))
  }

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-black uppercase tracking-[0.18em] text-brand-700">Your service desk, before the visit</p><h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choose the outcome. We&apos;ll make the next step obvious.</h2><p className="mt-4 text-base leading-7 text-slate-600">The convenience of a modern service experience—built for real computer repair, where an honest diagnosis matters more than a rushed promise.</p></div>
        <div className="mt-10 grid gap-4 lg:grid-cols-[.85fr_1.15fr] lg:gap-6">
          <div role="tablist" aria-label="Choose a service journey" aria-orientation="vertical" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {journeys.map((journey, index) => {
              const isSelected = journey.id === selected.id
              return <button key={journey.id} id={`service-journey-tab-${journey.id}`} role="tab" type="button" tabIndex={isSelected ? 0 : -1} aria-selected={isSelected} aria-controls={`service-journey-panel-${journey.id}`} onClick={() => selectJourney(index)} onKeyDown={(event) => handleTabKeyDown(event, index)} className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition duration-300 ${isSelected ? 'border-brand-300 bg-white shadow-lg shadow-brand-100/60' : 'border-slate-200 bg-white/60 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white'}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${isSelected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700 group-hover:bg-brand-50'}`}>{journey.icon}</span><span><span className="block text-sm font-black text-slate-950">{journey.navLabel}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{journey.eyebrow}</span></span><span className={`ml-auto text-lg transition ${isSelected ? 'translate-x-0 text-brand-700' : '-translate-x-1 text-slate-300 group-hover:translate-x-0'}`}>→</span></button>
            })}
          </div>
          <article id={`service-journey-panel-${selected.id}`} role="tabpanel" aria-labelledby={`service-journey-tab-${selected.id}`} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${selected.accent} p-7 text-white shadow-2xl shadow-slate-300 sm:p-10`}>
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/15 bg-white/5" /><div className="absolute -bottom-24 right-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
            <div className="relative max-w-xl"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">{selected.icon}</span><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">{selected.eyebrow}</p></div><h3 className="mt-7 text-3xl font-black tracking-tight sm:text-4xl">{selected.title}</h3><p className="mt-4 max-w-lg text-base leading-7 text-blue-50/90">{selected.copy}</p><ul className="mt-7 grid gap-3 sm:grid-cols-3">{selected.details.map((detail) => <li key={detail} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs font-bold leading-5 text-white">✓ {detail}</li>)}</ul>{selected.href === '#agent' ? <button type="button" onClick={openAgent} className="mt-8 inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">{selected.action} <span className="ml-2">✦</span></button> : <Link href={selected.href} className="mt-8 inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">{selected.action} <span className="ml-2">→</span></Link>}</div>
          </article>
        </div>
      </div>
    </section>
  )
}
