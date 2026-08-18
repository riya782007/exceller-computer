import { NextResponse, type NextRequest } from 'next/server'
import { webhookPayloadSchema } from '@/lib/validations/schemas'

/**
 * WhatsApp webhook endpoint.
 * Receives messages from Evolution API via n8n.
 * 
 * Authentication: X-Webhook-Secret header
 * This endpoint is excluded from session middleware.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } },
        { status: 401 }
      )
    }

    // Parse and validate payload
    const body = await request.json()
    const validation = webhookPayloadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload format' } },
        { status: 400 }
      )
    }

    const payload = validation.data

    // TODO: Process WhatsApp message
    // 1. Identify sender phone number
    // 2. Look up or create chat session
    // 3. Check bot state (active/paused/escalated)
    // 4. If paused: store message, notify staff, do NOT auto-reply
    // 5. If active: process through AI agent pipeline
    // 6. Log message

    console.warn('[WhatsApp Webhook] Message received:', {
      from: payload.data.key.remoteJid,
      type: payload.data.messageType,
      event: payload.event,
    })

    return NextResponse.json({ success: true, data: { received: true } })
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

// HEAD method for webhook verification
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ status: 'ok' })
}
