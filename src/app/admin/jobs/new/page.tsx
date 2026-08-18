import type { Metadata } from 'next'
import { JobForm } from '@/components/admin/job-form'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'New repair job' }

export default async function NewJobPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const [{ data: customers, error: customerError }, { data: technicians }] = await Promise.all([
    supabase.from('profiles').select('id, full_name').eq('role', 'customer').eq('is_active', true).order('full_name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'technician').eq('is_active', true).order('full_name'),
  ])

  if (customerError) {
    return <ErrorState message="Could not load customers for a new job card." />
  }

  return (
    <div>
      <PageHeader title="New job card" description="Creates a Received job linked to a customer profile." />
      <JobForm customers={customers ?? []} technicians={technicians ?? []} />
    </div>
  )
}
