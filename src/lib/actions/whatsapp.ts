'use server'

import { revalidatePath } from 'next/cache'
import { chatSessionUpdateSchema } from '@/lib/validations/schemas'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

export async function updateChatSessionState(input: {
  session_id: string
  bot_state: 'active' | 'paused' | 'escalated'
  escalation_reason?: string
}): Promise<ActionResult<undefined>> {
  try {
    await requireRole('admin')
    const parsed = chatSessionUpdateSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Invalid conversation update.' }

    const update = {
      bot_state: parsed.data.bot_state,
      escalation_reason: parsed.data.escalation_reason?.trim() || null,
      escalated_at: parsed.data.bot_state === 'escalated' ? new Date().toISOString() : null,
    }

    const { error } = await createAdminClient()
      .from('chat_sessions')
      .update(update)
      .eq('id', parsed.data.session_id)
    if (error) return { success: false, error: 'Could not update the conversation state.' }

    revalidatePath('/admin/whatsapp')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You are not authorised to manage conversations.' }
  }
}
