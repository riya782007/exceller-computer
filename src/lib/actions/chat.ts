'use server'

import { requireRole } from '@/lib/auth/require-role'
import { AppError, toUserMessage } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { chatSessionUpdateSchema } from '@/lib/validations/schemas'
import type { ActionResult, BotState } from '@/types'
import { z } from 'zod'

export async function setChatBotState(input: unknown): Promise<ActionResult<{ bot_state: BotState }>> {
  try {
    await requireRole('admin', 'technician')
    const data = chatSessionUpdateSchema.parse(input)
    const admin = createAdminClient()

    const patch: {
      bot_state: BotState
      escalation_reason: string | null
      escalated_at?: string
    } = {
      bot_state: data.bot_state,
      escalation_reason: data.escalation_reason ?? null,
    }

    if (data.bot_state === 'paused' || data.bot_state === 'escalated') {
      patch.escalated_at = new Date().toISOString()
    }

    const { error } = await admin.from('chat_sessions').update(patch).eq('id', data.session_id)

    if (error) {
      logger.error('setChatBotState failed', { message: error.message })
      throw new AppError('Could not update chat session', 'CHAT_UPDATE_FAILED', 400)
    }

    return { success: true, data: { bot_state: data.bot_state } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid session update' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update chat session') }
  }
}

export async function notifyStaffOfEscalation(phoneNumber: string, reason: string): Promise<void> {
  const staffPhone = process.env.STAFF_WHATSAPP_PHONE || process.env.NEXT_PUBLIC_BUSINESS_PHONE
  if (!staffPhone) {
    logger.warn('Staff WhatsApp phone not configured for escalation')
    return
  }

  await sendWhatsAppMessage({
    to: staffPhone,
    text: `Human takeover needed.\nCustomer: ${phoneNumber}\nReason: ${reason}`,
  })
}
