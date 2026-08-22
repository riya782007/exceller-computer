'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

const leadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
})

export async function updateLeadStatus(input: { leadId: string; status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' }): Promise<ActionResult<undefined>> {
  try {
    await requireRole('admin')
    const parsed = leadStatusSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Invalid lead update.' }
    const { error } = await createAdminClient().from('leads').update({ status: parsed.data.status }).eq('id', parsed.data.leadId)
    if (error) return { success: false, error: 'Could not update the lead.' }
    revalidatePath('/admin/leads')
    revalidatePath('/admin/dashboard')
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'You are not authorised to update leads.' }
  }
}
