import type { Metadata } from 'next'
import { NewJobForm } from '@/components/admin/new-job-form'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'New repair job' }

export default async function NewJobPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const [{ data: customers }, { data: technicians }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('role', 'customer').eq('is_active', true).order('full_name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'technician').eq('is_active', true).order('full_name'),
  ])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New job card</h1>
      <NewJobForm customers={customers ?? []} technicians={technicians ?? []} />
    </div>
  )
}
