import { BUSINESS } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'

function countOrZero(result: { count: number | null }): number {
  return result.count ?? 0
}

/**
 * Small, aggregate-only context for the owner copilot. It deliberately omits
 * contact details, message bodies, authentication data, and service secrets.
 */
export async function getOwnerBusinessSnapshot(): Promise<string> {
  const admin = createAdminClient()
  const [jobs, pendingInvoices, newLeads, escalations] = await Promise.all([
    admin.from('repair_jobs').select('id', { count: 'exact', head: true }).in('status', ['received', 'diagnosed', 'quoted', 'approved', 'in_repair', 'ready']),
    admin.from('invoices').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    admin.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('chat_sessions').select('id', { count: 'exact', head: true }).eq('bot_state', 'escalated'),
  ])

  return [
    `Business: ${BUSINESS.name}, a laptop and computer repair service in ${BUSINESS.address.city}.`,
    `Live operational snapshot: ${countOrZero(jobs)} active repair jobs, ${countOrZero(pendingInvoices)} pending invoices, ${countOrZero(newLeads)} new website leads, ${countOrZero(escalations)} escalated WhatsApp conversations.`,
    'Only aggregate counts are provided. Treat live business data as potentially incomplete if migration setup is not finished.',
  ].join('\n')
}
