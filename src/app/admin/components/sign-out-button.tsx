'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { IconLogout } from '@/components/admin/icons'
import { cn } from '@/lib/utils'

/** Ends the console session so a shared device or a leaked code can be cut off. */
export function SignOutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function signOut() {
    startTransition(async () => {
      await fetch('/api/admin-auth', { method: 'DELETE' }).catch(() => null)
      router.replace('/login')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      title="Sign out of the console"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
        collapsed && 'justify-center px-0'
      )}
    >
      <IconLogout className="h-4 w-4 shrink-0" />
      <span className={collapsed ? 'sr-only' : undefined}>{pending ? 'Signing out…' : 'Sign out'}</span>
    </button>
  )
}
