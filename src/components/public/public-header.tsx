'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/estimate', label: 'Estimate' },
  { href: '/refurbished-laptops', label: 'Refurbished' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function PublicHeader(): React.ReactElement {
  const [open, setOpen] = useState(false)
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const wa = generateWhatsAppLink(phone, 'Hi, I need help with my laptop.')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-brand-800">
          Exeller Computer
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-gray-700 hover:text-brand-700">
              {item.label}
            </Link>
          ))}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-whatsapp px-4 py-2 text-sm font-medium text-white hover:bg-whatsapp-dark">
            WhatsApp
          </a>
        </nav>
        <button type="button" className="md:hidden" aria-label="Menu" onClick={() => setOpen((value) => !value)}>
          <span className="text-2xl">☰</span>
        </button>
      </div>
      {open ? (
        <div className="space-y-2 border-t px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block py-1 text-sm" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <a href={wa} className="block py-1 text-sm text-whatsapp-dark">
            WhatsApp
          </a>
        </div>
      ) : null}
    </header>
  )
}
