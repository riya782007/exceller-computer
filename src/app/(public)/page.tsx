import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS, whatsappLink } from '@/lib/constants'
import { ServiceJourney } from '@/components/marketing/service-journey'

export const metadata: Metadata = {
  title: 'Exeller Computer — Laptop & Computer Repair | Dwarka Mor, Delhi',
  description:
    'Transparent laptop and computer repair near Dwarka Mor Metro Station. Get an estimate, approve before work begins, and receive clear repair updates on WhatsApp.',
}

const proofPoints = [
  ['Clear diagnosis', 'Know the problem and expected repair before you decide.'],
  ['Approval first', 'No surprise work: approve the estimate before repair starts.'],
  ['Repair updates', 'Stay informed from intake to pickup on your preferred channel.'],
]

const serviceHighlights = [
  { title: 'Screen & display', copy: 'Panel replacement, flickering screens, backlight and display faults.', href: '/services/laptop-screen-replacement', mark: '01' },
  { title: 'Power & charging', copy: 'Battery health, charging ports, adapters and power-delivery faults.', href: '/services/laptop-battery-replacement', mark: '02' },
  { title: 'Motherboard repair', copy: 'Component-level diagnostics for power, liquid damage and no-boot issues.', href: '/services/laptop-motherboard-repair', mark: '03' },
  { title: 'Speed upgrades', copy: 'SSD and RAM upgrades with practical advice for your workload.', href: '/services/ssd-upgrade', mark: '04' },
]

const process = [
  ['01', 'Tell us the issue', 'Send a WhatsApp message or use the estimator with your device and symptom.'],
  ['02', 'Receive a diagnosis', 'We inspect the device and explain the repair path and expected cost.'],
  ['03', 'Approve with confidence', 'Work begins only after you approve the estimate.'],
  ['04', 'Collect with clarity', 'Receive the completed device, invoice, and applicable warranty details.'],
]

export default function HomePage() {
  return (
    <div className="overflow-hidden bg-white">
      <section className="relative isolate bg-slate-950 py-16 text-white sm:py-24 lg:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(29,78,216,0.65),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(13,148,136,0.3),transparent_26%)]" />
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Dwarka Mor · New Delhi</p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Repair your device <span className="text-blue-300">without the uncertainty.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Exeller Computer brings a clear, approval-first repair experience to laptops and computers—so you understand the issue, the expected cost, and what happens next.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/estimator" className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-blue-50">Get a repair estimate <span className="ml-2">→</span></Link>
              <a href={whatsappLink('Hi Exeller Computer, I need help with my laptop or computer.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20">Start on WhatsApp</a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {proofPoints.map(([title, copy]) => <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-bold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{copy}</p></div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white p-2 shadow-2xl shadow-blue-950/30">
            <div className="rounded-[1.35rem] bg-slate-50 p-6 text-slate-900 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-700">Your repair, made simple</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight">A modern repair desk—before you step into the store.</h2>
              <div className="mt-7 space-y-4">
                <div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-black text-white">1</span><div><p className="font-bold">Share the symptom</p><p className="mt-1 text-sm text-slate-600">Describe the device and issue in a few guided steps.</p></div></div>
                <div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-black text-white">2</span><div><p className="font-bold">Get a human-ready enquiry</p><p className="mt-1 text-sm text-slate-600">Your details reach the repair desk with context—not just a missed call.</p></div></div>
                <div className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-black text-white">3</span><div><p className="font-bold">Stay informed</p><p className="mt-1 text-sm text-slate-600">WhatsApp is the fastest path to a technician or front-desk update.</p></div></div>
              </div>
              <Link href="/contact" className="mt-8 inline-flex text-sm font-extrabold text-brand-700 hover:text-brand-900">See contact and store details →</Link>
            </div>
          </div>
        </div>
      </section>

      <ServiceJourney />

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">What we help with</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">The repair paths people ask for most.</h2></div><Link href="/services" className="text-sm font-bold text-brand-700 hover:text-brand-900">Explore all services →</Link></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {serviceHighlights.map((service) => <Link key={service.title} href={service.href} className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-100/60"><p className="text-xs font-black tracking-[0.18em] text-brand-600">{service.mark}</p><h3 className="mt-6 text-xl font-extrabold text-slate-950 group-hover:text-brand-800">{service.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{service.copy}</p><span className="mt-6 inline-flex text-sm font-bold text-brand-700">View service <span className="ml-2 transition group-hover:translate-x-1">→</span></span></Link>)}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-24"><div className="container mx-auto px-4"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">No black box repairs</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A repair process you can follow.</h2><p className="mt-4 text-slate-600">Good repair is technical. A good customer experience is clear. This is the standard we are building the service desk around.</p></div><ol className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{process.map(([number, title, copy]) => <li key={number} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><span className="text-sm font-black text-brand-700">{number}</span><h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></li>)}</ol></div></section>

      <section className="py-16 sm:py-24"><div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[.95fr_1.05fr]"><div className="rounded-3xl bg-brand-700 p-8 text-white sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-100">Built around convenience</p><h2 className="mt-4 text-3xl font-black tracking-tight">At the metro. On WhatsApp. On your terms.</h2><p className="mt-5 max-w-xl leading-7 text-blue-100">Visit the store opposite Dwarka Mor Metro Station Gate No. 2, or start the conversation before leaving home. Bring your device only after you know the next best step.</p><a href={`tel:${BUSINESS.phone}`} className="mt-8 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-brand-800 hover:bg-blue-50">Call {BUSINESS.phoneDisplay}</a></div><div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-700">Ready when you are</p><h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Start with the detail that matters.</h2><p className="mt-4 text-slate-600">Choose a guided estimate for a pricing range, or message the team for an immediate conversation.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/estimator" className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-extrabold text-white hover:bg-slate-800">Use price estimator</Link><a href={whatsappLink('Hi Exeller Computer, I want to discuss a repair.')} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-extrabold text-slate-800 hover:bg-slate-50">Message the team</a></div></div></div></section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': ['LocalBusiness', 'ComputerStore'], name: BUSINESS.name, alternateName: BUSINESS.legalName, description: 'Laptop and computer repair with clear diagnosis, approval-first repair and WhatsApp service updates.', url: BUSINESS.website, telephone: BUSINESS.phone, address: { '@type': 'PostalAddress', streetAddress: `${BUSINESS.address.street}, ${BUSINESS.address.area}`, addressLocality: BUSINESS.address.city, addressRegion: BUSINESS.address.state, postalCode: BUSINESS.address.pincode, addressCountry: 'IN' }, openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '20:00' }], priceRange: '₹₹', areaServed: ['Dwarka', 'Dwarka Mor', 'Uttam Nagar', 'Janakpuri', 'Najafgarh', 'Malviya Nagar', 'Gurgaon', 'Noida'] }) }} />
    </div>
  )
}
