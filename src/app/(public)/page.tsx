import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS, siteUrl, whatsappLink } from '@/lib/constants'
import { ServiceJourney } from '@/components/marketing/service-journey'
import { TrustBar } from '@/components/marketing/trust-bar'
import { AssistantSpotlight } from '@/components/marketing/assistant-spotlight'
import {
  IconArrowRight,
  IconBattery,
  IconChip,
  IconDisplay,
  IconPhone,
  IconPin,
  IconRocket,
  type MarketingIcon,
} from '@/components/marketing/icons'

export const metadata: Metadata = {
  // `absolute` stops the root template appending "| Exeller Computer" to a title
  // that already ends with the brand name.
  title: { absolute: 'Exeller Computer — Laptop & Computer Repair | Dwarka Mor, Delhi' },
  description:
    'Transparent laptop and computer repair near Dwarka Mor Metro Station. Get an estimate, approve before work begins, and receive clear repair updates on WhatsApp.',
  alternates: { canonical: '/' },
  openGraph: {
    // Metadata merges shallowly, so type/locale/siteName must be repeated or
    // they are lost on this page.
    type: 'website',
    locale: 'en_IN',
    siteName: BUSINESS.name,
    title: 'Exeller Computer — Laptop & Computer Repair, Dwarka Mor',
    description:
      'Clear diagnosis, your approval before any work starts, and repair updates on WhatsApp. Same-day service on most common faults.',
    url: siteUrl(),
  },
}

const proofPoints: Array<{ value: string; label: string }> = [
  { value: 'Same day', label: 'On most common faults' },
  { value: 'Chip level', label: 'Board repair, not just swaps' },
  { value: '1 year', label: 'Warranty on parts we supply' },
]

const serviceHighlights: Array<{
  title: string
  copy: string
  href: string
  icon: MarketingIcon
}> = [
  {
    title: 'Screen & display',
    copy: 'Panel replacement, flickering screens, backlight and display faults.',
    href: '/services/laptop-screen-replacement',
    icon: IconDisplay,
  },
  {
    title: 'Power & charging',
    copy: 'Battery health, charging ports, adapters and power-delivery faults.',
    href: '/services/laptop-battery-replacement',
    icon: IconBattery,
  },
  {
    title: 'Motherboard repair',
    copy: 'Component-level diagnostics for power, liquid damage and no-boot issues.',
    href: '/services/laptop-motherboard-repair',
    icon: IconChip,
  },
  {
    title: 'Speed upgrades',
    copy: 'SSD and RAM upgrades with practical advice for your workload.',
    href: '/services/ssd-upgrade',
    icon: IconRocket,
  },
]

