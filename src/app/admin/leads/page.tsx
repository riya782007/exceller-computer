import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { LeadStatusSelect } from './lead-status-select'

type Lead = Pick<Database['public']['Tables']['leads']['Row'], 'id' | 'full_name' | 'phone' | 'email' | 'device_type' | 'brand' | 'issue_summary' | 'service_interest' | 'estimated_value' | 'source' | 'status' | 'created_at'>

export const metadata: Metadata = { title: 'Leads' }

export default async function LeadsPage() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('leads').select('id, full_name, phone, email, device_type, brand, issue_summary, service_interest, estimated_value, source, status, created_at').order('created_at', { ascending: false }).limit(100)
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load leads: {error.message}</div>
  const leads: Lead[] = data ?? []
  const open = leads.filter((lead) => !['converted', 'lost'].includes(lead.status)).length

  return <div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Sales pipeline</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Website leads</h1><p className="mt-2 text-sm text-slate-600">Turn estimator, enquiry, and WhatsApp contacts into a visible follow-up queue.</p></div><div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900"><strong>{open}</strong> leads need attention</div></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Customer', 'Need', 'Estimate', 'Source', 'Received', 'Status'].map((heading) => <th key={heading} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{leads.length ? leads.map((lead) => <tr key={lead.id} className="align-top hover:bg-slate-50"><td className="px-5 py-4"><p className="text-sm font-bold text-slate-900">{lead.full_name || 'Unnamed enquiry'}</p><a href={`tel:${lead.phone}`} className="mt-1 block text-xs font-semibold text-brand-700 hover:text-brand-900">{lead.phone}</a>{lead.email && <p className="mt-1 text-xs text-slate-500">{lead.email}</p>}</td><td className="max-w-72 px-5 py-4"><p className="text-sm text-slate-800">{[lead.device_type, lead.brand, lead.service_interest].filter(Boolean).join(' · ') || 'General enquiry'}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{lead.issue_summary || 'No issue details supplied'}</p></td><td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">{lead.estimated_value === null ? '—' : formatCurrency(lead.estimated_value)}</td><td className="whitespace-nowrap px-5 py-4 text-xs capitalize text-slate-600">{lead.source || 'website'}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDateTime(lead.created_at)}</td><td className="px-5 py-4"><LeadStatusSelect leadId={lead.id} status={lead.status} /></td></tr>) : <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No leads yet. Website enquiries will appear here after the visitor submits a form.</td></tr>}</tbody></table></div></div></div>
}
