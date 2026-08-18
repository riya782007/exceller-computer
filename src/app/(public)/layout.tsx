import Link from 'next/link'
import { PublicHeader } from '@/components/public/public-header'
import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'
import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }): React.ReactElement {
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const wa = generateWhatsAppLink(phone, 'Hi, I need laptop repair help.')

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-slate-950 text-slate-200">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <p className="font-semibold text-white">{BUSINESS.name}</p>
            <p className="mt-2 text-sm text-slate-400">{BUSINESS.legalName}. Component-level repair from Dwarka Mor.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Services</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li><Link href="/services">All services</Link></li>
              <li><Link href="/estimate">Repair estimate</Link></li>
              <li><Link href="/refurbished-laptops">Refurbished laptops</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Visit</p>
            <p className="mt-2 text-sm text-slate-400">
              {BUSINESS.address.street}<br />
              {BUSINESS.address.area}, {BUSINESS.address.city} {BUSINESS.address.pincode}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <p className="mt-2 text-sm text-slate-400">
              <a href={`tel:${phone}`}>{phone}</a><br />
              <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
            </p>
          </div>
        </div>
        <p className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {BUSINESS.legalName}. All rights reserved.
        </p>
      </footer>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg"
        aria-label="Chat on WhatsApp"
      >
        WA
      </a>
    </div>
  )
}
