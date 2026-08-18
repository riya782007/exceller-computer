import { NextResponse, type NextRequest } from 'next/server'
import { handleCustomerMessage } from '@/lib/ai/agent'
import { logger, redactPhone } from '@/lib/logger'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { webhookPayloadSchema } from '@/lib/validations/schemas'

function phoneFromJid(jid: string): string {
  return jid.replace(/@.*/, '').replace(/[^\d]/g, '')
}

function extractText(message: Record<string, unknown> | undefined): string {
  if (!message) return ''
  const conversation = message.conversation
  if (typeof conversation === 'string') return conversation
  const extended = message.extendedTextMessage
  if (extended && typeof extended === 'object' && 'text' in extended && typeof extended.text === 'string') {
    return extended.text
  }
  return ''
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } },
        { status: 401 }
      )
    }

    const body: unknown = await request.json()
    const validation = webhookPayloadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload format' } },
        { status: 400 }
      )
    }

    const payload = validation.data
    if (payload.data.key.fromMe) {
      return NextResponse.json({ success: true, data: { ignored: true } })
    }

    const phone = phoneFromJid(payload.data.key.remoteJid)
    const text = extractText(payload.data.message)
    if (!text) {
      return NextResponse.json({ success: true, data: { ignored: true } })
    }

    const result = await handleCustomerMessage(phone, text)
    if (result.paused || !result.reply) {
      logger.info('WhatsApp bot did not auto-reply', { phone: redactPhone(phone), paused: result.paused })
      return NextResponse.json({ success: true, data: { paused: result.paused, replied: false } })
    }

    const sent = await sendWhatsAppMessage({ to: phone, text: result.reply })
    return NextResponse.json({ success: true, data: { paused: false, replied: sent.success } })
  } catch (error) {
    logger.error('WhatsApp webhook failed', { error: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'ok' })
}
