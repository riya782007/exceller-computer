'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

/**
 * Public lead capture from the estimator and enquiry forms.
 *
 * Deliberately fail-soft. WhatsApp is the primary conversion path for this
 * business, so a database problem must never block the customer from reaching
 * the shop. If the insert fails we log it and still report success — the visitor
 * continues to the WhatsApp handoff, and we lose a CRM row rather than a
 * customer.
 *
 * Uses the admin client because this is called by anonymous visitors who have no
 * session, and the `leads` RLS policies intentionally grant no anonymous insert.
 * All input is validated below before it reaches the database.
 */

const leadSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  full_name: z.string().trim().max(100).optional().or(z.literal('')),
  device_type: z.string().trim().max(40).optional().or(z.literal('')),
  brand: z.string().trim().max(60).optional().or(z.literal('')),
  service_interest: z.string().trim().max(120).optional().or(z.literal('')),
  issue_summary: z.string().trim().max(1000).optional().or(z.literal('')),
  locality: z.string().trim().max(120).optional().or(z.literal('')),
  estimated_value: z.coerce.number().min(0).max(10_000_000).optional(),
  source: z.string().trim().max(60).default('website_estimator'),
})

export type LeadInput = z.input<typeof leadSchema>

/** Normalise to bare 10-digit form so duplicates collapse in the CRM. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

function emptyToNull(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export async function captureLead(
  input: LeadInput
): Promise<ActionResult<{ captured: boolean }>> {
  const parsed = leadSchema.safeParse(input)

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? 'Please check the details entered.'
    return { success: false, error: message }
  }

  const data = parsed.data

  try {
    const admin = createAdminClient()

    const { error } = await admin.from('leads').insert({
      phone: normalisePhone(data.phone),
      full_name: emptyToNull(data.full_name),
      device_type: emptyToNull(data.device_type),
      brand: emptyToNull(data.brand),
      service_interest: emptyToNull(data.service_interest),
      issue_summary: emptyToNull(data.issue_summary),
      locality: emptyToNull(data.locality),
      estimated_value: data.estimated_value ?? null,
      source: data.source,
      channel: 'whatsapp',
      status: 'new',
    })

    if (error) {
      // Most likely cause: SETUP_PART_B.sql has not been applied yet, so the
      // table does not exist. Not the visitor's problem.
      console.error('[captureLead] insert failed:', error.message)
      return { success: true, data: { captured: false } }
    }

    return { success: true, data: { captured: true } }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown lead capture error'
    console.error('[captureLead] unexpected error:', message)
    return { success: true, data: { captured: false } }
  }
}
