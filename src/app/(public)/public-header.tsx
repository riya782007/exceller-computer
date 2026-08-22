'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BUSINESS, whatsappLink } from '@/lib/constants'

const navigation = [
  { href: '/services', label: 'Services' },
  { href: '/estimator', label: 'Price estimator' },
  { href: '/locations', label: 'Service areas' },
  { href: '/contact', label: 'Contact' },
]

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" onClick={closeMenu} className="flex items-center gap-2" aria-label={`${BUSINESS.name} home`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-sm font-black text-white">E</span>
          <span>
            <span className="block text-base font-extrabold tracking-tight text-slate-950">Exeller</span>
            <span className="block -mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-700">Computer care</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                {item.label}
              </Link>
            )
          })}
          <a href={whatsappLink('Hi Exeller Computer, I need help with my device.')} target="_blank" rel="noopener noreferrer" className="ml-3 inline-flex items-center rounded-full bg-whatsapp px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-whatsapp-dark">
            WhatsApp now
          </a>
        </nav>

        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden">
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 18 12-12M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden" aria-label="Mobile navigation">
          <div className="container mx-auto grid gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {item.label}
              </Link>
            ))}
            <a href={whatsappLink('Hi Exeller Computer, I need help with my device.')} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="mt-2 rounded-lg bg-whatsapp px-4 py-3 text-center text-sm font-bold text-white">
              Start a WhatsApp chat
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
