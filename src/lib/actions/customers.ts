'use server'

import { requireRole } from '@/lib/auth/require-role'
import { AppError, toUserMessage } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createProfileSchema, updateProfileSchema } from '@/lib/validations/schemas'
import type { ActionResult } from '@/types'
import { z } from 'zod'

function walkInEmail(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  return `customer-${digits}@customers.exellercomputer.in`
}

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = createProfileSchema.parse({
      ...(typeof input === 'object' && input !== null ? input : {}),
      role: 'customer',
    })
    const admin = createAdminClient()

    const phone = data.phone || undefined
    const email = data.email || (phone ? walkInEmail(phone) : undefined)

    if (!email) {
      throw new AppError('Provide an email or phone number', 'VALIDATION_ERROR', 400)
    }

    const password = crypto.randomUUID() + 'Aa1!'
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      user_metadata: {
        full_name: data.full_name,
        phone: phone ?? '',
      },
    })

    if (error || !created.user) {
      logger.error('createCustomer auth failed', { message: error?.message })
      throw new AppError('Could not create customer', 'CUSTOMER_CREATE_FAILED', 400)
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: data.email || email,
        phone: phone ?? null,
        address: data.address || null,
        role: 'customer',
      })
      .eq('id', created.user.id)

    if (profileError) {
      logger.error('createCustomer profile failed', { message: profileError.message })
    }

    return { success: true, data: { id: created.user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid customer' }
    }
    return { success: false, error: toUserMessage(error, 'Could not create customer') }
  }
}

export async function createStaffUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = createProfileSchema.parse(input)
    if (data.role === 'customer') {
      throw new AppError('Use the customer form for customers', 'VALIDATION_ERROR', 400)
    }
    if (!data.email) {
      throw new AppError('Staff accounts require an email', 'VALIDATION_ERROR', 400)
    }

    const admin = createAdminClient()
    const password = crypto.randomUUID() + 'Aa1!'
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone ?? '' },
      app_metadata: { role: data.role },
    })

    if (error || !created.user) {
      logger.error('createStaffUser failed', { message: error?.message })
      throw new AppError('Could not create user', 'STAFF_CREATE_FAILED', 400)
    }

    await admin
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        address: data.address || null,
      })
      .eq('id', created.user.id)

    return { success: true, data: { id: created.user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid user' }
    }
    return { success: false, error: toUserMessage(error, 'Could not create user') }
  }
}

export async function updateCustomer(
  customerId: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = updateProfileSchema.parse(input)
    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .update({
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })
      .eq('id', customerId)
      .eq('role', 'customer')

    if (error) {
      logger.error('updateCustomer failed', { message: error.message })
      throw new AppError('Could not update customer', 'CUSTOMER_UPDATE_FAILED', 400)
    }

    return { success: true, data: { id: customerId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid customer' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update customer') }
  }
}
