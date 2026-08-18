import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CustomerEditForm } from '@/components/admin/customer-edit-form'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Customer' }

export default async function CustomerDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: customer, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, address, is_active, created_at')
    .eq('id', id)
    .eq('role', 'customer')
    .maybeSingle()

  if (error) return <ErrorState message="Could not load this customer." />
  if (!customer) notFound()

  const { data: jobs } = await supabase
    .from('repair_jobs')
    .select('id, job_card_number, status, device_brand, created_at')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <PageHeader title={customer.full_name} description={`Customer since ${formatDate(customer.created_at)}`} />
      <CustomerEditForm customer={customer} />
      <section className="rounded-xl border bg-white p-4">
        <h2 className="text-sm font-semibold">Jobs</h2>
        {(jobs ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No job cards for this customer.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {(jobs ?? []).map((job) => (
              <li key={job.id}>
                <Link href={`/admin/jobs/${job.id}`} className="text-brand-700">
                  {job.job_card_number}
                </Link>{' '}
                · {job.device_brand} · {job.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
