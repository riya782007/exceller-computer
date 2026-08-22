import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { JobForm } from './job-form'

type ProfileOption = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'full_name' | 'phone'>

export const metadata: Metadata = { title: 'New Repair Job' }

export default async function NewRepairJobPage() {
  const supabase = await createServerSupabaseClient()
  const [customersResult, techniciansResult] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone').eq('role', 'customer').eq('is_active', true).order('full_name'),
    supabase.from('profiles').select('id, full_name, phone').eq('role', 'technician').eq('is_active', true).order('full_name'),
  ])

  const customers: ProfileOption[] = customersResult.data ?? []
  const technicians: ProfileOption[] = techniciansResult.data ?? []

  return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Service desk</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Create repair job</h1><p className="mt-2 text-sm text-slate-600">Capture the intake accurately so diagnosis, approval, parts, and delivery can follow one record.</p></div><JobForm customers={customers} technicians={technicians} /></div>
}
