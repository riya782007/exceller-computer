import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStatusLabel } from '@/lib/utils/job-status'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Technician' }

export default async function TechnicianDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: technician, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active')
    .eq('id', id)
    .eq('role', 'technician')
    .maybeSingle()

  if (error) return <ErrorState message="Could not load this technician." />
  if (!technician) notFound()

  const { data: jobs } = await supabase
    .from('repair_jobs')
    .select('id, job_card_number, status, device_brand, device_model')
    .eq('technician_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <PageHeader
        title={technician.full_name}
        description={`${technician.phone ?? technician.email ?? 'No contact'} · ${technician.is_active ? 'Active' : 'Inactive'}`}
      />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Assigned jobs</h2>
        {(jobs ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No jobs assigned to this technician.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(jobs ?? []).map((job) => (
              <li key={job.id}>
                <Link href={`/admin/jobs/${job.id}`} className="text-brand-700">
                  {job.job_card_number}
                </Link>{' '}
                · {job.device_brand} {job.device_model} · {getStatusLabel(job.status)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
