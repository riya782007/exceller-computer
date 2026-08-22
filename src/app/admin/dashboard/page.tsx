import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch summary data
  const [jobsResult, inventoryResult, invoicesResult] = await Promise.all([
    supabase
      .from('repair_jobs')
      .select('status', { count: 'exact', head: true }),
    supabase
      .from('inventory_items')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('payment_status', 'pending'),
  ])

  const stats = [
    {
      label: 'Active Jobs',
      value: jobsResult.count ?? 0,
      icon: '🔧',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Inventory Items',
      value: inventoryResult.count ?? 0,
      icon: '📦',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Pending Invoices',
      value: invoicesResult.count ?? 0,
      icon: '🧾',
      color: 'bg-amber-50 text-amber-700',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your business operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/jobs/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span className="text-xl">➕</span>
            <span className="text-sm font-medium text-gray-700">New Repair Job</span>
          </Link>
          <Link
            href="/admin/inventory/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span className="text-xl">📦</span>
            <span className="text-sm font-medium text-gray-700">Add Inventory</span>
          </Link>
          <Link
            href="/admin/invoices/new"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span className="text-xl">🧾</span>
            <span className="text-sm font-medium text-gray-700">Create Invoice</span>
          </Link>
          <Link
            href="/admin/leads"
            className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
          >
            <span className="text-xl">🎯</span>
            <span className="text-sm font-medium text-gray-700">Review New Leads</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
