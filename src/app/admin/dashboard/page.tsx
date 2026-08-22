import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = { title: 'Dashboard' }

type FunnelStatus = 'new' | 'contacted' | 'qualified' | 'converted'

const funnelStatuses: FunnelStatus[] = ['new', 'contacted', 'qualified', 'converted']
const statusCopy: Record<FunnelStatus, { label: string; className: string }> = {
  new: { label: 'New enquiries', className: 'bg-blue-50 text-blue-800 ring-blue-100' },
  contacted: { label: 'Contacted', className: 'bg-violet-50 text-violet-800 ring-violet-100' },
  qualified: { label: 'Ready for quote', className: 'bg-amber-50 text-amber-900 ring-amber-100' },
  converted: { label: 'Converted', className: 'bg-emerald-50 text-emerald-800 ring-emerald-100' },
}

export default async function DashboardPage() {
  const supabase = createAdminClient()
  const isAdmin = true

  const [jobsResult, inventoryResult, invoicesResult] = await Promise.all([
    supabase.from('repair_jobs').select('status', { count: 'exact', head: true }).not('status', 'in', '(delivered,cancelled)'),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
  ])

  const funnelResults = isAdmin
    ? await Promise.all(funnelStatuses.map((status) => supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', status)))
    : []
  const leadLoadError = isAdmin && funnelResults.some((result) => result.error)
  const leadCounts: Record<FunnelStatus, number> = { new: 0, contacted: 0, qualified: 0, converted: 0 }
  if (!leadLoadError) funnelResults.forEach((result, index) => { leadCounts[funnelStatuses[index]] = result.count ?? 0 })
  const needsAttention = leadCounts.new + leadCounts.contacted + leadCounts.qualified

  const stats = [
    { label: 'Active repairs', value: jobsResult.count ?? 0, copy: 'Work that still needs a clear next update.', icon: '🔧', tone: 'bg-blue-50 text-blue-800' },
    { label: 'New customer demand', value: isAdmin && !leadLoadError ? leadCounts.new : '—', copy: isAdmin ? leadLoadError ? 'Demand data needs attention before it can be trusted.' : 'Website and assisted enquiries waiting for a reply.' : 'Available to authorised sales staff.', icon: '✦', tone: 'bg-violet-50 text-violet-800' },
    { label: 'Pending invoices', value: invoicesResult.count ?? 0, copy: 'Payments that need an owner review.', icon: '🧾', tone: 'bg-amber-50 text-amber-900' },
    { label: 'Stock records', value: inventoryResult.count ?? 0, copy: 'Parts and saleable inventory under control.', icon: '📦', tone: 'bg-emerald-50 text-emerald-800' },
  ]

  return <div className="mx-auto max-w-7xl pb-8">
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-300 sm:px-8 sm:py-10"><div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10 bg-white/5" /><div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Exeller service command</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Make every customer&apos;s next step clear.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A local repair operation can feel as easy as a premium service app when demand, diagnosis, approvals and updates stay in one accountable flow.</p></div><div className="flex flex-wrap gap-3">{isAdmin && <Link href="/admin/leads" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-50">Review demand {!leadLoadError && needsAttention > 0 ? `(${needsAttention})` : ''}</Link>}<Link href="/admin/jobs/new" className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20">Create repair intake</Link></div></div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-slate-700">{stat.label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{stat.value}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${stat.tone}`}>{stat.icon}</span></div><p className="mt-4 text-xs leading-5 text-slate-500">{stat.copy}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Customer demand flow</p><h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Do not let a good enquiry become a missed opportunity.</h2></div>{isAdmin && <Link href="/admin/leads" className="text-sm font-bold text-brand-700 hover:text-brand-900">Open lead desk →</Link>}</div>{isAdmin && leadLoadError ? <p role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-800">Lead funnel data could not be loaded. The counts are intentionally hidden so the team does not act on a false empty queue. Open the lead desk after checking the Supabase connection and access policy.</p> : isAdmin ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{funnelStatuses.map((status) => <div key={status} className={`rounded-2xl p-4 ring-1 ${statusCopy[status].className}`}><p className="text-2xl font-black">{leadCounts[status]}</p><p className="mt-1 text-xs font-bold leading-5">{statusCopy[status].label}</p></div>)}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">Lead conversion controls are restricted to the owner and authorised sales team.</p>}<div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><strong className="text-slate-900">Service-standard reminder:</strong> respond with the next action, not just an acknowledgement—estimate, diagnostic appointment, WhatsApp handoff, or a clear reason why more information is needed.</div></article>
      <aside className="rounded-3xl bg-brand-700 p-6 text-white shadow-lg shadow-brand-200"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Experience controls</p><h2 className="mt-3 text-2xl font-black tracking-tight">The service app advantage—without losing workshop accountability.</h2><div className="mt-6 space-y-3">{isAdmin && <Link href="/admin/agent/studio" className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"><span><span className="block text-sm font-black">Visitor Agent Studio</span><span className="mt-1 block text-xs leading-5 text-blue-100">Review recommendations, public imagery and verified action links.</span></span><span>→</span></Link>}{isAdmin && <Link href="/admin/agent" className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"><span><span className="block text-sm font-black">Owner Copilot</span><span className="mt-1 block text-xs leading-5 text-blue-100">Turn operational signals into a practical next-step plan.</span></span><span>→</span></Link>}<Link href="/admin/whatsapp" className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 p-4 transition hover:bg-white/15"><span><span className="block text-sm font-black">Human conversations</span><span className="mt-1 block text-xs leading-5 text-blue-100">Keep the WhatsApp handoff personal and under team control.</span></span><span>→</span></Link></div></aside></section>
    <section className="mt-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Run the workshop</p><h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Fast routes for the team.</h2></div><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ href: '/admin/jobs/new', icon: '＋', title: 'New repair intake', copy: 'Create a complete job record from the first customer conversation.' }, { href: '/admin/inventory/new', icon: '◫', title: 'Add inventory', copy: 'Keep parts and saleable stock visible before promising availability.' }, { href: '/admin/invoices/new', icon: '⌁', title: 'Create invoice', copy: 'Issue an itemised record after the approved work is complete.' }, { href: '/admin/whatsapp', icon: '◌', title: 'Open conversation desk', copy: 'Review handoffs and keep a human in control of replies.' }].map((action) => <Link key={action.href} href={action.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg font-black text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">{action.icon}</span><h3 className="mt-5 text-sm font-black text-slate-950">{action.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{action.copy}</p><span className="mt-5 inline-flex text-xs font-bold text-brand-700">Open <span className="ml-1 transition group-hover:translate-x-1">→</span></span></Link>)}</div></section>
  </div>
}
