'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { UserRole } from '@/types'

interface AdminSidebarProps {
  userRole: UserRole
  userName: string
}

interface NavItem {
  name: string
  href: string
  icon: string
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', roles: ['admin', 'technician'] },
  { name: 'Jobs', href: '/admin/jobs', icon: '🔧', roles: ['admin', 'technician'] },
  { name: 'Inventory', href: '/admin/inventory', icon: '📦', roles: ['admin'] },
  { name: 'Customers', href: '/admin/customers', icon: '👤', roles: ['admin'] },
  { name: 'Technicians', href: '/admin/technicians', icon: '👨‍🔧', roles: ['admin'] },
  { name: 'Invoices', href: '/admin/invoices', icon: '🧾', roles: ['admin'] },
  { name: 'WhatsApp', href: '/admin/whatsapp', icon: '💬', roles: ['admin'] },
  { name: 'Settings', href: '/admin/settings', icon: '⚙️', roles: ['admin'] },
]

export function AdminSidebar({ userRole, userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside
      className={`flex flex-col border-r bg-white transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <span className="text-lg font-bold text-brand-700">Exeller ERP</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 hover:bg-gray-100"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
