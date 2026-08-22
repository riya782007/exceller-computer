import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/require-role'
import { AdminSidebar } from './components/admin-sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Middleware already blocks anonymous traffic; this resolves *who* is signed
  // in so the console can scope navigation to the owner vs a technician.
  const actor = await getCurrentUser()
  if (!actor) redirect('/login')
  if (actor.role === 'customer') redirect('/')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar userRole={actor.role} userName={actor.fullName} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
