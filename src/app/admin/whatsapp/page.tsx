import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'WhatsApp',
}

export default async function WhatsAppPage() {
  const supabase = await createServerSupabaseClient()

  const { data: sessions, error } = await supabase
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
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading chat sessions: {error.message}</p>
      </div>
    )
  }

  const getBotStateColor = (state: string): string => {
    switch (state) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-amber-100 text-amber-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sessions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Monitor WhatsApp conversations and manage escalations
        </p>
      </div>

      {/* Status summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Active (Bot)</p>
          <p className="text-xl font-bold text-green-700">
            {sessions?.filter(s => s.bot_state === 'active').length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Paused (Human)</p>
          <p className="text-xl font-bold text-amber-700">
            {sessions?.filter(s => s.bot_state === 'paused').length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Escalated</p>
          <p className="text-xl font-bold text-red-700">
            {sessions?.filter(s => s.bot_state === 'escalated').length ?? 0}
          </p>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">State</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Message</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sessions && sessions.length > 0 ? (
              sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-gray-700">
                    {session.phone_number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {(session.customer as { full_name: string } | null)?.full_name || 'Unknown'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getBotStateColor(session.bot_state)}`}>
                      {session.bot_state}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {session.last_message_at ? formatDateTime(session.last_message_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                    {session.escalation_reason || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No chat sessions found. Sessions will appear when customers message via WhatsApp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
