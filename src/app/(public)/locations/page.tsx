import type { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section, SectionHeading } from '@/components/ui/layout'
import { IconArrowRight } from '@/components/marketing/icons'
import { ButtonAnchor } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import { getOrderedZones } from '@/lib/catalog/zones'
import { whatsappLink, siteUrl } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Service Areas — Laptop Repair Across Delhi NCR',
  description:
    'Laptop and computer repair with free doorstep pickup across Dwarka, Dwarka Mor, Uttam Nagar, Janakpuri, Najafgarh, Malviya Nagar, Gurgaon and Noida.',
  alternates: { canonical: '/locations' },
  openGraph: {
    title: 'Service Areas | Exeller Computer',
    description:
      'Free doorstep collection and delivery across Delhi NCR, or walk in to our Dwarka Mor workshop.',
    url: `${siteUrl()}/locations`,
  },
}

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Service areas' }]

export default function LocationsIndexPage() {
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
            title="Where we work"
            description="Our workshop is at Dwarka Mor, and we collect and deliver free of charge across these areas. Pick your area to see travel times and how to reach us."
          />
        </Container>
      </Section>

      <Section className="py-0">
        <Container>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <Link
                key={zone.slug}
                href={`/locations/${zone.slug}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 group-hover:text-brand-700">
                      {zone.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {zone.city}, {zone.state}
                    </p>
                  </div>
                  {zone.travelFee === 0 ? (
                    <Badge variant="success">Free pickup</Badge>
                  ) : null}
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                  {zone.travelTime}
                </p>

                <div className="mt-4 border-t pt-3">
                  <p className="text-xs text-gray-500">
                    Pincodes: {zone.pincodes.join(', ')}
                  </p>
                </div>

                <span className="mt-3 text-sm font-medium text-brand-600 group-hover:text-brand-700">
                  View area details <IconArrowRight className="ml-1.5 inline h-3.5 w-3.5 align-[-2px]" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Not sure if we cover your area?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
              Send us your locality or pincode on WhatsApp and we will confirm
              straight away, along with a collection time window.
            </p>
            <div className="mt-6 flex justify-center">
              <ButtonAnchor
                href={whatsappLink(
                  'Hi, do you cover my area? My locality is: '
                )}
                variant="whatsapp"
                size="lg"
              >
                Check my area on WhatsApp
              </ButtonAnchor>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
