import type { Metadata } from 'next'
import { ChatSessionControls } from '@/app/admin/whatsapp/session-controls'
import { RealtimeRefresh } from '@/components/admin/realtime-refresh'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import { getWhatsAppStatus } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'WhatsApp',
}

export default async function WhatsAppPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const [{ data: sessions, error }, connection] = await Promise.all([
    supabase
      .from('chat_sessions')
      .select(
        `
      id,
      phone_number,
      bot_state,
      last_message_at,
      escalation_reason,
      customer:profiles!chat_sessions_customer_id_fkey(full_name)
    `
      )
      .order('last_message_at', { ascending: false })
      .limit(100),
    getWhatsAppStatus(),
  ])

  if (error) {
    return <ErrorState message="Could not load WhatsApp sessions." />
  }

  return (
    <div>
      <PageHeader
        title="WhatsApp"
        description="Human takeover pauses the bot. Paused sessions must not auto-reply."
      />
      <RealtimeRefresh table="chat_sessions" channelName="admin-chat-sessions" />
      <p className="mb-4 text-sm text-gray-600">
        Evolution instance: {connection.connected ? `connected (${connection.state ?? 'open'})` : connection.error ?? 'not configured'}
      </p>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Active (bot)</p>
          <p className="text-xl font-bold text-green-700">
            {sessions?.filter((session) => session.bot_state === 'active').length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Paused (human)</p>
          <p className="text-xl font-bold text-amber-700">
            {sessions?.filter((session) => session.bot_state === 'paused').length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-600">Escalated</p>
          <p className="text-xl font-bold text-red-700">
            {sessions?.filter((session) => session.bot_state === 'escalated').length ?? 0}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">State</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Last message</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(sessions ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                  No sessions yet. They appear when Evolution/n8n posts to the webhook.
                </td>
              </tr>
            ) : (
              (sessions ?? []).map((session) => {
                const customer = session.customer as { full_name: string } | null
                return (
                  <tr key={session.id}>
                    <td className="px-4 py-3 font-mono text-sm">{session.phone_number}</td>
                    <td className="px-4 py-3 text-sm">{customer?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm capitalize">{session.bot_state}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {session.last_message_at ? formatDateTime(session.last_message_at) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChatSessionControls sessionId={session.id} state={session.bot_state} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