const process: Array<[string, string, string]> = [
  ['01', 'Tell us the issue', 'Ask the assistant or use the estimator with your device and symptom.'],
  ['02', 'Receive a diagnosis', 'We inspect the device and explain the repair path and expected cost.'],
  ['03', 'Approve with confidence', 'Work begins only after you approve the estimate.'],
  ['04', 'Collect with clarity', 'Receive the device, invoice, and applicable warranty details.'],
]

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="scene relative isolate overflow-hidden bg-slate-950 py-16 text-white sm:py-24 lg:py-28">
        <div className="aurora absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-600/30 blur-3xl" />
        <div className="aurora-slow absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="circuit-grid absolute inset-0 opacity-50" />

        <div className="container relative mx-auto grid items-center gap-14 px-4 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-100 backdrop-blur">
              <IconPin className="h-3.5 w-3.5" />
              Dwarka Mor · New Delhi
            </p>

            <h1 className="reveal reveal-1 mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Repair your device{' '}
              <span className="text-flow bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent">
                without the uncertainty.
              </span>
            </h1>

            <p className="reveal reveal-2 mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Understand the fault, see a real price range, and approve the work before it starts. Ask our assistant
              anything — in English, Hindi or Hinglish.
            </p>

            <div className="reveal reveal-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/estimator"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-extrabold text-slate-950 shadow-xl shadow-brand-950/30 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                Check your repair cost
                <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <a
                href={`tel:${BUSINESS.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
              >
                <IconPhone className="h-4 w-4" />
                {BUSINESS.phoneDisplay}
              </a>
            </div>

            <dl className="reveal reveal-4 mt-11 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-7">
              {proofPoints.map((point) => (
                <div key={point.value}>
                  <dt className="text-xl font-black tracking-tight text-white sm:text-2xl">{point.value}</dt>
                  <dd className="mt-1 text-[11px] leading-4 text-slate-400">{point.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The assistant is the differentiator, so it gets the hero panel. */}
          <AssistantSpotlight />
        </div>
      </section>

      {/* Assurances */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="container mx-auto px-4">
          <TrustBar />
        </div>
      </section>

      <ServiceJourney />

      {/* Services */}
      <section className="scene py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">What we help with</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                The repair paths people ask for most.
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-900"
            >
              Explore all services
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="stagger mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {serviceHighlights.map((service) => {
              const Icon = service.icon
              return (
                <Link
                  key={service.title}
                  href={service.href}
                  className="card-3d group rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-200"
                >
                  <span className="card-3d-layer flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-extrabold text-slate-950 group-hover:text-brand-800">
                    {service.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-slate-600">{service.copy}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
                    View service
                    <IconArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">No black-box repairs</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              A repair process you can follow.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Good repair is technical. A good customer experience is clear. This is the standard the service desk is
              built around.
            </p>
          </div>

          <ol className="stagger mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {process.map(([number, title, copy]) => (
              <li key={number} className="lift relative overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <span className="absolute -right-3 -top-5 text-6xl font-black text-slate-100" aria-hidden="true">
                  {number}
                </span>
                <span className="relative text-xs font-black tracking-[0.14em] text-brand-700">STEP {number}</span>
                <h3 className="relative mt-4 text-lg font-extrabold text-slate-950">{title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Close */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="relative isolate overflow-hidden rounded-3xl bg-brand-700 px-8 py-12 text-white sm:px-12 sm:py-16">
            <div className="aurora absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="circuit-grid absolute inset-0 opacity-25" />

            <div className="relative grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">Built around convenience</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  At the metro. On WhatsApp. On your terms.
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-blue-100">
                  Visit the workshop opposite Dwarka Mor Metro Station Gate No. 2, or start the conversation before you
                  leave home. Bring the device in only once you know the next step.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/estimator"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-extrabold text-brand-800 transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  Get a repair estimate
                  <IconArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappLink(`Hi ${BUSINESS.name}, I want to discuss a repair.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-4 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Message the team
                </a>
                <Link
                  href="/contact"
                  className="mt-1 text-center text-sm font-bold text-blue-100 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Store details and directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['LocalBusiness', 'ComputerStore'],
            '@id': `${siteUrl()}/#business`,
            name: BUSINESS.name,
            alternateName: BUSINESS.legalName,
            description:
              'Laptop and computer repair with clear diagnosis, approval-first repair and WhatsApp service updates.',
            url: siteUrl(),
            telephone: BUSINESS.phone,
            email: BUSINESS.email,
            image: `${siteUrl()}/opengraph-image`,
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${BUSINESS.address.street}, ${BUSINESS.address.area}`,
              addressLocality: BUSINESS.address.city,
              addressRegion: BUSINESS.address.state,
              postalCode: BUSINESS.address.pincode,
              addressCountry: 'IN',
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '10:00',
                closes: '20:00',
              },
            ],
            // A concrete range: Google ignores the non-standard '₹₹' token.
            priceRange: '₹300–₹25000',
            areaServed: [
              'Dwarka',
              'Dwarka Mor',
              'Uttam Nagar',
              'Janakpuri',
              'Najafgarh',
              'Malviya Nagar',
              'Gurgaon',
              'Noida',
            ].map((name) => ({ '@type': 'City', name })),
          }),
        }}
      />
    </div>
  )
}
