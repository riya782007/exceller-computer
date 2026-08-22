import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { formatDateTime } from '@/lib/utils'
import { SessionControls } from './session-controls'

type WhatsAppSession = Pick<
  Database['public']['Tables']['chat_sessions']['Row'],
  'id' | 'phone_number' | 'bot_state' | 'last_message_at' | 'escalation_reason'
> & {
  customer: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null
}

export const metadata: Metadata = {
  title: 'WhatsApp Inbox',
}

function stateClass(state: string): string {
  switch (state) {
    case 'active': return 'bg-emerald-100 text-emerald-800'
    case 'paused': return 'bg-amber-100 text-amber-800'
    case 'escalated': return 'bg-red-100 text-red-800'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export default async function WhatsAppPage() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      phone_number,
      bot_state,
      last_message_at,
      escalation_reason,
      customer:profiles!chat_sessions_customer_id_fkey(full_name)
    `)
    .order('last_message_at', { ascending: false })
    .limit(50)

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Could not load the WhatsApp inbox: {error.message}</div>
  }

  const sessions: WhatsAppSession[] = data ?? []
  const counts = {
    active: sessions.filter((session) => session.bot_state === 'active').length,
    paused: sessions.filter((session) => session.bot_state === 'paused').length,
    escalated: sessions.filter((session) => session.bot_state === 'escalated').length,
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Customer communication</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">WhatsApp Inbox</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every verified inbound message is captured here. Take over any conversation before a reply is sent.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><strong>Safe launch mode:</strong> message capture and human takeover are live; automatic AI replies remain disabled until they are approved and configured.</div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ['Active queue', counts.active, 'bg-emerald-50 text-emerald-800'],
          ['Human takeover', counts.paused, 'bg-amber-50 text-amber-800'],
          ['Owner escalation', counts.escalated, 'bg-red-50 text-red-800'],
        ].map(([label, value, className]) => <div key={label as string} className={`rounded-2xl border p-5 ${className as string}`}><p className="text-sm font-semibold">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Latest conversations</h2><span className="text-xs text-slate-500">Newest activity first</span></div>
        <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr>{['Customer', 'State', 'Last inbound message', 'Escalation note', 'Control'].map((label) => <th key={label} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
          {sessions.length > 0 ? sessions.map((session) => <tr key={session.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{session.customer?.full_name || 'New WhatsApp customer'}</p><p className="mt-1 font-mono text-xs text-slate-500">{session.phone_number}</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${stateClass(session.bot_state)}`}>{session.bot_state}</span></td><td className="px-5 py-4 text-sm text-slate-600">{session.last_message_at ? formatDateTime(session.last_message_at) : '—'}</td><td className="max-w-60 px-5 py-4 text-sm text-slate-600">{session.escalation_reason || '—'}</td><td className="px-5 py-4"><SessionControls sessionId={session.id} state={session.bot_state} /></td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">No conversations yet. Once the webhook is configured, verified inbound messages will appear here.</td></tr>}
        </tbody></table></div>
      </div>
    </div>
  )
}
