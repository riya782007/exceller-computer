import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/ui/layout'
import { ButtonLink, ButtonAnchor } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ServiceCard } from '@/components/marketing/service-card'
import { TrustBar } from '@/components/marketing/trust-bar'
import { FaqAccordion, FaqJsonLd } from '@/components/marketing/faq-accordion'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import type { ServiceFaq } from '@/lib/catalog/services'
import { getFeaturedServices } from '@/lib/catalog/services'
import {
  SERVICE_ZONES,
  getZoneBySlug,
  getOrderedZones,
  type ServiceZone,
} from '@/lib/catalog/zones'
import { BUSINESS, whatsappLink, siteUrl } from '@/lib/constants'

interface PageProps {
  params: Promise<{ zone: string }>
}

export function generateStaticParams(): Array<{ zone: string }> {
  return SERVICE_ZONES.map((zone) => ({ zone: zone.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { zone: slug } = await params
  const zone = getZoneBySlug(slug)

  if (!zone) {
    return { title: 'Area not found' }
  }

  const title = `Laptop Repair in ${zone.name} — Doorstep Service`
  const description = `Laptop and computer repair in ${zone.name}, ${zone.city}. Free doorstep pickup, ${zone.travelTime.toLowerCase()} from our Dwarka Mor workshop. Screen, battery, keyboard and motherboard repair.`

  return {
    title,
    description,
    alternates: { canonical: `/locations/${zone.slug}` },
    openGraph: {
      title: `Laptop Repair in ${zone.name} | Exeller Computer`,
      description,
      url: `${siteUrl()}/locations/${zone.slug}`,
    },
  }
}

/**
 * Zone-specific FAQs.
 *
 * Generated from the individual zone record rather than shared boilerplate.
 * Location pages that differ only by a swapped place name are treated as
 * doorway pages, which can suppress the entire domain in search results — so
 * the travel time, metro line and pincodes have to be genuinely per-zone.
 */
function buildZoneFaqs(zone: ServiceZone): ServiceFaq[] {
  return [
    {
      question: `Do you offer doorstep laptop repair in ${zone.name}?`,
      answer: zone.doorstepAvailable
        ? `Yes. We collect from ${zone.name} at no charge, repair at our Dwarka Mor workshop and deliver back to you. Typical travel time is ${zone.travelTime.toLowerCase()}. Message us on WhatsApp to book a collection window.`
        : `We currently handle ${zone.name} as a walk-in area. Please bring the device to our Dwarka Mor workshop, opposite Gate No. 2 of the metro station.`,
    },
    {
      question: `How do I reach your workshop from ${zone.name}?`,
      answer: `${zone.metro}. The workshop is at ${BUSINESS.address.street}, ${BUSINESS.address.area}, ${BUSINESS.address.city} – ${BUSINESS.address.pincode}. Nearby landmarks in your area include ${zone.landmarks.slice(0, 3).join(', ')}.`,
    },
    {
      question: `Which pincodes do you cover around ${zone.name}?`,
      answer: `We serve ${zone.pincodes.join(', ')} and the surrounding localities. If your pincode is not listed, send it to us on WhatsApp and we will confirm whether collection is available.`,
    },
    {
      question: 'How long will the repair take?',
      answer:
        'Most common faults such as screen, battery and keyboard replacement are completed the same day once the machine is with us. Chip-level motherboard work typically takes 24 to 48 hours because it involves fault tracing at component level.',
    },
  ]
}

export default async function ZonePage({ params }: PageProps) {
  const { zone: slug } = await params
  const zone = getZoneBySlug(slug)

  if (!zone) {
    notFound()
  }

  const faqs = buildZoneFaqs(zone)
  const featured = getFeaturedServices().slice(0, 6)
  const otherZones = getOrderedZones().filter((z) => z.slug !== zone.slug)

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Service areas', href: '/locations' },
    { label: zone.name },
  ]

  const bookingMessage = `Hi, I need laptop repair in ${zone.name}. Can you arrange a pickup?`

  return (
    <>
      <BreadcrumbsJsonLd items={crumbs} />
      <FaqJsonLd faqs={faqs} />

      {/* LocalBusiness scoped to this service area */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['LocalBusiness', 'ComputerStore'],
            name: `${BUSINESS.name} — ${zone.name}`,
            description: `Laptop and computer repair serving ${zone.name}, ${zone.city}, with free doorstep collection and delivery.`,
            url: `${siteUrl()}/locations/${zone.slug}`,
            telephone: BUSINESS.phone,
            priceRange: '₹₹',
            address: {
              '@type': 'PostalAddress',
              streetAddress: `${BUSINESS.address.street}, ${BUSINESS.address.area}`,
              addressLocality: BUSINESS.address.city,
              addressRegion: BUSINESS.address.state,
              postalCode: BUSINESS.address.pincode,
              addressCountry: 'IN',
            },
            areaServed: {
              '@type': 'City',
              name: zone.name,
              address: {
                '@type': 'PostalAddress',
                addressLocality: zone.city,
                addressRegion: zone.state,
                addressCountry: 'IN',
              },
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                ],
                opens: '10:00',
                closes: '20:00',
              },
            ],
          }),
        }}
      />

      {/* Hero */}
      <Section className="pb-8 lg:pb-10">
        <Container>
          <Breadcrumbs items={crumbs} />

          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">
                  {zone.city}, {zone.state}
                </Badge>
                {zone.travelFee === 0 && zone.doorstepAvailable ? (
                  <Badge variant="success">Free doorstep pickup</Badge>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Laptop repair in {zone.name}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                {zone.intro}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonAnchor
                  href={whatsappLink(bookingMessage)}
                  variant="whatsapp"
                  size="lg"
                >
                  Book pickup on WhatsApp
                </ButtonAnchor>
                <ButtonLink href="/estimator" variant="outline" size="lg">
                  Check repair cost first
                </ButtonLink>
              </div>
            </div>

            {/* Area facts */}
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Serving {zone.name}
                </h2>

                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Travel time</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {zone.travelTime}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pickup charge</dt>
                    <dd className="mt-0.5 font-medium text-gray-900">
                      {zone.travelFee === 0
                        ? 'Free'
                        : `₹${zone.travelFee.toLocaleString('en-IN')}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Metro access</dt>
                    <dd className="mt-0.5 leading-relaxed text-gray-900">
                      {zone.metro}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pincodes covered</dt>
                    <dd className="mt-0.5 font-mono text-xs text-gray-700">
                      {zone.pincodes.join(', ')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 border-t pt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Local landmarks
                  </p>
                  <ul className="mt-2 space-y-1">
                    {zone.landmarks.map((landmark) => (
                      <li key={landmark} className="text-sm text-gray-700">
                        {landmark}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 border-t pt-5">
                  <ButtonAnchor
                    href={`tel:${BUSINESS.phone}`}
                    variant="outline"
                    newTab={false}
                    className="w-full"
                  >
                    Call {BUSINESS.phoneDisplay}
                  </ButtonAnchor>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section muted className="py-10 lg:py-14">
        <Container>
          <TrustBar />
        </Container>
      </Section>

      {/* Services */}
      <Section className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Repairs we handle for {zone.name} customers
          </h2>
          <p className="mt-2 text-gray-600">
            Same pricing whether you walk in or book a collection. Nothing starts
            until you approve the cost.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((service) => (
              <ServiceCard key={service.key} service={service} />
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink href="/services" variant="outline">
              See all services and pricing
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* FAQs */}
      <Section muted className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Questions from {zone.name}
          </h2>
          <div className="mt-6 max-w-3xl">
            <FaqAccordion faqs={faqs} />
          </div>
        </Container>
      </Section>

      {/* Other areas */}
      <Section className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Other areas we serve
          </h2>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {otherZones.map((other) => (
              <ButtonLink
                key={other.slug}
                href={`/locations/${other.slug}`}
                variant="outline"
                size="sm"
              >
                {other.name}
              </ButtonLink>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
