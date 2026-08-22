'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { BUSINESS } from '@/lib/constants'
import { BrandLockup } from '@/components/marketing/brand-mark'
import { IconArrowRight, IconClose, IconPhone } from '@/components/marketing/icons'

const navigation = [
  { href: '/services', label: 'Services' },
  { href: '/estimator', label: 'Price estimator' },
  { href: '/locations', label: 'Service areas' },
  { href: '/contact', label: 'Contact' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const toggleRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLElement | null>(null)

  /* Close on route change — otherwise the panel stays open over the new page. */
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* Subtle elevation once the visitor starts reading. */
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Escape to close and focus into the panel: the mobile menu previously left
     focus on the toggle with no way to dismiss it from the keyboard. */
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        toggleRef.current?.focus()
      }
    }

    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    })
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur transition-shadow duration-300',
        scrolled ? 'border-slate-200 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.25)]' : 'border-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" aria-label={`${BUSINESS.name} home`} className="shrink-0">
          <BrandLockup />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navigation.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-semibold transition',
                  active ? 'text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-700" aria-hidden="true" />
                ) : null}
              </Link>
            )
          })}

          <a
            href={`tel:${BUSINESS.phone}`}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <IconPhone className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">{BUSINESS.phoneDisplay}</span>
            <span className="lg:hidden">Call</span>
          </a>

          <Link
            href="/estimator"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Get an estimate
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          {open ? (
            <IconClose className="h-6 w-6" />
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Always rendered so `aria-controls` is never a dangling reference. */}
      <nav
        ref={menuRef}
        id="mobile-navigation"
        hidden={!open}
        className="animate-fade border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden"
        aria-label="Mobile"
      >
        <div className="container mx-auto grid gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-3 text-sm font-semibold transition',
                isActive(item.href) ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/estimator"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3.5 text-sm font-bold text-white"
          >
            Get an estimate
            <IconArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={`tel:${BUSINESS.phone}`}
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-800"
          >
            <IconPhone className="h-4 w-4" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </nav>
    </header>
  )
}
