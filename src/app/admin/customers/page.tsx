import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Customers',
}

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient()

  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at, is_active')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading customers: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage customer records</p>
        </div>
        <a
          href="/admin/customers/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Add Customer
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers && customers.length > 0 ? (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <a href={`/admin/customers/${customer.id}`} className="font-medium text-brand-600 hover:text-brand-800">
                      {customer.full_name}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{customer.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{customer.phone || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {customer.is_active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Active</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Inactive</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
