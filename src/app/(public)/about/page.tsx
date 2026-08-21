import type { Metadata } from 'next'
import { Container, Section, SectionHeading } from '@/components/ui/layout'
import { ButtonLink, ButtonAnchor } from '@/components/ui/button'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import { TrustBar } from '@/components/marketing/trust-bar'
import { getOrderedZones } from '@/lib/catalog/zones'
import { BUSINESS, whatsappLink } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About Us — Component-Level Repair Specialists in West Delhi',
  description:
    'Exeller Infosolutions LLP operates a component-level laptop and computer repair workshop at Dwarka Mor, New Delhi, serving consumers, resellers and corporate AMC clients across Delhi NCR.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Exeller Computer',
    description:
      'Chip-level repair capability, transparent pricing and up to 1 year warranty. Dwarka Mor, New Delhi.',
    url: `${BUSINESS.website}/about`,
  },
}

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'About' }]

const CAPABILITIES = [
  {
    title: 'Component-level repair, not just part swapping',
    body: 'Most service centres replace an entire motherboard, which often costs more than the laptop is worth. We work at component level — tracing shorted power rails, replacing power management ICs, reflowing and reballing BGA packages, and recovering liquid-damaged boards. That is frequently the difference between a repair costing a few thousand rupees and being told to buy a new machine.',
  },
  {
    title: 'Direct parts sourcing',
    body: 'We source panels, batteries, keyboards and boards directly rather than through intermediaries, which is how the pricing stays competitive with the wholesale hubs. It also means we can tell you honestly whether a genuine part or a grade-A compatible one is the sensible choice for your model and budget.',
  },
  {
    title: 'Pricing you approve before work begins',
    body: 'Diagnosis comes first, then a written estimate with parts and labour separated. Nothing starts until you approve it. If the fault turns out to be simpler or cheaper than expected, the estimate goes down — we do not quote a figure and then find reasons to hold you to it.',
  },
  {
    title: 'Business and reseller supply',
    body: 'Alongside consumer repair we run Annual Maintenance Contracts for offices, institutions and computer labs, and supply verified replacement parts in bulk to independent technicians and repair shops across the region.',
  },
]

const STATS = [
  { value: '10+', label: 'Years in West Delhi' },
  { value: '8', label: 'Service areas across NCR' },
  { value: 'Up to 1 yr', label: 'Warranty on parts we supply' },
  { value: 'Same day', label: 'On most common faults' },
]

export default function AboutPage() {
  const zones = getOrderedZones()

  return (
    <>
      <BreadcrumbsJsonLd items={CRUMBS} />

      <Section className="pb-8 lg:pb-10">
        <Container>
          <Breadcrumbs items={CRUMBS} />
          <SectionHeading
            as="h1"
            centered={false}
            className="mt-6"
            title="A repair workshop, not a collection counter"
            description="Exeller Computer is the trading name of Exeller Infosolutions LLP. We operate a working repair bench at Dwarka Mor in West Delhi, and the machines we take in are repaired here rather than forwarded elsewhere."
          />
        </Container>
      </Section>

      {/* Stats */}
      <Section className="py-0">
        <Container>
          <dl className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm"
              >
                <dt className="order-2 mt-1 text-xs text-gray-500">
                  {stat.label}
                </dt>
                <dd className="order-1 text-2xl font-bold text-brand-700">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Capabilities */}
      <Section muted>
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">How we work</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* What we do */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                What we take on
              </h2>
              <ul className="mt-6 space-y-3 text-sm leading-relaxed text-gray-700">
                <li>
                  Consumer laptop and desktop repair for Dell, HP, Lenovo, Acer,
                  Asus, Apple and MSI
                </li>
                <li>
                  Chip-level motherboard diagnosis and repair, including liquid
                  damage recovery
                </li>
                <li>
                  Performance upgrades — SSD conversions and RAM expansion with
                  data migration
                </li>
                <li>
                  Corporate Annual Maintenance Contracts for offices,
                  institutions and labs
                </li>
                <li>
                  Wholesale supply of verified replacement parts to technicians
                  and repair shops
                </li>
                <li>Custom PC builds for gaming and professional workstations</li>
              </ul>
              <div className="mt-8">
                <ButtonLink href="/services" variant="outline">
                  See services and pricing
                </ButtonLink>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Where to find us
              </h2>
              <address className="mt-6 text-sm not-italic leading-relaxed text-gray-700">
                <strong className="font-semibold text-gray-900">
                  {BUSINESS.legalName}
                </strong>
                <br />
                {BUSINESS.address.street}
                <br />
                {BUSINESS.address.area}, {BUSINESS.address.city}
                <br />
                {BUSINESS.address.state} – {BUSINESS.address.pincode}
              </address>
              <p className="mt-4 text-sm text-gray-600">
                Mon – Sat: {BUSINESS.hours.weekday}
                <br />
                Sunday: Closed
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonAnchor
                  href={whatsappLink('Hi, I would like to know more about your services.')}
                  variant="whatsapp"
                >
                  WhatsApp us
                </ButtonAnchor>
                <ButtonLink href="/contact" variant="outline">
                  Contact details
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <TrustBar />
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Serving across Delhi NCR
            </h2>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {zones.map((zone) => (
                <ButtonLink
                  key={zone.slug}
                  href={`/locations/${zone.slug}`}
                  variant="outline"
                  size="sm"
                >
                  {zone.name}
                </ButtonLink>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
