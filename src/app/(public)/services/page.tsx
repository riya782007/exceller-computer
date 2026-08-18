import type { Metadata } from 'next'
import Link from 'next/link'
import { LOCAL_SERVICE_PAGES } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Laptop repair services in Dwarka Mor',
  description: 'Screen, battery, hinge, motherboard, RAM and SSD work from Exeller Computer opposite Dwarka Mor Metro.',
  alternates: { canonical: '/services' },
}

const CORE = [
  { href: '/services/laptop-repair', title: 'Laptop & hardware repair' },
  { href: '/services/screen-replacement', title: 'Display replacement' },
  { href: '/services/motherboard-repair', title: 'Motherboard chip-level' },
  { href: '/services/battery-hinge-upgrades', title: 'Battery, hinge, RAM & storage' },
]

export default function ServicesPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold">Repair services</h1>
      <p className="mt-4 text-gray-600">
        Jobs are booked as received, diagnosed on the bench, then quoted. Website ranges are not a final diagnostic quote.
      </p>
      <ul className="mt-8 space-y-3">
        {CORE.map((item) => (
          <li key={item.href}>
            <Link className="text-brand-700 hover:underline" href={item.href}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 text-2xl font-semibold">Local service pages</h2>
      <ul className="mt-4 space-y-3">
        {LOCAL_SERVICE_PAGES.map((page) => (
          <li key={page.slug}>
            <Link className="text-brand-700 hover:underline" href={`/services/${page.slug}`}>
              {page.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
