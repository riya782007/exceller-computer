import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

/**
 * n8n webhook endpoint.
 * Receives workflow calls from n8n for various operations.
 * 
 * Authentication: X-Webhook-Secret header
 */

const n8nPayloadSchema = z.object({
  action: z.enum(['job_update', 'send_notification', 'escalation', 'status_check']),
  data: z.record(z.unknown()),
})

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
    const validation = n8nPayloadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } },
        { status: 400 }
      )
    }

    const { action, data } = validation.data

    // Route to appropriate handler
    switch (action) {
      case 'job_update':
        // TODO: Handle job status update from n8n workflow
        break
      case 'send_notification':
        // TODO: Handle notification sending
        break
      case 'escalation':
        // TODO: Handle human escalation from AI agent
        break
      case 'status_check':
        // Return system status
        return NextResponse.json({ success: true, data: { status: 'operational' } })
      default:
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: `Unknown action: ${action}` } },
          { status: 400 }
        )
    }

    console.warn('[n8n Webhook]', { action, data })

    return NextResponse.json({ success: true, data: { processed: true } })
  } catch (error) {
    console.error('[n8n Webhook] Error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
