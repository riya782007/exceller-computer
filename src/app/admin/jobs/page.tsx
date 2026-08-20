import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getStatusLabel, getStatusColor } from '@/lib/utils/job-status'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Repair Jobs',
}

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: jobs, error } = await supabase
    .from('repair_jobs')
    .select(`
      id,
      job_card_number,
      device_brand,
      device_model,
      reported_fault,
      status,
      created_at,
      customer:profiles!repair_jobs_customer_id_fkey(full_name),
      technician:profiles!repair_jobs_technician_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading jobs: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repair Jobs</h1>
          <p className="mt-1 text-sm text-gray-600">Manage all repair job cards</p>
        </div>
        <a
          href="/admin/jobs/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + New Job
        </a>
      </div>

      {/* Jobs Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Job Card
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Device
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Technician
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs && jobs.length > 0 ? (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <a href={`/admin/jobs/${job.id}`} className="font-medium text-brand-600 hover:text-brand-800">
                      {job.job_card_number}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{job.device_brand} {job.device_model}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{job.reported_fault}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {(job.customer as unknown as { full_name: string } | null)?.full_name || '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {(job.technician as unknown as { full_name: string } | null)?.full_name || 'Unassigned'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusLabel(job.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {formatDate(job.created_at)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No repair jobs found. Create your first job card to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
