import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { pauseBotAndNotify } from '@/lib/ai/escalation'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'

const n8nPayloadSchema = z.object({
  action: z.enum(['job_update', 'send_notification', 'escalation', 'status_check']),
  data: z.record(z.unknown()),
})

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
    const validation = n8nPayloadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } },
        { status: 400 }
      )
    }

    const { action, data } = validation.data

    if (action === 'status_check') {
      return NextResponse.json({ success: true, data: { status: 'operational' } })
    }

    if (action === 'escalation') {
      const phone = typeof data.phone_number === 'string' ? data.phone_number : ''
      const reason = typeof data.reason === 'string' ? data.reason : 'n8n escalation'
      if (!phone) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'phone_number required' } },
          { status: 400 }
        )
      }
      await pauseBotAndNotify(phone, reason)
      return NextResponse.json({ success: true, data: { paused: true } })
    }

    if (action === 'job_update') {
      const jobCard = typeof data.job_card_number === 'string' ? data.job_card_number : ''
      if (!jobCard) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'job_card_number required' } },
          { status: 400 }
        )
      }
      const admin = createAdminClient()
      const { data: job, error } = await admin
        .from('repair_jobs')
        .select('job_card_number, status, device_brand, device_model')
        .eq('job_card_number', jobCard)
        .maybeSingle()
      if (error) {
        logger.error('n8n job lookup failed', { message: error.message })
        return NextResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Lookup failed' } },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, data: { job } })
    }

    logger.info('n8n send_notification received')
    return NextResponse.json({ success: true, data: { processed: true } })
  } catch (error) {
    logger.error('n8n webhook failed', { error: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
