import { notifyStaffOfEscalation } from '@/lib/actions/chat'
import { logger, redactPhone } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

const ESCALATION_HINTS = [
  'human',
  'staff',
  'manager',
  'agent',
  'person',
  'call me',
  'talk to someone',
  'insaan',
  'insan',
  'aadmi',
  'manager se',
  'discount',
  'sasta',
  'kam price',
  'custom price',
  'negotiate',
  'angry',
  'frustrated',
  'worst',
  'cheat',
  'scam',
  'refund',
]

export function shouldEscalate(message: string): { escalate: boolean; reason: string } {
  const text = message.toLowerCase()
  if (ESCALATION_HINTS.some((hint) => text.includes(hint))) {
    return { escalate: true, reason: 'Customer requested a human, pricing exception, or expressed frustration' }
  }
  return { escalate: false, reason: '' }
}

export async function pauseBotAndNotify(phoneNumber: string, reason: string): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('phone_number', phoneNumber)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('chat_sessions')
      .update({
        bot_state: 'paused',
        escalation_reason: reason,
        escalated_at: now,
        last_message_at: now,
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('chat_sessions').insert({
      phone_number: phoneNumber,
      bot_state: 'paused',
      escalation_reason: reason,
      escalated_at: now,
      last_message_at: now,
      context_data: {},
    })
  }

  logger.warn('WhatsApp bot paused', { phone: redactPhone(phoneNumber), reason })
  await notifyStaffOfEscalation(phoneNumber, reason)
}
