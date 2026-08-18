import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/require-role'
import { AdminSidebar } from './components/admin-sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Only admin and technician roles can access the ERP
  if (user.role === 'customer') {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar userRole={user.role} userName={user.fullName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
