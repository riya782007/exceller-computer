'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateLeadStatus } from '@/lib/actions/leads-admin'
import { cn } from '@/lib/utils'
import { IconCheck, IconPhone, IconWhatsApp } from '@/components/admin/icons'
import { StatusPill, type PillTone } from '@/components/admin/ui'

export type LeadStatusValue = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'

export interface InboxLead {
  id: string
  name: string
  phone: string
  need: string
  detail: string | null
  value: string | null
  source: string
  status: LeadStatusValue
  /** Pre-computed on the server so every viewer sees the same wording. */
  waitLabel: string
  /** Drives the urgency accent — set from lead age while still unanswered. */
  urgency: 'fresh' | 'warm' | 'overdue' | 'none'
  /** Null when the stored number cannot be trusted, so we never open a chat with a stranger. */
  whatsappHref: string | null
  telHref: string | null
}

const STATUS_TONE: Record<LeadStatusValue, PillTone> = {
  new: 'brand',
  contacted: 'violet',
  qualified: 'warning',
  converted: 'success',
  lost: 'neutral',
}

const STATUS_LABEL: Record<LeadStatusValue, string> = {
  new: 'Needs reply',
  contacted: 'Contacted',
  qualified: 'Quoting',
  converted: 'Won',
  lost: 'Closed',
}

const URGENCY_RAIL: Record<InboxLead['urgency'], string> = {
  fresh: 'bg-emerald-400',
  warm: 'bg-amber-400',
  overdue: 'bg-rose-500',
  none: 'bg-transparent',
}

/**
 * One actionable enquiry. The owner should be able to answer a customer from
 * this row without opening another screen — that is the whole point of putting
 * the inbox on the dashboard.
 */
export function LeadInboxRow({ lead }: { lead: InboxLead }) {
  const [status, setStatus] = useState<LeadStatusValue>(lead.status)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function mark(next: LeadStatusValue) {
    if (pending || status === next) return
    const previous = status
    setStatus(next)
    setError(null)
    startTransition(async () => {
      const result = await updateLeadStatus({ leadId: lead.id, status: next })
      if (!result.success) {
        setStatus(previous)
        setError(result.error)
      }
    })
  }

  /**
   * Record the contact *before* handing off to WhatsApp or the dialler. Awaiting
   * the write means the status cannot silently fail while the owner is in
   * another app; only then do we open the link.
   */
  async function contactVia(href: string, newTab: boolean) {
    if (status === 'new') {
      setError(null)
      const result = await updateLeadStatus({ leadId: lead.id, status: 'contacted' })
      if (result.success) {
        setStatus('contacted')
      } else {
        setError(result.error)
      }
    }
    if (newTab) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = href
    }
  }

  const answered = status !== 'new'

  return (
    <li
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden px-5 py-4 transition-colors duration-200 hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4',
        pending && 'opacity-60'
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', answered ? 'bg-transparent' : URGENCY_RAIL[lead.urgency])} />

      {/* Who + what they need */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{lead.name}</p>
          <StatusPill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusPill>
          {!answered && lead.urgency === 'overdue' ? (
            <span className="text-[11px] font-bold text-rose-600">Waiting {lead.waitLabel}</span>
          ) : (
            <span className="text-[11px] font-medium text-slate-400">{lead.waitLabel}</span>
          )}
        </div>
        <p className="mt-1 truncate text-[13px] font-medium text-slate-700">{lead.need}</p>
        {lead.detail ? <p className="mt-0.5 truncate text-xs text-slate-500">{lead.detail}</p> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500">{lead.phone}</span>
          {lead.value ? <span className="font-semibold text-emerald-700">Est. {lead.value}</span> : null}
          <span className="capitalize">via {lead.source}</span>
          {!lead.whatsappHref && !lead.telHref ? (
            <span className="font-semibold text-amber-700">Number needs checking</span>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-1.5 text-[11px] font-semibold text-rose-600">
            {error}
          </p>
        ) : null}
      </div>

      {/* Reply in one click */}
      <div className="flex shrink-0 items-center gap-2">
        {lead.whatsappHref ? (
          <button
            type="button"
            onClick={() => void contactVia(lead.whatsappHref as string, true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-2 text-xs font-bold text-white transition hover:bg-whatsapp-dark disabled:opacity-50"
          >
            <IconWhatsApp className="h-3.5 w-3.5" />
            WhatsApp
          </button>
        ) : null}
        {lead.telHref ? (
          <button
            type="button"
            onClick={() => void contactVia(lead.telHref as string, false)}
            disabled={pending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:opacity-50"
            aria-label={`Call ${lead.name}`}
          >
            <IconPhone className="h-4 w-4" />
          </button>
        ) : null}
        {answered ? (
          <Link
            href="/admin/leads"
            className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-600 transition hover:bg-white hover:text-slate-900"
          >
            Manage
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => mark('contacted')}
            disabled={pending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            aria-label={`Mark ${lead.name} as contacted`}
            title="Mark as contacted"
          >
            <IconCheck className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  )
}
