'use client'

import Link from 'next/link'
import { type KeyboardEvent, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  IconArrowRight,
  IconBuilding,
  IconCheck,
  IconLaptop,
  IconRocket,
  IconSparkle,
  IconWrench,
  type MarketingIcon,
} from './icons'

interface Journey {
  id: 'repair' | 'upgrade' | 'buy' | 'business'
  navLabel: string
  eyebrow: string
  title: string
  copy: string
  details: string[]
  /** `null` means the CTA opens the assistant instead of navigating. */
  href: string | null
  action: string
  accent: string
  icon: MarketingIcon
}

const journeys: Journey[] = [
  {
    id: 'repair',
    navLabel: 'Repair my device',
    eyebrow: 'Repair with clarity',
    title: 'Fix the device you already trust.',
    copy: 'Choose the symptom, see a realistic range, and approve the work only after the workshop confirms the diagnosis.',
    details: ['Guided price range', 'Diagnosis before quote', 'Approval before repair'],
    href: '/estimator',
    action: 'Check repair cost',
    accent: 'from-brand-700 via-blue-700 to-slate-950',
    icon: IconWrench,
  },
  {
    id: 'upgrade',
    navLabel: 'Make my device faster',
    eyebrow: 'Make it feel new',
    title: 'Spend on speed, not a premature replacement.',
    copy: 'SSD and RAM upgrades chosen around how the machine is actually used, with compatibility confirmed before any work starts.',
    details: ['Workload-led advice', 'Compatibility checked', 'Your data preserved'],
    href: '/services/ssd-upgrade',
    action: 'Explore upgrades',
    accent: 'from-cyan-700 via-blue-700 to-slate-950',
    icon: IconRocket,
  },
  {
    id: 'buy',
    navLabel: 'Choose the right computer',
    eyebrow: 'Buying guidance',
    title: 'Choose a machine for the job, not the hype.',
    copy: 'Tell the assistant your workload and budget. It explains the trade-offs honestly, then hands you to the workshop for a verified recommendation.',
    details: ['Office, study, creative', 'No invented stock', 'Human-verified'],
    href: null,
    action: 'Ask the assistant',
    accent: 'from-violet-700 via-indigo-700 to-slate-950',
    icon: IconLaptop,
  },
  {
    id: 'business',
    navLabel: 'Support my business IT',
    eyebrow: 'Business IT support',
    title: 'Keep your team working, not waiting.',
    copy: 'For offices and institutions: a clear support conversation first, then the right AMC or fleet plan for how you actually operate.',
    details: ['Fleet-aware', 'Scope before contract', 'One accountable team'],
    href: '/services/corporate-it-amc',
    action: 'Discuss business IT',
    accent: 'from-emerald-700 via-teal-700 to-slate-950',
    icon: IconBuilding,
  },
]

export function ServiceJourney() {
  const [selectedId, setSelectedId] = useState<Journey['id']>('repair')
  const selectedIndex = journeys.findIndex((journey) => journey.id === selectedId)
  const selected = journeys[selectedIndex] ?? journeys[0]

  function selectJourney(index: number, focus = false) {
    const target = journeys[index]
    if (!target) return
    setSelectedId(target.id)
    if (focus) document.getElementById(`journey-tab-${target.id}`)?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = journeys.length - 1
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      selectJourney(index === last ? 0 : index + 1, true)
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      selectJourney(index === 0 ? last : index - 1, true)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      selectJourney(0, true)
    }
    if (event.key === 'End') {
      event.preventDefault()
      selectJourney(last, true)
    }
  }

  function openAssistant() {
    window.dispatchEvent(new Event('open-exeller-assist'))
  }

  const SelectedIcon = selected.icon

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="reveal text-xs font-black uppercase tracking-[0.18em] text-brand-700">
            Your service desk, before the visit
          </p>
          <h2 className="reveal reveal-1 mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Choose the outcome. We&apos;ll make the next step obvious.
          </h2>
          <p className="reveal reveal-2 mt-4 text-base leading-7 text-slate-600">
            The convenience of a modern service app, built for real computer repair — where an honest diagnosis matters
            more than a rushed promise.
          </p>
        </div>

        <div className="scene mt-10 grid gap-4 lg:grid-cols-[.8fr_1.2fr] lg:gap-6">
          <div
            role="tablist"
            aria-label="Choose a service journey"
            aria-orientation="vertical"
            className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1"
          >
            {journeys.map((journey, index) => {
              const isSelected = journey.id === selected.id
              const Icon = journey.icon
              return (
                <button
                  key={journey.id}
                  id={`journey-tab-${journey.id}`}
                  role="tab"
                  type="button"
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  aria-controls={`journey-panel-${journey.id}`}
                  onClick={() => selectJourney(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={cn(
                    'group flex items-center gap-3.5 rounded-2xl border p-4 text-left transition duration-300',
                    isSelected
                      ? 'border-brand-300 bg-white shadow-[0_16px_36px_-24px_rgba(29,78,216,0.55)]'
                      : 'border-slate-200 bg-white/60 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
                      isSelected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-brand-50'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{journey.navLabel}</span>
                    <span className="mt-0.5 block truncate text-[11px] leading-4 text-slate-500">{journey.eyebrow}</span>
                  </span>
                  <IconArrowRight
                    className={cn(
                      'ml-auto h-4 w-4 shrink-0 transition',
                      isSelected ? 'text-brand-700' : '-translate-x-1 text-slate-300 group-hover:translate-x-0'
                    )}
                  />
                </button>
              )
            })}
          </div>

          <article
            id={`journey-panel-${selected.id}`}
            role="tabpanel"
            aria-labelledby={`journey-tab-${selected.id}`}
            tabIndex={0}
            className={cn(
              'card-3d relative isolate overflow-hidden rounded-3xl bg-gradient-to-br p-7 text-white',
              'shadow-[0_30px_60px_-32px_rgba(15,23,42,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40 sm:p-10',
              selected.accent
            )}
          >
            <div className="aurora absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="circuit-grid absolute inset-0 opacity-30" />

            <div className="card-3d-layer relative max-w-xl">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100">{selected.eyebrow}</p>
              </div>

              <h3 className="mt-7 text-3xl font-black tracking-tight sm:text-4xl">{selected.title}</h3>
              <p className="mt-4 max-w-lg text-base leading-7 text-blue-50/90">{selected.copy}</p>

              <ul className="mt-7 grid gap-2.5 sm:grid-cols-3">
                {selected.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-[11px] font-bold leading-4 backdrop-blur"
                  >
                    <IconCheck className="mt-px h-3 w-3 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>

              {selected.href === null ? (
                <button
                  type="button"
                  onClick={openAssistant}
                  aria-haspopup="dialog"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  <IconSparkle className="h-4 w-4" />
                  {selected.action}
                </button>
              ) : (
                <Link
                  href={selected.href}
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  {selected.action}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
