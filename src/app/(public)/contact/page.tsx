import type { Metadata } from 'next'
import { Container, Section, SectionHeading } from '@/components/ui/layout'
import { ButtonAnchor, ButtonLink } from '@/components/ui/button'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import { getOrderedZones } from '@/lib/catalog/zones'
import { BUSINESS, whatsappLink } from '@/lib/constants'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact & Workshop Location — Dwarka Mor, New Delhi',
  description:
    'Visit our workshop opposite Dwarka Mor Metro Gate No. 2, Sewak Park, New Delhi 110059. Call +91 97188 28173 or message us on WhatsApp for laptop repair across Delhi NCR.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Exeller Computer',
    description:
      'Workshop at Dwarka Mor, New Delhi. Call, WhatsApp or book free doorstep pickup across Delhi NCR.',
    url: `${BUSINESS.website}/contact`,
  },
}

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Contact' }]

const MAP_QUERY = encodeURIComponent(
  'Dwarka Mor Metro Station Gate No 2, Sewak Park, New Delhi 110059'
)

export default function ContactPage() {
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
            title="Talk to us"
            description="WhatsApp is the fastest way to reach us and usually gets a reply within minutes during working hours. You are also welcome to walk in without an appointment."
          />
        </Container>
      </Section>

      <Section className="py-0">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Details */}
            <div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Workshop
                </h2>
                <address className="mt-3 text-sm not-italic leading-relaxed text-gray-700">
                  {BUSINESS.legalName}
                  <br />
                  {BUSINESS.address.street}
                  <br />
                  {BUSINESS.address.area}, {BUSINESS.address.city}
                  <br />
                  {BUSINESS.address.state} – {BUSINESS.address.pincode}
                </address>

                <dl className="mt-5 space-y-3 border-t pt-5 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="text-gray-500">Phone</dt>
                    <dd>
                      <a
                        href={`tel:${BUSINESS.phone}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {BUSINESS.phoneDisplay}
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="text-gray-500">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${BUSINESS.email}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {BUSINESS.email}
                      </a>
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="text-gray-500">Hours</dt>
                    <dd className="text-gray-900">
                      Mon – Sat: {BUSINESS.hours.weekday}
                    </dd>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="text-gray-500">Sunday</dt>
                    <dd className="text-gray-900">Closed</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <ButtonAnchor
                    href={whatsappLink('Hi, I need help with my laptop.')}
                    variant="whatsapp"
                    className="flex-1"
                  >
                    WhatsApp us
                  </ButtonAnchor>
                  <ButtonAnchor
                    href={`tel:${BUSINESS.phone}`}
                    variant="outline"
                    newTab={false}
                    className="flex-1"
                  >
                    Call now
                  </ButtonAnchor>
                </div>
              </div>

              {/* Map — keyless Google embed, lazy loaded */}
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <iframe
                  title="Exeller Computer workshop location at Dwarka Mor, New Delhi"
                  src={`https://maps.google.com/maps?q=${MAP_QUERY}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full border-0"
                />
              </div>
            </div>

            {/* Form */}
            <div>
              <ContactForm whatsappBase={`https://wa.me/${BUSINESS.whatsapp}`} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Coverage */}
      <Section muted>
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            Areas we collect from
          </h2>
          <p className="mt-2 text-gray-600">
            Free doorstep pickup and delivery across Delhi NCR.
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
    </>
  )
}
