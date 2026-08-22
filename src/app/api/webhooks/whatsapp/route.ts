import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Json } from '@/types/database'

export const runtime = 'nodejs'

const MAX_WEBHOOK_BYTES = 256 * 1024

// Evolution/n8n payloads vary by enabled event. Keep the envelope narrow,
// tolerate additional provider fields, and only process actual inbound messages.
const whatsappWebhookSchema = z.object({
  event: z.string().min(1).max(100),
  instance: z.string().max(100).optional(),
  data: z.object({
    key: z.object({
      remoteJid: z.string().min(3).max(120),
      fromMe: z.boolean().default(false),
      id: z.string().min(1).max(200),
    }),
    message: z.record(z.unknown()).optional(),
    messageType: z.string().max(100).optional(),
    pushName: z.string().max(160).optional(),
  }),
})

function constantTimeEquals(received: string | null, expected: string | undefined): boolean {
  if (!received || !expected) return false
  const receivedBytes = Buffer.from(received)
  const expectedBytes = Buffer.from(expected)
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
}

function hasValidSignature(rawBody: string, received: string | null): boolean {
  const secret = process.env.WEBHOOK_SIGNING_SECRET
  if (!secret || !received) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const signature = received.replace(/^sha256=/i, '')
  return constantTimeEquals(signature, expected)
}

function normaliseWhatsAppPhone(remoteJid: string): string | null {
  const local = remoteJid.split('@')[0]?.replace(/:\d+$/, '') ?? ''
  const digits = local.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return null
  return `+${digits}`
}

function messageText(message: Record<string, unknown> | undefined): string | null {
  if (!message) return null
  const conversation = message.conversation
  if (typeof conversation === 'string') return conversation.slice(0, 4000)

  const extended = message.extendedTextMessage
  if (extended && typeof extended === 'object' && 'text' in extended && typeof extended.text === 'string') {
    return extended.text.slice(0, 4000)
  }

  const image = message.imageMessage
  if (image && typeof image === 'object' && 'caption' in image && typeof image.caption === 'string') {
    return image.caption.slice(0, 4000)
  }

  return null
}

function eventIsMessage(event: string): boolean {
  return event.toLowerCase().includes('message')
}

/**
 * Receives an authenticated relay delivery from n8n/Evolution.
 *
 * Authentication options (at least one must be configured):
 * - x-exeller-signature: HMAC-SHA256 of the raw body using WEBHOOK_SIGNING_SECRET
 * - x-webhook-secret: static secret added by an n8n relay using N8N_WEBHOOK_SECRET
 *
 * The handler intentionally persists and routes messages to the human inbox
 * only. Automated replies are not enabled until an AI provider and explicit
 * business approval rules are configured.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload too large' } }, { status: 413 })
  }

  try {
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_WEBHOOK_BYTES) {
      return NextResponse.json({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Payload too large' } }, { status: 413 })
    }

    const validHmac = hasValidSignature(rawBody, request.headers.get('x-exeller-signature'))
    const validRelaySecret = constantTimeEquals(request.headers.get('x-webhook-secret'), process.env.N8N_WEBHOOK_SECRET)
    if (!validHmac && !validRelaySecret) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized webhook' } }, { status: 401 })
    }

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON payload' } }, { status: 400 })
    }

    const parsed = whatsappWebhookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload' } }, { status: 400 })
    }

    const payload = parsed.data
    const providerEventId = payload.data.key.id
    const admin = createAdminClient()

    // Idempotency comes before message processing: provider retries become a
    // harmless successful acknowledgement rather than a duplicate chat entry.
    const { error: eventError } = await admin.from('webhook_events').insert({
      provider: 'evolution',
      provider_event_id: providerEventId,
      event_type: payload.event,
      payload: body as Json,
    })

    if (eventError?.code === '23505') {
      return NextResponse.json({ success: true, data: { received: true, duplicate: true } })
    }
    if (eventError) throw eventError

    if (!eventIsMessage(payload.event) || payload.data.key.fromMe || !payload.data.message) {
      return NextResponse.json({ success: true, data: { received: true, processed: false } })
    }

    const phone = normaliseWhatsAppPhone(payload.data.key.remoteJid)
    if (!phone) {
      await admin.from('webhook_events').update({ processing_error: 'Unsupported sender identity' }).eq('provider', 'evolution').eq('provider_event_id', providerEventId)
      return NextResponse.json({ success: true, data: { received: true, processed: false } })
    }

    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .upsert({ phone_number: phone, last_message_at: new Date().toISOString() }, { onConflict: 'phone_number' })
      .select('id, bot_state')
      .single()
    if (sessionError || !session) throw sessionError ?? new Error('Could not create chat session')

    const text = messageText(payload.data.message)
    const { error: messageError } = await admin.from('chat_messages').insert({
      session_id: session.id,
      provider_message_id: providerEventId,
      direction: 'inbound',
      message_type: payload.data.messageType ?? 'unknown',
      body: text,
      metadata: {
        event: payload.event,
        has_text: Boolean(text),
        sender_name: payload.data.pushName ?? null,
      },
    })
    if (messageError) throw messageError

    await admin
      .from('webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('provider', 'evolution')
      .eq('provider_event_id', providerEventId)

    // Always acknowledge quickly. The existing admin WhatsApp screen is the
    // human-takeover queue; sending an AI response is a separate, opt-in step.
    return NextResponse.json({ success: true, data: { received: true, processed: true, botState: session.bot_state } })
  } catch (error) {
    console.error('[whatsapp-webhook] processing failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } }, { status: 500 })
  }
}

// A safe health endpoint for deployment monitors and webhook setup checks.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'ok', service: 'exeller-whatsapp-webhook' })
}
