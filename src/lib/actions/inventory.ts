'use server'

import { revalidatePath } from 'next/cache'
import { inventoryItemSchema } from '@/lib/validations/schemas'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

export type InventoryItemInput = {
  sku: string
  name: string
  category: 'part' | 'refurbished_laptop' | 'accessory'
  brand?: string
  model?: string
  cost_price: number
  selling_price: number
  quantity: number
  hsn_sac?: string
  condition?: string
  warranty_months?: number
  is_public: boolean
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function createInventoryItem(input: InventoryItemInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole('admin')
    const parsed = inventoryItemSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid inventory item.' }

    const item = parsed.data
    const { data, error } = await createAdminClient()
      .from('inventory_items')
      .insert({
        sku: item.sku.trim().toUpperCase(),
        name: item.name.trim(),
        category: item.category,
        brand: emptyToNull(item.brand),
        model: emptyToNull(item.model),
        cost_price: item.cost_price,
        selling_price: item.selling_price,
        quantity: item.quantity,
        hsn_sac: emptyToNull(item.hsn_sac),
        condition: emptyToNull(item.condition),
        warranty_months: item.warranty_months ?? null,
        is_public: item.is_public,
      })
      .select('id')
      .single()

    if (error || !data) {
      if (error?.code === '23505') return { success: false, error: 'That SKU already exists. Use a unique SKU.' }
      return { success: false, error: 'Could not save the inventory item.' }
    }

    revalidatePath('/admin/inventory')
    revalidatePath('/admin/dashboard')
    return { success: true, data: { id: data.id } }
  } catch {
    return { success: false, error: 'You are not authorised to add inventory.' }
  }
}
