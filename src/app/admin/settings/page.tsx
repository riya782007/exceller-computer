import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { BUSINESS, siteUrl } from '@/lib/constants'
import { DEFAULT_TAX_CONFIG } from '@/types'
import {
  IconAlert,
  IconArrowRight,
  IconBox,
  IconChat,
  IconCheck,
  IconGlobe,
  IconImage,
  IconReceipt,
  IconShield,
  IconSparkle,
  IconTarget,
} from '@/components/admin/icons'
import {
  NoticeBanner,
  Panel,
  PanelBody,
  PanelHeader,
  PageHeader,
  StatusPill,
} from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

type Readiness = 'live' | 'setup' | 'blocked'

interface Capability {
  icon: (props: { className?: string }) => React.ReactElement
  name: string
  /** What the owner gets in business terms — not a feature description. */
  payoff: string
  state: Readiness
  /** Exact next step when it is not live. */
  next: string
  href?: string
}

const READINESS: Record<Readiness, { tone: 'success' | 'warning' | 'danger'; label: string }> = {
  live: { tone: 'success', label: 'Live' },
  setup: { tone: 'warning', label: 'Needs setup' },
  blocked: { tone: 'danger', label: 'Action required' },
}

export default async function SettingsPage() {
  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <NoticeBanner tone="danger" title="Database connection is not configured">
          <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> is missing, so readiness cannot be measured. Add
          it in your hosting environment variables and redeploy.
        </NoticeBanner>
      </div>
    )
  }

  // Presence of an env var is a fact we can state honestly; we never print values.
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY)
  const hasWebhookSecret = Boolean(process.env.WEBHOOK_SIGNING_SECRET || process.env.N8N_WEBHOOK_SECRET)
  const hasEvolution = Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)
  const hasChatSalt = Boolean(process.env.PUBLIC_CHAT_RATE_LIMIT_SALT)
  const hasCustomCode = Boolean(process.env.ADMIN_ACCESS_CODE)

  // Probe the tables the newer features depend on, so "needs migration" is a
  // measured fact rather than a guess.
  const [offersProbe, chatProbe, mediaProbe, leadsProbe, stockProbe, quotaProbe] = await Promise.all([
    supabase.from('public_agent_offers').select('id', { count: 'exact', head: true }),
    supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
    supabase.from('business_assets').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
    // A dry-run of the quota function proves the migration landed, rather than
    // inferring protection from an environment variable alone.
    supabase.rpc('consume_public_agent_rate_limit', {
      p_key_hash: 'f'.repeat(64),
      p_max_requests: 60,
    }),
  ])

  /**
   * A missing relation and a broken connection need different advice, so the
   * error code decides the message. 42P01 = undefined table, 42883 = undefined
   * function; anything else is treated as a connection or permission fault.
   */
  function probeState(error: { code?: string | null } | null): 'ready' | 'missing' | 'unreachable' {
    if (!error) return 'ready'
    return error.code === '42P01' || error.code === '42883' ? 'missing' : 'unreachable'
  }

  const offers = probeState(offersProbe.error)
  const chat = probeState(chatProbe.error)
  const media = probeState(mediaProbe.error)
  const leadsState = probeState(leadsProbe.error)
  const stock = probeState(stockProbe.error)
  const quota = probeState(quotaProbe.error)

  const offersReady = offers === 'ready'
  const chatReady = chat === 'ready'
  const mediaReady = media === 'ready'
  const leadsReady = leadsState === 'ready'

  const CONNECTION_HINT = 'Database could not be reached. Check the Supabase connection before running any migration.'

  const capabilities: Capability[] = [
    {
      icon: IconTarget,
      name: 'Website enquiry capture',
      payoff: 'Turns anonymous visitors into a phone number and a stated need you can call back.',
      state: leadsReady ? 'live' : 'blocked',
      next: leadsReady
        ? `${leadsProbe.count ?? 0} enquiries captured so far.`
        : leadsState === 'unreachable'
          ? CONNECTION_HINT
          : 'Run the Supabase migrations so the leads table exists.',
      href: '/admin/leads',
    },
    {
      icon: IconGlobe,
      name: 'Website AI assistant',
      payoff: 'Answers service and price questions in English, Hindi and Hinglish while the shop is closed.',
      state: hasOpenAi ? (offersReady ? 'live' : 'setup') : 'setup',
      next: !hasOpenAi
        ? 'Add OPENAI_API_KEY in Vercel, then redeploy.'
        : offersReady
          ? `${offersProbe.count ?? 0} owner-approved recommendations configured.`
          : offers === 'unreachable'
            ? CONNECTION_HINT
            : 'Run migration 00010 to enable curated offers and payment links.',
      href: '/admin/agent/studio',
    },
    {
      icon: IconSparkle,
      name: 'Owner Copilot',
      payoff: 'Converts today’s numbers into a short action plan so you decide faster.',
      state: hasOpenAi ? 'live' : 'setup',
      next: hasOpenAi ? 'Ready to use from the Copilot screen.' : 'Add OPENAI_API_KEY in Vercel, then redeploy.',
      href: '/admin/agent',
    },
    {
      icon: IconChat,
      name: 'WhatsApp message capture',
      payoff: 'Keeps a written record of every customer conversation instead of one person’s phone.',
      state: hasWebhookSecret && chatReady ? 'live' : 'setup',
      next: !chatReady
        ? chat === 'unreachable'
          ? CONNECTION_HINT
          : 'Run migration 00008 to create the conversation tables.'
        : !hasWebhookSecret
          ? 'Add WEBHOOK_SIGNING_SECRET in Vercel and point your provider at the webhook URL.'
          : 'Receiving and logging messages.',
      href: '/admin/whatsapp',
    },
    {
      icon: IconImage,
      name: 'Brand media library',
      payoff: 'One approved set of photos for the website, quotes and social posts.',
      state: mediaReady ? 'live' : 'setup',
      next: mediaReady
        ? `${mediaProbe.count ?? 0} approved images stored privately.`
        : media === 'unreachable'
          ? CONNECTION_HINT
          : 'Run migration 00008 to create the media library.',
      href: '/admin/media',
    },
    {
      icon: IconReceipt,
      name: 'GST tax invoicing',
      payoff: 'Compliant invoices with a PDF you can hand over or send on WhatsApp.',
      state: BUSINESS.gst ? 'live' : 'blocked',
      next: BUSINESS.gst
        ? 'GSTIN configured and printing on invoices.'
        : 'Your GSTIN is missing. Invoices are legal documents — add it before issuing more.',
      href: '/admin/invoices',
    },
    {
      icon: IconBox,
      name: 'Parts and stock control',
      payoff: 'Stops you promising a part that is not on the shelf.',
      state: stock === 'ready' ? 'live' : 'setup',
      next:
        stock === 'ready'
          ? `${stockProbe.count ?? 0} items tracked with cost price, selling price and quantity.`
          : stock === 'unreachable'
            ? CONNECTION_HINT
            : 'Run the Supabase migrations so the inventory table exists.',
      href: '/admin/inventory',
    },
    {
      icon: IconShield,
      name: 'Public endpoint protection',
      payoff: 'Stops bots from running up your AI bill on the public chat.',
      state: hasChatSalt && quota === 'ready' ? 'live' : 'setup',
      next: !hasChatSalt
        ? 'Add PUBLIC_CHAT_RATE_LIMIT_SALT in Vercel and enable Vercel Firewall for /api/public-chat.'
        : quota === 'missing'
          ? 'Run migration 00010 — the shared request quota function is not installed yet.'
          : quota === 'unreachable'
            ? CONNECTION_HINT
            : 'Shared request quota verified and active.',
    },
  ]

  const liveCount = capabilities.filter((c) => c.state === 'live').length
  const blockers = capabilities.filter((c) => c.state === 'blocked')

  return (
    <div>
      <PageHeader
        eyebrow="Business setup"
        title="Readiness &amp; configuration"
        description="What is switched on, what it earns you, and the exact next step for anything that is not live yet."
        actions={
          <StatusPill tone={liveCount === capabilities.length ? 'success' : 'warning'}>
            <IconCheck className="h-3 w-3" />
            {liveCount} of {capabilities.length} capabilities live
          </StatusPill>
        }
      />

      {blockers.length > 0 ? (
        <div className="mb-6">
          <NoticeBanner tone="danger" title={`${blockers.length} item${blockers.length === 1 ? '' : 's'} need your attention`}>
            {blockers.map((b) => b.name).join(' · ')}. These affect compliance or customer capture, so clear them first.
          </NoticeBanner>
        </div>
      ) : null}

      {/* Capability ledger — the honest answer to "what am I paying for?" */}
      <Panel className="animate-rise overflow-hidden">
        <PanelHeader
          icon={IconAlert}
          title="What this software is doing for you"
          hint="Each line states the business payoff, current state and next action."
        />
        <ul className="divide-y divide-slate-100">
          {capabilities.map((capability) => {
            const Icon = capability.icon
            const readiness = READINESS[capability.state]
            return (
              <li key={capability.name} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    capability.state === 'live'
                      ? 'bg-emerald-50 text-emerald-700'
                      : capability.state === 'blocked'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{capability.name}</p>
                    <StatusPill tone={readiness.tone}>{readiness.label}</StatusPill>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{capability.payoff}</p>
                  <p
                    className={`mt-1 text-[11px] font-semibold leading-4 ${
                      capability.state === 'live' ? 'text-slate-400' : 'text-slate-700'
                    }`}
                  >
                    {capability.next}
                  </p>
                </div>
                {capability.href ? (
                  <Link
                    href={capability.href}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Open
                    <IconArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Legal identity */}
        <Panel className="animate-rise">
          <PanelHeader
            icon={IconReceipt}
            title="Legal &amp; invoicing identity"
            hint="Printed on every tax invoice, so it must match your GST registration."
          />
          <PanelBody className="space-y-3.5">
            <Field label="Trading name" value={BUSINESS.name} />
            <Field label="Registered entity" value={BUSINESS.legalName} />
            <Field
              label="Registered address"
              value={`${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city} – ${BUSINESS.address.pincode}`}
            />
            <Field label="GSTIN" value={BUSINESS.gst || null} missing="Required on tax invoices" />
            <Field label="Contact" value={`${BUSINESS.phoneDisplay} · ${BUSINESS.email}`} />
            <Field label="Public website" value={siteUrl()} />
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500">
              These values come from the application configuration. Ask your developer to update them if the GST
              registration differs by even one character.
            </p>
          </PanelBody>
        </Panel>

        <div className="flex flex-col gap-6">
          {/* Tax */}
          <Panel className="animate-rise">
            <PanelHeader icon={IconReceipt} title="Tax rates" hint="Applied automatically when you raise an invoice." />
            <PanelBody className="space-y-2.5">
              <RateRow label="CGST (within Delhi)" value={`${DEFAULT_TAX_CONFIG.cgstRate}%`} />
              <RateRow label="SGST (within Delhi)" value={`${DEFAULT_TAX_CONFIG.sgstRate}%`} />
              <RateRow label="IGST (other states)" value={`${DEFAULT_TAX_CONFIG.igstRate}%`} />
              <p className="pt-1 text-[11px] leading-4 text-slate-500">
                The invoice builder picks intra-state or inter-state for you and shows a live tax preview before you
                save.
              </p>
            </PanelBody>
          </Panel>

          {/* Access */}
          <Panel className="animate-rise">
            <PanelHeader icon={IconShield} title="Console access" hint="Who can reach this admin area." />
            <PanelBody className="space-y-2.5">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900">Owner access code</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    One code opens the console. No user list to maintain, no password resets.
                  </p>
                </div>
                <StatusPill tone={hasCustomCode ? 'success' : 'warning'}>
                  {hasCustomCode ? 'Custom code set' : 'Using default'}
                </StatusPill>
              </div>
              {!hasCustomCode ? (
                <NoticeBanner tone="warning" title="Change the default access code">
                  Set <span className="font-mono">ADMIN_ACCESS_CODE</span> in Vercel to a private value, then redeploy.
                  Anyone with the default code can open this console.
                </NoticeBanner>
              ) : null}
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900">WhatsApp provider link</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                    Needed only for sending messages automatically in a later phase.
                  </p>
                </div>
                <StatusPill tone={hasEvolution ? 'success' : 'neutral'}>
                  {hasEvolution ? 'Connected' : 'Not connected'}
                </StatusPill>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, missing }: { label: string; value: string | null; missing?: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      {value ? (
        <p className="mt-1 text-[13px] font-medium leading-5 text-slate-900">{value}</p>
      ) : (
        <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-bold text-rose-600">
          <IconAlert className="h-3.5 w-3.5" />
          {missing ?? 'Not configured'}
        </p>
      )}
    </div>
  )
}

function RateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
      <span className="text-[13px] text-slate-600">{label}</span>
      <span className="text-[13px] font-bold tabular-nums text-slate-900">{value}</span>
    </div>
  )
}
