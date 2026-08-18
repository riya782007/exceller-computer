import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Customers',
}

export default async function CustomersPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const { data: customers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, created_at, is_active')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return <ErrorState message="Could not load customers." />
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Walk-in and account customers used on job cards and invoices."
        action={
          <Button asChild>
            <Link href="/admin/customers/new">Add customer</Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(customers ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  No customers yet. Add one before creating a job card.
                </td>
              </tr>
            ) : (
              (customers ?? []).map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="font-medium text-brand-600">
                      {customer.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{customer.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs">{customer.is_active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
