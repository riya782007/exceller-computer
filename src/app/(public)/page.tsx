import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'
import { localBusinessJsonLd } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Exeller Computer — Laptop Repair | Dwarka Mor, Delhi',
  description:
    'Component-level laptop repair, display replacement, motherboard chip-level work and certified refurbished business laptops opposite Dwarka Mor Metro Gate No. 2.',
  alternates: { canonical: '/' },
}

const SERVICES = [
  { href: '/services/laptop-repair', title: 'Hardware & laptop repair', body: 'Dell, HP, Lenovo, Acer, Asus and Apple notebooks diagnosed on the bench before any quote is locked.' },
  { href: '/services/screen-replacement', title: 'Display replacement', body: 'LCD/LED panels fitted after we confirm whether the panel, cable or board is at fault.' },
  { href: '/services/motherboard-repair', title: 'Chip-level motherboard', body: 'Power rails, charging ICs and BGA work — not board-swap-only service.' },
  { href: '/estimate', title: 'Battery, hinge, RAM & SSD', body: 'Common jobs with published estimate ranges. Final price follows diagnosis.' },
]

export default function HomePage(): React.ReactElement {
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const wa = generateWhatsAppLink(phone, 'Hi Exeller, I want to book a laptop repair pickup.')

  return (
    <div>
      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium text-brand-300">Opposite Dwarka Mor Metro · Gate No. 2</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Laptop repair that starts on the bench, not on a chat guess.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Exeller Infosolutions LLP handles cracked screens, batteries, hinges, RAM/SSD upgrades and chip-level motherboard work for Delhi NCR walk-ins and pickup jobs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/estimate" className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600">
              Get an estimate
            </Link>
            <a href={wa} className="rounded-lg bg-whatsapp px-6 py-3 text-sm font-semibold text-white hover:bg-whatsapp-dark">
              Book pickup on WhatsApp
            </a>
            <Link href="/refurbished-laptops" className="rounded-lg border border-slate-600 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Refurbished laptops
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900">What we actually do</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SERVICES.map((service) => (
            <Link key={service.href} href={service.href} className="rounded-xl border bg-white p-6 hover:border-brand-300">
              <h3 className="text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{service.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Counter at Sewak Park</h2>
            <p className="mt-4 text-gray-600">
              {BUSINESS.address.street}, {BUSINESS.address.area}, {BUSINESS.address.city} – {BUSINESS.address.pincode}
            </p>
            <p className="mt-2 text-gray-600">Mon–Sat 10:00–20:00 · Sunday closed</p>
            <p className="mt-2">
              <a className="text-brand-700" href={`tel:${phone}`}>{phone}</a>
            </p>
          </div>
          <iframe
            title="Exeller Computer map"
            className="h-64 w-full rounded-xl border"
            loading="lazy"
            src="https://maps.google.com/maps?q=Dwarka%20Mor%20Metro%20Station%20Gate%202&t=&z=16&ie=UTF8&iwloc=&output=embed"
          />
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }} />
    </div>
  )
}
