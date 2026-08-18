'use server'

import { requireRole } from '@/lib/auth/require-role'
import { AppError, toUserMessage } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { inventoryItemSchema, updateInventorySchema } from '@/lib/validations/schemas'
import type { ActionResult } from '@/types'
import type { Json } from '@/types/database'
import { z } from 'zod'

export async function createInventoryItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = inventoryItemSchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        sku: data.sku,
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        quantity: data.quantity,
        hsn_sac: data.hsn_sac || null,
        specifications: (data.specifications as Json | undefined) ?? null,
        is_public: data.is_public,
        condition: data.condition || null,
        warranty_months: data.warranty_months,
        low_stock_threshold: 2,
      })
      .select('id')
      .single()

    if (error || !item) {
      logger.error('createInventoryItem failed', { message: error?.message })
      throw new AppError(
        error?.message?.includes('duplicate') ? 'SKU already exists' : 'Could not add item',
        'INVENTORY_CREATE_FAILED',
        400
      )
    }

    return { success: true, data: { id: item.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid item' }
    }
    return { success: false, error: toUserMessage(error, 'Could not add item') }
  }
}

export async function updateInventoryItem(
  itemId: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const data = updateInventorySchema.parse(input)
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        quantity: data.quantity,
        hsn_sac: data.hsn_sac || null,
        specifications: data.specifications ? (JSON.parse(JSON.stringify(data.specifications)) as Json) : undefined,
        is_public: data.is_public,
        condition: data.condition || null,
        warranty_months: data.warranty_months,
      })
      .eq('id', itemId)

    if (error) {
      logger.error('updateInventoryItem failed', { message: error.message })
      throw new AppError('Could not update item', 'INVENTORY_UPDATE_FAILED', 400)
    }

    return { success: true, data: { id: itemId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message ?? 'Invalid item' }
    }
    return { success: false, error: toUserMessage(error, 'Could not update item') }
  }
}
