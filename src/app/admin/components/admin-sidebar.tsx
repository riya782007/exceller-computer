'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import {
  IconBox,
  IconChat,
  IconChevron,
  IconGlobe,
  IconImage,
  IconPulse,
  IconReceipt,
  IconSliders,
  IconSparkle,
  IconTarget,
  IconTechnician,
  IconUsers,
  IconWrench,
  type IconProps,
} from '@/components/admin/icons'
import { SignOutButton } from './sign-out-button'

interface AdminSidebarProps {
  userRole: UserRole
  userName: string
}

interface NavItem {
  name: string
  href: string
  icon: (props: IconProps) => React.ReactElement
  /** Shown as a tooltip and in the expanded rail — answers "why would I click this?" */
  purpose: string
  roles: UserRole[]
  /** True when the route must match exactly, so parent items don't stay lit on children. */
  exact?: boolean
}

interface NavGroup {
  /** Groups follow the money: demand first, then delivery, then the systems that scale it. */
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Today',
    items: [
      {
        name: 'Command Centre',
        href: '/admin/dashboard',
        icon: IconPulse,
        purpose: 'Today’s money, waiting customers and what to do next',
        roles: ['admin', 'technician'],
      },
    ],
  },
  {
    label: 'Win the work',
    items: [
      {
        name: 'Enquiries',
        href: '/admin/leads',
        icon: IconTarget,
        purpose: 'Every website and AI enquiry, newest first',
        roles: ['admin'],
      },
      {
        name: 'Conversations',
        href: '/admin/whatsapp',
        icon: IconChat,
        purpose: 'WhatsApp threads and human takeover',
        roles: ['admin'],
      },
      {
        name: 'Customers',
        href: '/admin/customers',
        icon: IconUsers,
        purpose: 'Who you have served and how to reach them',
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Deliver the work',
    items: [
      {
        name: 'Repair Jobs',
        href: '/admin/jobs',
        icon: IconWrench,
        purpose: 'Intake to handover, with approval gates',
        roles: ['admin', 'technician'],
      },
      {
        name: 'Parts & Stock',
        href: '/admin/inventory',
        icon: IconBox,
        purpose: 'Know what is on the shelf before you promise it',
        roles: ['admin'],
      },
      {
        name: 'Technicians',
        href: '/admin/technicians',
        icon: IconTechnician,
        purpose: 'Bench capacity and who is assigned',
        roles: ['admin'],
      },
      {
        name: 'Invoices & GST',
        href: '/admin/invoices',
        icon: IconReceipt,
        purpose: 'Tax invoices, payment status and PDFs',
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Grow on autopilot',
    items: [
      {
        name: 'Owner Copilot',
        href: '/admin/agent',
        icon: IconSparkle,
        purpose: 'Ask what to prioritise, get a grounded plan',
        roles: ['admin'],
        exact: true,
      },
      {
        name: 'Website Agent',
        href: '/admin/agent/studio',
        icon: IconGlobe,
        purpose: 'Control what the AI offers visitors 24/7',
        roles: ['admin'],
      },
      {
        name: 'Brand Media',
        href: '/admin/media',
        icon: IconImage,
        purpose: 'Approved photos for the site and quotes',
        roles: ['admin'],
      },
    ],
  },
  {
    label: 'Business setup',
    items: [
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: IconSliders,
        purpose: 'GST details, integrations and readiness',
        roles: ['admin'],
      },
    ],
  },
]

export function AdminSidebar({ userRole, userName }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleGroups = navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(userRole)) }))
    .filter((group) => group.items.length > 0)

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        collapsed ? 'w-[4.5rem]' : 'w-[17.5rem]'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            E
          </span>
          {!collapsed && (
            <span className="min-w-0 animate-fade">
              <span className="block truncate text-sm font-bold leading-tight text-slate-900">Exeller Computer</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">
                Operations
              </span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((value) => !value)}
          className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          aria-controls="admin-navigation"
        >
          <IconChevron className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav id="admin-navigation" className="flex-1 overflow-y-auto px-3 py-4" aria-label="Console navigation">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-6')}>
            {!collapsed && (
              <p className="px-2.5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </p>
            )}
            {collapsed && groupIndex > 0 && <div className="mx-2 mb-3 border-t border-slate-100" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? `${item.name} — ${item.purpose}` : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-200',
                        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-transform duration-300',
                          !active && 'group-hover:scale-105'
                        )}
                      />
                      {collapsed && <span className="sr-only">{item.name}</span>}
                      {!collapsed && (
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold leading-tight">{item.name}</span>
                          <span
                            className={cn(
                              'mt-0.5 block truncate text-[11px] leading-4',
                              active ? 'text-slate-300' : 'text-slate-400'
                            )}
                          >
                            {item.purpose}
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Identity */}
      <div className="space-y-1 border-t border-slate-100 p-3">
        <div className={cn('flex items-center gap-3 rounded-xl bg-slate-50 p-2.5', collapsed && 'justify-center bg-transparent p-0')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1 animate-fade">
              <p className="truncate text-[13px] font-bold leading-tight text-slate-900">{userName}</p>
              <p className="text-[11px] capitalize text-slate-500">{userRole} access</p>
            </div>
          )}
        </div>
        <SignOutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}
