import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Technicians',
}

export default async function TechniciansPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const { data: technicians, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at')
    .eq('role', 'technician')
    .order('full_name', { ascending: true })

  if (error) {
    return <ErrorState message="Could not load technicians." />
  }

  return (
    <div>
      <PageHeader
        title="Technicians"
        description="Assignable repair staff. Assignment is saved on the job card."
        action={
          <Button asChild>
            <Link href="/admin/technicians/new">Add technician</Link>
          </Button>
        }
      />
      {(technicians ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">No technicians in the database yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(technicians ?? []).map((tech) => (
            <div key={tech.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900">{tech.full_name}</h3>
              <p className="text-xs text-gray-500">{tech.phone || tech.email || 'No contact info'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-600">{tech.is_active ? 'Active' : 'Inactive'}</span>
                <Link href={`/admin/technicians/${tech.id}`} className="text-xs text-brand-600">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
