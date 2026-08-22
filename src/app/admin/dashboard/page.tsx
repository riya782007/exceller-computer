import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth/require-role'
import { BUSINESS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { businessHour, startOfBusinessDayIso, telHref, whatsAppHref } from '@/lib/utils/phone'
import {
  IconArrowRight,
  IconBolt,
  IconChat,
  IconClock,
  IconGlobe,
  IconInbox,
  IconPlus,
  IconReceipt,
  IconSparkle,
  IconTarget,
  IconTrendUp,
  IconWrench,
} from '@/components/admin/icons'
import {
  EmptyState,
  MetricCard,
  NoticeBanner,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
} from '@/components/admin/ui'
import { LeadInboxRow, type InboxLead, type LeadStatusValue } from './lead-inbox-row'

export const metadata: Metadata = { title: 'Command Centre' }

/** Always render fresh — an operations console must never show cached demand. */
export const dynamic = 'force-dynamic'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
/** Rows fetched for the inbox. Metrics use exact counts, never this slice. */
const INBOX_FETCH_LIMIT = 25

function waitLabel(createdAt: string, answered: boolean): { label: string; urgency: InboxLead['urgency'] } {
  const elapsed = Date.now() - new Date(createdAt).getTime()

  if (answered) {
    if (elapsed < HOUR) return { label: 'Today', urgency: 'none' }
    if (elapsed < 24 * HOUR) return { label: `${Math.round(elapsed / HOUR)}h ago`, urgency: 'none' }
    return { label: `${Math.round(elapsed / (24 * HOUR))}d ago`, urgency: 'none' }
  }

  if (elapsed < 30 * MINUTE) return { label: 'Just now', urgency: 'fresh' }
  if (elapsed < 2 * HOUR) return { label: `${Math.max(1, Math.round(elapsed / MINUTE))} min`, urgency: 'fresh' }
  if (elapsed < 8 * HOUR) return { label: `${Math.round(elapsed / HOUR)} hours`, urgency: 'warm' }
  if (elapsed < 24 * HOUR) return { label: `${Math.round(elapsed / HOUR)} hours`, urgency: 'overdue' }
  return { label: `${Math.round(elapsed / (24 * HOUR))} days`, urgency: 'overdue' }
}

function describeNeed(lead: {
  device_type: string | null
  brand: string | null
  service_interest: string | null
}): string {
  const parts = [lead.brand, lead.device_type, lead.service_interest].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'General enquiry'
}

function greeting(): string {
  const hour = businessHour()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface MoneyTotal {
  total: number
  count: number
  failed: boolean
}

/**
 * Sums invoice totals across *all* matching rows by paging, so a busy month
 * cannot silently truncate the figure the owner is reading.
 */
async function sumInvoiceTotals(
  supabase: ReturnType<typeof createAdminClient>,
  paymentStatus: 'pending' | 'paid',
  createdOnOrAfter?: string
): Promise<MoneyTotal> {
  const PAGE = 1000
  let total = 0
  let count = 0
  let from = 0

  for (;;) {
    let query = supabase.from('invoices').select('total').eq('payment_status', paymentStatus)
    if (createdOnOrAfter) query = query.gte('created_at', createdOnOrAfter)

    const { data, error } = await query.range(from, from + PAGE - 1)
    if (error) return { total: 0, count: 0, failed: true }

    const rows = data ?? []
    total += rows.reduce((sum, row) => sum + (row.total ?? 0), 0)
    count += rows.length
    if (rows.length < PAGE) break
    from += PAGE
  }

  return { total, count, failed: false }
}

export default async function DashboardPage() {
  const actor = await getCurrentUser()
  const isOwner = actor?.role === 'admin'

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <NoticeBanner tone="danger" title="Database connection is not configured">
          The console cannot reach Supabase because <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> is
          missing. Add it in your hosting environment variables and redeploy — no data is shown until then, so nothing
          here can be mistaken for a real figure.
        </NoticeBanner>
      </div>
    )
  }

  const dayStart = startOfBusinessDayIso()

  const [activeJobs, readyJobs, lowStock, escalations, leadRows, newLeadCount, openLeadCount, wonCount, lostCount] =
    await Promise.all([
      supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).not('status', 'in', '(delivered,cancelled)'),
      supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase.from('inventory_items').select('id', { count: 'exact', head: true }).lte('quantity', 2),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('bot_state', 'escalated'),
      isOwner
        ? supabase
            .from('leads')
            .select(
              'id, full_name, phone, device_type, brand, service_interest, issue_summary, estimated_value, source, status, created_at'
            )
            .in('status', ['new', 'contacted', 'qualified'])
            .order('created_at', { ascending: true })
            .limit(INBOX_FETCH_LIMIT)
        : Promise.resolve({ data: null, error: null, count: null }),
      isOwner
        ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new')
        : Promise.resolve({ count: null, error: null }),
      isOwner
        ? supabase.from('leads').select('id', { count: 'exact', head: true }).in('status', ['new', 'contacted', 'qualified'])
        : Promise.resolve({ count: null, error: null }),
      isOwner
        ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'converted')
        : Promise.resolve({ count: null, error: null }),
      isOwner
        ? supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'lost')
        : Promise.resolve({ count: null, error: null }),
    ])

  const [pendingMoney, todayMoney] = await Promise.all([
    sumInvoiceTotals(supabase, 'pending'),
    sumInvoiceTotals(supabase, 'paid', dayStart),
  ])

  const leadsUnavailable = isOwner && Boolean(leadRows.error || newLeadCount.error || openLeadCount.error)
  const jobsUnavailable = Boolean(activeJobs.error || readyJobs.error)
  const stockUnavailable = Boolean(lowStock.error)
  const chatUnavailable = Boolean(escalations.error)

  const openLeads = leadRows.data ?? []
  const unansweredTotal = newLeadCount.count ?? 0
  const openTotal = openLeadCount.count ?? 0
  const won = wonCount.count ?? 0
  const lost = lostCount.count ?? 0
  const decided = won + lost
  const winRate = decided > 0 ? Math.round((won / decided) * 100) : null

  /** Value of the enquiries actually shown, so the caption can say so honestly. */
  const visiblePipeline = openLeads.reduce((sum, lead) => sum + (lead.estimated_value ?? 0), 0)

  const inbox: InboxLead[] = openLeads
    .slice()
    .sort((a, b) => {
      if (a.status === 'new' && b.status !== 'new') return -1
      if (b.status === 'new' && a.status !== 'new') return 1
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    .slice(0, 6)
    .map((lead) => {
      const answered = lead.status !== 'new'
      const wait = waitLabel(lead.created_at, answered)
      const need = describeNeed(lead)
      const message = `Hello${lead.full_name ? ` ${lead.full_name}` : ''}, this is ${BUSINESS.name} regarding your ${need} enquiry. How can we help?`

      return {
        id: lead.id,
        name: lead.full_name?.trim() || 'New enquiry',
        phone: lead.phone,
        need,
        detail: lead.issue_summary?.trim() || null,
        value: lead.estimated_value === null ? null : formatCurrency(lead.estimated_value),
        source: (lead.source ?? 'website').replace(/_/g, ' '),
        status: lead.status as LeadStatusValue,
        waitLabel: wait.label,
        urgency: wait.urgency,
        whatsappHref: whatsAppHref(lead.phone, message),
        telHref: telHref(lead.phone),
      }
    })

  const overdueCount = inbox.filter((lead) => lead.urgency === 'overdue' && lead.status === 'new').length
  const notShown = Math.max(0, openTotal - inbox.length)

  return (
    <div>
      {/* Orientation: who is here, what the business looks like right now */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-slate-900 px-6 py-7 text-white sm:px-8">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">
              {greeting()}, {actor?.fullName ?? 'Owner'}
            </p>
            <h1 className="mt-2.5 text-[1.9rem] font-bold leading-tight tracking-tight sm:text-[2.1rem]">
              {leadsUnavailable
                ? 'Enquiry data is unavailable'
                : unansweredTotal > 0
                  ? `${unansweredTotal} customer${unansweredTotal === 1 ? '' : 's'} waiting for your reply`
                  : 'Every enquiry has been answered'}
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-300">
              {leadsUnavailable
                ? 'Figures are hidden until the connection recovers, so you never plan around a wrong number.'
                : unansweredTotal > 0
                  ? 'Customers who hear back within the hour are far more likely to bring the device in. Reply straight from the inbox below.'
                  : 'Your AI assistant is handling website questions. Use the time to move repairs forward and bill completed work.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {!todayMoney.failed ? (
                <StatusPill tone="neutral" className="bg-white/10 text-white ring-white/20">
                  <IconTrendUp className="h-3 w-3" />
                  {todayMoney.total > 0
                    ? `${formatCurrency(todayMoney.total)} invoiced &amp; paid today`
                    : 'Nothing invoiced and paid today yet'}
                </StatusPill>
              ) : null}
              {!chatUnavailable && (escalations.count ?? 0) > 0 ? (
                <StatusPill tone="warning" className="bg-amber-400/15 text-amber-100 ring-amber-300/30">
                  <IconChat className="h-3 w-3" />
                  {escalations.count} chat{escalations.count === 1 ? '' : 's'} need a human
                </StatusPill>
              ) : null}
              {!jobsUnavailable && (readyJobs.count ?? 0) > 0 ? (
                <StatusPill tone="brand" className="bg-white/10 text-white ring-white/20">
                  <IconWrench className="h-3 w-3" />
                  {readyJobs.count} ready for pickup
                </StatusPill>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-slate-900 transition hover:bg-brand-50"
            >
              <IconPlus className="h-4 w-4" />
              Book a repair
            </Link>
            {isOwner ? (
              <Link
                href="/admin/agent"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-white/20"
              >
                <IconSparkle className="h-4 w-4" />
                Ask Copilot
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Money and workload at a glance — each card states what the number means */}
      <section className="stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={IconTarget}
          tone={unansweredTotal > 0 ? 'rose' : 'emerald'}
          label="Awaiting first reply"
          value={leadsUnavailable ? 'Unavailable' : unansweredTotal}
          meaning={
            leadsUnavailable
              ? 'Could not be read from the database just now.'
              : unansweredTotal > 0
                ? 'Every hour of silence loses work to the next shop.'
                : 'Nobody is waiting. This is what good service looks like.'
          }
          href={isOwner ? '/admin/leads' : undefined}
        />
        <MetricCard
          icon={IconTrendUp}
          tone="brand"
          label="Open enquiries"
          value={leadsUnavailable ? 'Unavailable' : openTotal}
          meaning={
            leadsUnavailable
              ? 'Could not be read from the database just now.'
              : visiblePipeline > 0
                ? `${formatCurrency(visiblePipeline)} estimated across the ${openLeads.length} oldest shown below.`
                : 'Enquiries you have not yet won or lost.'
          }
          note={winRate === null ? undefined : `${winRate}% win rate`}
          href={isOwner ? '/admin/leads' : undefined}
        />
        <MetricCard
          icon={IconWrench}
          tone="slate"
          label="Repairs in progress"
          value={jobsUnavailable ? 'Unavailable' : (activeJobs.count ?? 0)}
          meaning={
            jobsUnavailable
              ? 'Could not be read from the database just now.'
              : 'Devices you are accountable for right now.'
          }
          note={!jobsUnavailable && (readyJobs.count ?? 0) > 0 ? `${readyJobs.count} ready` : undefined}
          href="/admin/jobs"
        />
        <MetricCard
          icon={IconReceipt}
          tone={pendingMoney.total > 0 ? 'amber' : 'emerald'}
          label="Money not yet collected"
          value={pendingMoney.failed ? 'Unavailable' : pendingMoney.total > 0 ? formatCurrency(pendingMoney.total) : '₹0'}
          meaning={
            pendingMoney.failed
              ? 'Could not be read from the database just now.'
              : pendingMoney.total > 0
                ? `Across ${pendingMoney.count} invoice${pendingMoney.count === 1 ? '' : 's'} still marked pending.`
                : 'Nothing outstanding. Cash flow is clean.'
          }
          href="/admin/invoices"
        />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* The inbox: reply without leaving the dashboard */}
        <Panel className="animate-rise overflow-hidden">
          <PanelHeader
            icon={IconInbox}
            title="Customer inbox"
            hint="Website, estimator and AI enquiries — longest wait first."
            action={
              isOwner ? (
                <Link
                  href="/admin/leads"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition hover:text-brand-900"
                >
                  All enquiries
                  <IconArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
          />

          {!isOwner ? (
            <PanelBody>
              <EmptyState
                icon={IconTarget}
                title="Sales inbox is owner-only"
                description="Customer contact details are restricted. Your repair queue is on the Repair Jobs screen."
              />
            </PanelBody>
          ) : leadsUnavailable ? (
            <PanelBody>
              <NoticeBanner tone="danger" title="Enquiries could not be loaded">
                Counts are hidden on purpose so you never assume an empty inbox. Confirm the Supabase connection, then
                reload this page.
              </NoticeBanner>
            </PanelBody>
          ) : inbox.length === 0 ? (
            <PanelBody>
              <EmptyState
                icon={IconInbox}
                title="No open enquiries"
                description="New website, estimator and AI assistant enquiries land here automatically with the customer's phone number and what they need."
                action={
                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <IconGlobe className="h-3.5 w-3.5" />
                    View the public site
                  </Link>
                }
              />
            </PanelBody>
          ) : (
            <>
              {overdueCount > 0 ? (
                <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50/70 px-5 py-2.5 text-[11px] font-bold text-rose-700">
                  <IconClock className="h-3.5 w-3.5" />
                  {overdueCount} enquir{overdueCount === 1 ? 'y has' : 'ies have'} been waiting more than 8 hours
                </div>
              ) : null}
              <ul className="divide-y divide-slate-100">
                {inbox.map((lead) => (
                  <LeadInboxRow key={lead.id} lead={lead} />
                ))}
              </ul>
              {notShown > 0 ? (
                <div className="border-t border-slate-100 px-5 py-3">
                  <Link
                    href="/admin/leads"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition hover:text-brand-900"
                  >
                    {notShown} more open enquir{notShown === 1 ? 'y' : 'ies'}
                    <IconArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          {/* What the software is doing for the owner while they work */}
          <Panel className="animate-rise">
            <PanelHeader
              icon={IconBolt}
              title="Working for you right now"
              hint="Automation that answers customers without your time."
            />
            <PanelBody className="space-y-2.5">
              <AutomationRow
                icon={IconGlobe}
                title="Website assistant"
                value="Answering 24/7"
                detail="Explains services and price ranges in English, Hindi and Hinglish, then hands over to you."
                href="/admin/agent/studio"
                enabled={isOwner}
              />
              <AutomationRow
                icon={IconChat}
                title="WhatsApp capture"
                value={
                  chatUnavailable
                    ? 'Status unavailable'
                    : (escalations.count ?? 0) > 0
                      ? `${escalations.count} waiting for you`
                      : 'Logging every message'
                }
                detail="Customer messages are recorded and escalated to a human when it matters."
                href="/admin/whatsapp"
                enabled
                alert={chatUnavailable || (escalations.count ?? 0) > 0}
              />
              <AutomationRow
                icon={IconSparkle}
                title="Owner Copilot"
                value="Ready when you are"
                detail="Turns today's numbers into a short, practical action plan."
                href="/admin/agent"
                enabled={isOwner}
              />
            </PanelBody>
          </Panel>

          {/* Things that will cost money if ignored */}
          <Panel className="animate-rise">
            <PanelHeader icon={IconClock} title="Needs attention" hint="Small gaps that quietly cost you revenue." />
            <PanelBody className="space-y-2.5">
              <AttentionRow
                label="Devices ready for pickup"
                count={readyJobs.count ?? 0}
                unavailable={jobsUnavailable}
                copy="Message the customer so the bench clears and you get paid."
                href="/admin/jobs"
                good="No devices waiting on the shelf."
              />
              <AttentionRow
                label="Parts running low"
                count={lowStock.count ?? 0}
                unavailable={stockUnavailable}
                copy="Reorder before you have to turn a paying repair away."
                href="/admin/inventory"
                good="Stock levels are healthy."
              />
              <AttentionRow
                label="Unpaid invoices"
                count={pendingMoney.count}
                unavailable={pendingMoney.failed}
                copy={pendingMoney.total > 0 ? `${formatCurrency(pendingMoney.total)} outstanding across these invoices.` : ''}
                href="/admin/invoices"
                good="Every invoice is settled."
              />
              {!BUSINESS.gst ? (
                <NoticeBanner tone="warning" title="GST number not configured">
                  Tax invoices are legal documents. Add your GSTIN in Settings before issuing more invoices.
                </NoticeBanner>
              ) : null}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ sub-blocks */

function AutomationRow({
  icon: Icon,
  title,
  value,
  detail,
  href,
  enabled,
  alert = false,
}: {
  icon: (props: { className?: string }) => React.ReactElement
  title: string
  value: string
  detail: string
  href: string
  enabled: boolean
  alert?: boolean
}) {
  const body = (
    <>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          alert ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-slate-900">{title}</span>
          {!alert ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping-slow" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          ) : null}
        </span>
        <span className={`mt-0.5 block text-[11px] font-bold ${alert ? 'text-amber-700' : 'text-emerald-700'}`}>
          {value}
        </span>
        <span className="mt-1 block text-[11px] leading-4 text-slate-500">{detail}</span>
      </span>
    </>
  )

  if (!enabled) {
    return <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">{body}</div>
  }

  return (
    <Link
      href={href}
      className="lift flex gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 hover:shadow-[0_10px_28px_-20px_rgba(15,23,42,0.35)]"
    >
      {body}
    </Link>
  )
}

function AttentionRow({
  label,
  count,
  copy,
  href,
  good,
  unavailable = false,
}: {
  label: string
  count: number
  copy: string
  href: string
  good: string
  unavailable?: boolean
}) {
  if (unavailable) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <IconClock className="h-3 w-3" />
        </span>
        <span className="text-[11px] font-semibold text-slate-500">{label} — status unavailable right now.</span>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <IconTrendUp className="h-3 w-3" />
        </span>
        <span className="text-[11px] font-semibold text-slate-500">{good}</span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="lift flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 hover:shadow-[0_10px_28px_-20px_rgba(15,23,42,0.35)]"
    >
      <span className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-lg bg-slate-900 px-1.5 text-xs font-bold tabular-nums text-white">
        {count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-slate-900">{label}</span>
        {copy ? <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{copy}</span> : null}
      </span>
      <IconArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
    </Link>
  )
}
