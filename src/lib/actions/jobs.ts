'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'z'
import {
  createRepairJobSchema,
  transitionJobStatusSchema,
  updateRepairJobSchema,
} from '@/lib/validations/schemas'
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



const jobWorkspaceUpdateSchema = z.object({
  jobId: z.string().uuid('Invalid repair job.'),
  diagnosis: updateRepairJobSchema.shape.diagnosis,
  estimated_cost: updateRepairJobSchema.shape.estimated_cost,
  final_cost: updateRepairJobSchema.shape.final_cost,
  notes: updateRepairJobSchema.shape.notes,
})

async function assertJobAccess(jobId: string): Promise<{
  userId: string
  technicianId: string | null
}> {
  const { userId, role } = await requireRole('admin', 'technician')
  const admin = createAdminClient()
  const { data: job, error } = await admin
    .from('repair_jobs')
    .select('technician_id')
    .eq('id', jobId)
    .single()

  if (error || !job) throw new Error('Repair job not found.')
  if (role === 'technician' && job.technician_id !== userId) {
    throw new Error('You can only update repair jobs assigned to you.')
  }

  return { userId, technicianId: job.technician_id }
}

export async function updateRepairJobWork(input: {
  jobId: string
  diagnosis?: string
  estimated_cost?: number
  final_cost?: number
  notes?: string
}): Promise<ActionResult<undefined>> {
  try {
    const parsed = jobWorkspaceUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid repair update.' }
    }

    await assertJobAccess(parsed.data.jobId)
    const update = {
      diagnosis: emptyToNull(parsed.data.diagnosis),
      estimated_cost: parsed.data.estimated_cost ?? null,
      final_cost: parsed.data.final_cost ?? null,
      notes: emptyToNull(parsed.data.notes),
    }

    const { error } = await createAdminClient()
      .from('repair_jobs')
      .update(update)
      .eq('id', parsed.data.jobId)

    if (error) return { success: false, error: 'Could not save the repair work update.' }

    revalidatePath(`/admin/jobs/${parsed.data.jobId}`)
    revalidatePath('/admin/jobs')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'You are not authorised to update this repair job.',
    }
  }
}

export async function transitionRepairJobStatus(input: {
  jobId: string
  newStatus: import('@/types').JobStatus
}): Promise<ActionResult<undefined>> {
  try {
    const parsed = transitionJobStatusSchema.safeParse({
      job_id: input.jobId,
      new_status: input.newStatus,
    })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid job status.' }
    }

    const { userId } = await assertJobAccess(parsed.data.job_id)
    const { error } = await createAdminClient().rpc('transition_job_status', {
      p_job_id: parsed.data.job_id,
      p_new_status: parsed.data.new_status,
      p_user_id: userId,
    })

    if (error) return { success: false, error: 'This status change is not permitted for the current repair stage.' }

    revalidatePath(`/admin/jobs/${parsed.data.job_id}`)
    revalidatePath('/admin/jobs')
    revalidatePath('/admin/dashboard')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'You are not authorised to update this repair job.',
    }
  }
}
