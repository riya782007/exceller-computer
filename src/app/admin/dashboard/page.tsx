import type { Metadata } from 'next'
import Link from 'next/link'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/utils/job-status'
import type { JobStatus } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const OPEN_STATUSES: JobStatus[] = ['received', 'diagnosed', 'quoted', 'approved', 'in_repair', 'ready']

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()

  const [openJobs, inventoryCount, pendingInvoices, jobsByStatus, recentJobs, stockItems] = await Promise.all([
    supabase.from('repair_jobs').select('id', { count: 'exact', head: true }).in('status', OPEN_STATUSES),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    supabase.from('repair_jobs').select('status'),
    supabase
      .from('repair_jobs')
      .select(
        'id, job_card_number, status, device_brand, device_model, created_at, customer:profiles!repair_jobs_customer_id_fkey(full_name)'
      )
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('inventory_items').select('id, sku, name, quantity, low_stock_threshold').order('quantity').limit(200),
  ])

  if (openJobs.error || inventoryCount.error || pendingInvoices.error) {
    return <ErrorState message="Could not load dashboard figures from the database." />
  }

  const statusCounts: Record<string, number> = {}
  for (const row of jobsByStatus.data ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
  }

  const lowStock = (stockItems.data ?? []).filter((item) => item.quantity <= item.low_stock_threshold)

  const stats = [
    { label: 'Open jobs', value: openJobs.count ?? 0, href: '/admin/jobs' },
    { label: 'Inventory SKUs', value: inventoryCount.count ?? 0, href: '/admin/inventory' },
    { label: 'Pending invoices', value: pendingInvoices.count ?? 0, href: '/admin/invoices' },
    { label: 'Low stock', value: lowStock.length, href: '/admin/inventory' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Live counts from Supabase — not sample data." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="rounded-xl border bg-white p-5 shadow-sm hover:border-brand-200">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold">Jobs by status</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {OPEN_STATUSES.concat(['delivered', 'cancelled']).map((status) => (
              <li key={status} className="flex items-center justify-between">
                <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
                <span className="tabular-nums text-gray-700">{statusCounts[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent job cards</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/jobs/new">New job</Link>
            </Button>
          </div>
          {(recentJobs.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No repair jobs in the database yet.</p>
          ) : (
            <ul className="mt-3 divide-y text-sm">
              {(recentJobs.data ?? []).map((job) => {
                const customer = job.customer as { full_name: string } | null
                return (
                  <li key={job.id} className="flex items-center justify-between py-2">
                    <div>
                      <Link href={`/admin/jobs/${job.id}`} className="font-medium text-brand-700">
                        {job.job_card_number}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {customer?.full_name ?? '—'} · {job.device_brand} {job.device_model}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(job.status)}>{getStatusLabel(job.status)}</Badge>
                      <p className="mt-1 text-xs text-gray-400">{formatDate(job.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="text-sm font-semibold">Low stock</h2>
        {lowStock.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No SKUs at or below their threshold.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {lowStock.slice(0, 8).map((item) => (
              <li key={item.id} className="flex justify-between">
                <Link href={`/admin/inventory/${item.id}`} className="text-brand-700">
                  {item.sku} {item.name}
                </Link>
                <span className="tabular-nums text-amber-700">
                  {item.quantity} / min {item.low_stock_threshold}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
