import type { Metadata } from 'next'
import Link from 'next/link'
import { JobsKanban, type KanbanJob } from '@/components/admin/jobs-kanban'
import { getCurrentUser } from '@/lib/auth/require-role'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Repair Jobs',
}

export default async function JobsPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser()
  const supabase = await createServerSupabaseClient()

  const [{ data: jobs, error }, { data: technicians }] = await Promise.all([
    supabase
      .from('repair_jobs')
      .select(
        `
        id,
        job_card_number,
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
    supabase.from('profiles').select('id, full_name').eq('role', 'technician').eq('is_active', true),
  ])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Could not load jobs. Check your login and database connection.</p>
      </div>
    )
  }

  const normalized: KanbanJob[] = (jobs ?? []).map((job) => {
    const customerRel = job.customer as { full_name: string } | { full_name: string }[] | null
    const techRel = job.technician as { id: string; full_name: string } | { id: string; full_name: string }[] | null
    const customer = Array.isArray(customerRel) ? customerRel[0] ?? null : customerRel
    const technician = Array.isArray(techRel) ? techRel[0] ?? null : techRel
    return {
      id: job.id,
      job_card_number: job.job_card_number,
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repair board</h1>
          <p className="mt-1 text-sm text-gray-600">Received → diagnosed → quoted → approved → in repair → ready → delivered</p>
        </div>
        <Link href="/admin/jobs/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + New job
        </Link>
      </div>
      <JobsKanban
        initialJobs={normalized}
        technicians={technicians ?? []}
        canAssign={user?.role === 'admin'}
      />
    </div>
  )
}
