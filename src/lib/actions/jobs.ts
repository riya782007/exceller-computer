'use server'

import { revalidatePath } from 'next/cache'
import { createRepairJobSchema } from '@/lib/validations/schemas'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

export type RepairJobInput = {
  customer_id: string
  technician_id?: string
  device_type: string
  device_brand: string
  device_model?: string
  serial_number?: string
  reported_fault: string
  estimated_cost?: number
  notes?: string
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function createRepairJob(input: RepairJobInput): Promise<ActionResult<{ id: string; jobCardNumber: string }>> {
  try {
    await requireRole('admin', 'technician')
    const parsed = createRepairJobSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid repair job.' }

    const job = parsed.data
    const { data, error } = await createAdminClient()
      .from('repair_jobs')
      .insert({
        customer_id: job.customer_id,
        technician_id: job.technician_id ?? null,
        device_type: job.device_type.trim(),
        device_brand: job.device_brand.trim(),
        device_model: emptyToNull(job.device_model),
        serial_number: emptyToNull(job.serial_number),
        reported_fault: job.reported_fault.trim(),
        estimated_cost: job.estimated_cost ?? null,
        notes: emptyToNull(job.notes),
      })
      .select('id, job_card_number')
      .single()

    if (error || !data) return { success: false, error: 'Could not create the repair job.' }
    revalidatePath('/admin/jobs')
    revalidatePath('/admin/dashboard')
    return { success: true, data: { id: data.id, jobCardNumber: data.job_card_number } }
  } catch {
    return { success: false, error: 'You are not authorised to create repair jobs.' }
  }
}
