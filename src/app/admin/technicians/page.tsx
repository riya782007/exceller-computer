import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Technicians',
}

export default async function TechniciansPage() {
  const supabase = await createServerSupabaseClient()

  const { data: technicians, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at')
    .eq('role', 'technician')
    .order('full_name', { ascending: true })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading technicians: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your repair team</p>
        </div>
        <a
          href="/admin/technicians/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Add Technician
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {technicians && technicians.length > 0 ? (
          technicians.map((tech) => (
            <div key={tech.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-medium">
                  {tech.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{tech.full_name}</h3>
                  <p className="text-xs text-gray-500">{tech.phone || tech.email || 'No contact info'}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tech.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {tech.is_active ? 'Active' : 'Inactive'}
                </span>
                <a href={`/admin/technicians/${tech.id}`} className="text-xs text-brand-600 hover:text-brand-800">
                  View →
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-sm text-gray-500">
            No technicians found. Add your first team member.
          </div>
        )}
      </div>
    </div>
  )
}
