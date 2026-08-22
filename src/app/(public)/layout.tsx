import type { ReactNode } from 'react'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'
import { BrandLockup } from '@/components/marketing/brand-mark'
import { IconPhone, IconPin } from '@/components/marketing/icons'
import { VisitorChat } from '@/components/marketing/visitor-chat'
import { PublicHeader } from './public-header'

const serviceLinks = [
  { href: '/services/laptop-screen-replacement', label: 'Screen replacement' },
  { href: '/services/laptop-battery-replacement', label: 'Battery replacement' },
  { href: '/services/laptop-motherboard-repair', label: 'Motherboard repair' },
  { href: '/services/data-recovery', label: 'Data recovery' },
]

const quickLinks = [
  { href: '/estimator', label: 'Get a repair estimate' },
  { href: '/services', label: 'All services' },
  { href: '/locations', label: 'Service areas' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
]

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Keyboard users could previously only reach content by tabbing the whole
          header on every page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-slate-950 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <PublicHeader />

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="md:col-span-1">
              <BrandLockup />
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {BUSINESS.legalName} — component-level laptop and computer repair in New Delhi.
              </p>
              <p className="mt-4 text-xs font-semibold text-slate-500">
                Mon–Sat {BUSINESS.hours.weekday}
                <br />
                Sunday {BUSINESS.hours.weekend}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">Services</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {serviceLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">Quick links</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">Visit the workshop</h2>
              <address className="mt-3 space-y-3 text-sm not-italic leading-6 text-slate-600">
                <p className="flex gap-2">
                  <IconPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <span>
                    {BUSINESS.address.street}
                    <br />
                    {BUSINESS.address.area}, {BUSINESS.address.city} – {BUSINESS.address.pincode}
                  </span>
                </p>
                <p className="flex gap-2">
                  <IconPhone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <span>
                    <a href={`tel:${BUSINESS.phone}`} className="font-semibold transition hover:text-brand-700">
                      {BUSINESS.phoneDisplay}
                    </a>
                    <br />
                    <a href={`mailto:${BUSINESS.email}`} className="transition hover:text-brand-700">
                      {BUSINESS.email}
                    </a>
                  </span>
                </p>
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Single consolidated contact affordance: AI assistant primary, human
          secondary. Replaces the two competing floating buttons. */}
      <VisitorChat />
    </div>
  )
}
