import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container, Section } from '@/components/ui/layout'
import { ButtonLink, ButtonAnchor } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ServiceCard } from '@/components/marketing/service-card'
import { FaqAccordion, FaqJsonLd } from '@/components/marketing/faq-accordion'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import {
  SERVICES,
  getServiceBySlug,
  getServicesByCategory,
  getCategory,
  formatPriceBand,
  formatTurnaround,
  formatWarranty,
  DEVICE_TYPE_LABELS,
} from '@/lib/catalog/services'
import { getOrderedZones } from '@/lib/catalog/zones'
import { BUSINESS, whatsappLink, siteUrl } from '@/lib/constants'

interface PageProps {
  // Next 15 passes route params as a Promise
  params: Promise<{ slug: string }>
}

export function generateStaticParams(): Array<{ slug: string }> {
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    return { title: 'Service not found' }
  }

  const priceBand = formatPriceBand(service.priceMin, service.priceMax)
  const title = `${service.name} in Delhi NCR — ${priceBand}`
  const description = `${service.shortDescription} ${formatWarranty(
    service.warrantyMonths
  )} warranty. Dwarka Mor, New Delhi. Doorstep service across Delhi NCR.`

  return {
    title,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl()}/services/${service.slug}`,
    },
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  const category = getCategory(service.category)
  const related = getServicesByCategory(service.category)
    .filter((item) => item.key !== service.key)
    .slice(0, 3)
  const zones = getOrderedZones().slice(0, 6)

  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: service.name },
  ]

  const bookingMessage = `Hi, I need ${service.name} for my laptop. Can you help?`

  return (
    <>
      <BreadcrumbsJsonLd items={crumbs} />
      <FaqJsonLd faqs={service.faqs} />

      {/* Service structured data with the real price band */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: service.name,
            name: service.name,
            description: service.shortDescription,
            url: `${siteUrl()}/services/${service.slug}`,
            provider: {
              '@type': 'LocalBusiness',
              name: BUSINESS.name,
              telephone: BUSINESS.phone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: `${BUSINESS.address.street}, ${BUSINESS.address.area}`,
                addressLocality: BUSINESS.address.city,
                addressRegion: BUSINESS.address.state,
                postalCode: BUSINESS.address.pincode,
                addressCountry: 'IN',
              },
            },
            areaServed: getOrderedZones().map((zone) => ({
              '@type': 'City',
              name: zone.name,
            })),
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'INR',
              lowPrice: service.priceMin,
              highPrice: service.priceMax,
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      {/* Hero */}
      <Section className="pb-8 lg:pb-10">
        <Container>
          <Breadcrumbs items={crumbs} />

          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {category ? (
                <Badge variant="brand">{category.name}</Badge>
              ) : null}
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {service.name}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                {service.shortDescription}
              </p>
              <p className="mt-4 leading-relaxed text-gray-600">
                {service.longDescription}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {service.deviceTypes.map((type) => (
                  <Badge key={type} variant="neutral">
                    {DEVICE_TYPE_LABELS[type]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing panel */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Estimated price
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPriceBand(service.priceMin, service.priceMax)}
                </p>

                <dl className="mt-5 space-y-3 border-t pt-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Turnaround</dt>
                    <dd className="font-medium text-gray-900">
                      {formatTurnaround(service.turnaroundHours)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Warranty</dt>
                    <dd className="font-medium text-gray-900">
                      {formatWarranty(service.warrantyMonths)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">HSN/SAC</dt>
                    <dd className="font-mono text-xs text-gray-700">
                      {service.hsnSac}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3">
                  <ButtonAnchor
                    href={whatsappLink(bookingMessage)}
                    variant="whatsapp"
                    className="w-full"
                  >
                    Book on WhatsApp
                  </ButtonAnchor>
                  <ButtonAnchor
                    href={`tel:${BUSINESS.phone}`}
                    variant="outline"
                    newTab={false}
                    className="w-full"
                  >
                    Call {BUSINESS.phoneDisplay}
                  </ButtonAnchor>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-gray-500">
                  This is an estimate based on typical cases. The exact cost
                  depends on your model and the fault found during diagnosis, and
                  we confirm it with you before starting work.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* Symptoms */}
      <Section muted className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Signs you need this repair
          </h2>
          <p className="mt-2 text-gray-600">
            If any of these match what you are seeing, this is likely the service
            you need.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.symptoms.map((symptom) => (
              <li
                key={symptom}
                className="flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white p-4"
              >
                <span
                  className="mt-0.5 text-brand-600"
                  aria-hidden="true"
                >
                  •
                </span>
                <span className="text-sm text-gray-700">{symptom}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* What is included */}
      <Section className="py-10 lg:py-14">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                What the price includes
              </h2>
              <ul className="mt-6 space-y-3">
                {service.included.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm leading-relaxed text-gray-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {service.partsNote ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Genuine or compatible parts
                </h2>
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm leading-relaxed text-amber-900">
                    {service.partsNote}
                  </p>
                </div>
                {service.brands ? (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-900">
                      Brands we service for this repair
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.brands.map((brand) => (
                        <Badge key={brand} variant="neutral">
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* FAQs */}
      {service.faqs.length > 0 ? (
        <Section muted className="py-10 lg:py-14">
          <Container>
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently asked questions
            </h2>
            <div className="mt-6 max-w-3xl">
              <FaqAccordion faqs={service.faqs} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Areas served */}
      <Section className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Where we offer this service
          </h2>
          <p className="mt-2 text-gray-600">
            Walk in to our Dwarka Mor workshop, or book free doorstep collection
            across Delhi NCR.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
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
        </Container>
      </Section>

      {/* Related services */}
      {related.length > 0 ? (
        <Section muted className="py-10 lg:py-14">
          <Container>
            <h2 className="text-2xl font-bold text-gray-900">
              Related services
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ServiceCard key={item.key} service={item} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </>
  )
}
