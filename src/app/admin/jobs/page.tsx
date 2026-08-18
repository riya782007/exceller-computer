import type { Metadata } from 'next'
import Link from 'next/link'
import { JobsKanban, type KanbanJob } from '@/components/admin/jobs-kanban'
import { Button } from '@/components/ui/button'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { getCurrentUser } from '@/lib/auth/require-role'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Repair Jobs',
}

export default async function JobsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const [{ data: jobs, error }, { data: technicians, error: techError }] = await Promise.all([
    supabase
      .from('repair_jobs')
      .select(
        `
        id,
        job_card_number,
        device_type,
        device_brand,
        device_model,
        reported_fault,
        status,
        estimated_cost,
        created_at,
        customer:profiles!repair_jobs_customer_id_fkey(full_name),
        technician:profiles!repair_jobs_technician_id_fkey(id, full_name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('profiles').select('id, full_name').eq('role', 'technician').eq('is_active', true).order('full_name'),
  ])

  if (error) {
    return <ErrorState message="Could not load repair jobs. Check your session and database connection." />
  }

  const normalized: KanbanJob[] = (jobs ?? []).map((job) => {
    const customerRel = job.customer as { full_name: string } | { full_name: string }[] | null
    const techRel = job.technician as { id: string; full_name: string } | { id: string; full_name: string }[] | null
    const customer = Array.isArray(customerRel) ? customerRel[0] ?? null : customerRel
    const technician = Array.isArray(techRel) ? techRel[0] ?? null : techRel
    return {
      id: job.id,
      job_card_number: job.job_card_number,
      device_type: job.device_type,
      device_brand: job.device_brand,
      device_model: job.device_model,
      reported_fault: job.reported_fault,
      status: job.status,
      estimated_cost: job.estimated_cost,
      created_at: job.created_at,
      customer,
      technician,
    }
  })

  return (
    <div>
      <PageHeader
        title="Repair jobs"
        description="Shop floor board. Drag a card or use the status buttons. Changes save to Supabase immediately."
        action={
          <Button asChild>
            <Link href="/admin/jobs/new">New job</Link>
          </Button>
        }
      />
      {techError ? (
        <p className="mb-3 text-xs text-amber-700">Technician list could not be loaded; assignment may be unavailable.</p>
      ) : null}
      <JobsKanban
        initialJobs={normalized}
        technicians={technicians ?? []}
        canAssign={user?.role === 'admin'}
      />
    </div>
  )
}
