'use server'

import { requireRole } from '@/lib/auth/require-role'
import { AppError, toUserMessage } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isValidTransition } from '@/lib/utils/job-status'
import {
  allocatePartSchema,
  createRepairJobSchema,
  transitionJobStatusSchema,
  updateRepairJobSchema,
} from '@/lib/validations/schemas'
import type { ActionResult, JobStatus } from '@/types'
import type { Database } from '@/types/database'
import { z } from 'zod'

const assignTechSchema = z.object({
  job_id: z.string().uuid(),
  technician_id: z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().uuid().nullable()
  ),
})

export async function createRepairJob(
  input: unknown
): Promise<ActionResult<{ id: string; job_card_number: string }>> {
  try {
    const { userId, role } = await requireRole('admin', 'technician')
    const data = createRepairJobSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: job, error } = await supabase
      .from('repair_jobs')
      .insert({
        customer_id: data.customer_id,
        technician_id: data.technician_id ?? (role === 'technician' ? userId : null),
        device_type: data.device_type,
        device_brand: data.device_brand,
        device_model: data.device_model || null,
        serial_number: data.serial_number || null,
        reported_fault: data.reported_fault,
        estimated_cost: data.estimated_cost,
        notes: data.notes || null,
        status: 'received',
      })
      .select('id, job_card_number')
      .single()

    if (error || !job) {
      logger.error('createRepairJob failed', { message: error?.message })
      throw new AppError('Could not create the job card', 'JOB_CREATE_FAILED', 400)
    }

    await supabase.from('job_status_events').insert({
      job_id: job.id,
      from_status: null,
      to_status: 'received',
      changed_by: userId,
    })

    return { success: true, data: job }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid job details' }
    }
    return { success: false, error: toUserMessage(error, 'Could not create the job card') }
  }
}

export async function updateRepairJob(jobId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin', 'technician')
    const data = updateRepairJobSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const patch: Database['public']['Tables']['repair_jobs']['Update'] = {}
    if (data.customer_id !== undefined) patch.customer_id = data.customer_id
    if (data.technician_id !== undefined) patch.technician_id = data.technician_id
    if (data.device_type !== undefined) patch.device_type = data.device_type
    if (data.device_brand !== undefined) patch.device_brand = data.device_brand
    if (data.device_model !== undefined) patch.device_model = data.device_model || null
    if (data.serial_number !== undefined) patch.serial_number = data.serial_number || null
    if (data.reported_fault !== undefined) patch.reported_fault = data.reported_fault
    if (data.diagnosis !== undefined) patch.diagnosis = data.diagnosis
    if (data.estimated_cost !== undefined) patch.estimated_cost = data.estimated_cost
    if (data.final_cost !== undefined) patch.final_cost = data.final_cost
    if (data.notes !== undefined) patch.notes = data.notes

    const { error } = await supabase.from('repair_jobs').update(patch).eq('id', jobId)

    if (error) {
      logger.error('updateRepairJob failed', { message: error.message, jobId })
      throw new AppError('Could not update the job', 'JOB_UPDATE_FAILED', 400)
    }

    return { success: true, data: { id: jobId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid job details' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update the job') }
  }
}

export async function assignTechnician(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = assignTechSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('repair_jobs')
      .update({ technician_id: data.technician_id })
      .eq('id', data.job_id)

    if (error) {
      logger.error('assignTechnician failed', { message: error.message })
      throw new AppError('Could not assign technician', 'JOB_ASSIGN_FAILED', 400)
    }

    return { success: true, data: { id: data.job_id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid assignment' }
    }
    return { success: false, error: toUserMessage(error, 'Could not assign technician') }
  }
}

export async function transitionJobStatus(input: unknown): Promise<ActionResult<{ status: JobStatus }>> {
  try {
    const { userId } = await requireRole('admin', 'technician')
    const data = transitionJobStatusSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: job, error: jobError } = await supabase
      .from('repair_jobs')
      .select('status')
      .eq('id', data.job_id)
      .single()

    if (jobError || !job) {
      throw new AppError('Job not found', 'NOT_FOUND', 404)
    }

    if (!isValidTransition(job.status, data.new_status)) {
      throw new AppError(
        `Cannot move this job from ${job.status} to ${data.new_status}`,
        'INVALID_TRANSITION',
        400
      )
    }

    const { error } = await supabase.rpc('transition_job_status', {
      p_job_id: data.job_id,
      p_new_status: data.new_status,
      p_user_id: userId,
    })

    if (error) {
      logger.error('transitionJobStatus RPC failed', { message: error.message })
      throw new AppError('Could not update job status', 'JOB_TRANSITION_FAILED', 400)
    }

    return { success: true, data: { status: data.new_status } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid status change' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update job status') }
  }
}

export async function allocatePartToJob(input: unknown): Promise<ActionResult<{ allocationId: string }>> {
  try {
    const { userId } = await requireRole('admin', 'technician')
    const data = allocatePartSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: allocationId, error } = await supabase.rpc('allocate_part_to_job', {
      p_job_id: data.job_id,
      p_item_id: data.item_id,
      p_quantity: data.quantity,
      p_allocated_by: userId,
    })

    if (error || !allocationId) {
      logger.error('allocatePartToJob failed', { message: error?.message })
      throw new AppError(
        error?.message?.includes('Insufficient')
          ? 'Not enough stock for that part'
          : 'Could not allocate part',
        'ALLOCATE_FAILED',
        400
      )
    }

    return { success: true, data: { allocationId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid allocation' }
    }
    return { success: false, error: toUserMessage(error, 'Could not allocate part') }
  }
}
