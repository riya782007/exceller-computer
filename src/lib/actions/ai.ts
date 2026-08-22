'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnerBusinessSnapshot } from '@/lib/ai/business-context'
import { createOpenAiResponse, OpenAiConfigurationError } from '@/lib/ai/openai-responses'
import type { ActionResult } from '@/types'

const ownerQuestionSchema = z.object({
  question: z.string().trim().min(4, 'Ask a more specific question.').max(1500, 'Keep the question below 1,500 characters.'),
})

const replyDraftSchema = z.object({
  sessionId: z.string().uuid('Invalid conversation.'),
})

const ownerInstructions = `You are Exeller Computer's private owner copilot. You help the owner run a laptop and computer repair business in New Delhi.

Rules:
- Use only the supplied business snapshot and the owner's question. Never invent live facts, prices, stock, deadlines, employee actions, policy terms, legal advice, or customer details.
- Offer concise operational guidance: prioritisation, follow-up checklists, service-desk process, sales conversion, inventory hygiene, and customer-service improvements.
- Clearly flag assumptions and recommend a human verification step for financial, GST, warranty, repair diagnosis, security, or staffing decisions.
- You cannot change data, send WhatsApp messages, create invoices, approve discounts, or make commitments. Do not claim otherwise.
- Do not request secrets, passwords, API keys, or payment information.
- Use practical Indian-English business language and short headings/bullets when useful.`

const customerDraftInstructions = `You create a safe DRAFT WhatsApp reply for Exeller Computer's human team.

Rules:
- This is only a recommendation for a human to review. Never say it has been sent.
- Be polite, concise, and use Indian English.
- Do not invent a repair diagnosis, price, part availability, warranty, collection time, technician assignment, or job status.
- If the customer asks for price or a technical conclusion, explain that the team will confirm after device details or diagnosis.
- Ask at most one useful follow-up question when information is missing.
- Never ask for passwords, OTPs, card/bank details, or secrets.
- If the message is urgent, angry, safety-related, or requests a refund, recommend human escalation rather than resolving it.
- Return only the suggested message, with no labels or explanation.`

function actionError(error: unknown): string {
  if (error instanceof OpenAiConfigurationError) return error.message
  if (error instanceof Error) return error.message
  return 'The AI service could not generate a response.'
}

export async function askOwnerCopilot(input: { question: string }): Promise<ActionResult<{ answer: string }>> {
  try {
    await requireRole('admin')
    const parsed = ownerQuestionSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid question.' }

    const context = await getOwnerBusinessSnapshot()
    const answer = await createOpenAiResponse({
      instructions: ownerInstructions,
      prompt: `${context}\n\nOwner question:\n${parsed.data.question}`,
    })

    return { success: true, data: { answer } }
  } catch (error) {
    return { success: false, error: actionError(error) }
  }
}

export async function generateWhatsAppReplyDraft(input: { sessionId: string }): Promise<ActionResult<{ draft: string }>> {
  try {
    await requireRole('admin')
    const parsed = replyDraftSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid conversation.' }

    const admin = createAdminClient()
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, bot_state')
      .eq('id', parsed.data.sessionId)
      .single()

    if (sessionError || !session) return { success: false, error: 'Conversation not found.' }
    if (session.bot_state !== 'active') {
      return { success: false, error: 'This conversation is under human control. AI drafts are disabled until you resume it.' }
    }

    const { data: message, error: messageError } = await admin
      .from('chat_messages')
      .select('body, message_type, received_at')
      .eq('session_id', session.id)
      .eq('direction', 'inbound')
      .order('received_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (messageError || !message?.body) {
      return { success: false, error: 'There is no readable inbound customer message to draft a reply for.' }
    }

    const draft = await createOpenAiResponse({
      instructions: customerDraftInstructions,
      prompt: `Latest inbound message type: ${message.message_type ?? 'unknown'}\nCustomer message:\n${message.body}`,
      maxOutputTokens: 220,
    })

    revalidatePath('/admin/whatsapp')
    return { success: true, data: { draft } }
  } catch (error) {
    return { success: false, error: actionError(error) }
  }
}
