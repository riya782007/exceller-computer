import type { Metadata } from 'next'
import { Container, Section, SectionHeading } from '@/components/ui/layout'
import { ButtonAnchor } from '@/components/ui/button'
import { TrustBar } from '@/components/marketing/trust-bar'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import { FaqAccordion, FaqJsonLd } from '@/components/marketing/faq-accordion'
import { SERVICES, SUPPORTED_BRANDS } from '@/lib/catalog/services'
import type { ServiceFaq } from '@/lib/catalog/services'
import { BUSINESS, whatsappLink, siteUrl } from '@/lib/constants'
import { EstimatorForm, type EstimatorService } from './estimator-form'

export const metadata: Metadata = {
  title: 'Laptop Repair Cost Estimator — Instant Price Range',
  description:
    'Select your device, brand and problem to see an instant repair price range in INR, expected turnaround and warranty. Dell, HP, Lenovo, Acer, Asus, Apple. Delhi NCR.',
  alternates: { canonical: '/estimator' },
  openGraph: {
    title: 'Laptop Repair Cost Estimator | Exeller Computer',
    description:
      'Instant repair price range for your laptop or desktop, with turnaround and warranty. No call required.',
    url: `${siteUrl()}/estimator`,
  },
}

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Price estimator' }]

const DEVICES = [
  { value: 'laptop', label: 'Laptop', icon: 'laptop' },
  { value: 'desktop', label: 'Desktop', icon: 'desktop' },
  { value: 'custom_pc', label: 'Custom PC', icon: 'gamepad' },
]

const ESTIMATOR_FAQS: ServiceFaq[] = [
  {
    question: 'How accurate is this estimate?',
    answer:
      'The ranges come from our actual service pricing, so they are realistic rather than marketing figures. Where your machine falls in the range depends on the model and which specific part is needed. We confirm the exact figure after diagnosis and always get your approval before starting work.',
  },
  {
    question: 'Why is the range sometimes wide?',
    answer:
      'Because the part cost varies a lot by model. A screen for a budget 15-inch laptop and a screen for a high-refresh gaming panel are genuinely different prices. Telling you a single low figure and then revising it upward once we have your machine would not be honest, so we show the real span instead.',
  },
  {
    question: 'Do I pay anything for the diagnosis?',
    answer:
      'For most modular repairs the diagnosis is free. Chip-level motherboard work carries a diagnostic fee because it involves substantial bench time, and that fee is credited against the repair if you go ahead.',
  },
  {
    question: 'Is doorstep pickup really free?',
    answer:
      'Yes, across the Delhi NCR areas we serve. We collect the machine, repair it at the workshop and deliver it back. You can also walk in to the Dwarka Mor workshop if you prefer to wait, which for common faults is often the fastest option.',
  },
]

export default function EstimatorPage() {
  // Trim to only the fields the client component renders, so the full catalog
  // (long descriptions, symptoms, FAQs) is never shipped to the browser.
  const services: EstimatorService[] = SERVICES.map((service) => ({
    key: service.key,
    slug: service.slug,
    name: service.name,
    priceMin: service.priceMin,
    priceMax: service.priceMax,
    turnaroundHours: service.turnaroundHours,
    warrantyMonths: service.warrantyMonths,
    deviceTypes: [...service.deviceTypes],
    brands: service.brands === null ? null : [...service.brands],
  }))

  return (
    <>
      <BreadcrumbsJsonLd items={CRUMBS} />
      <FaqJsonLd faqs={ESTIMATOR_FAQS} />

      <Section className="pb-8 lg:pb-10">
        <Container>
          <Breadcrumbs items={CRUMBS} />
          <SectionHeading
            as="h1"
            centered={false}
            className="mt-6"
            title="What will my repair cost?"
            description="Three quick questions and you will have a realistic price range, turnaround time and warranty term. No phone call, no waiting for a reply."
          />
        </Container>
      </Section>

      <Section className="py-0">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <EstimatorForm
                services={services}
                devices={DEVICES}
                brands={[...SUPPORTED_BRANDS]}
                whatsappBase={`https://wa.me/${BUSINESS.whatsapp}`}
              />
            </div>

            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900">
                  Rather just talk to someone?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Send us a photo or describe the problem and we will tell you
                  what is likely wrong and what it should cost.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <ButtonAnchor
                    href={whatsappLink(
                      'Hi, I need a repair estimate for my laptop.'
                    )}
                    variant="whatsapp"
                    className="w-full"
                  >
                    Chat on WhatsApp
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

                <div className="mt-6 border-t pt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Workshop
                  </p>
                  <address className="mt-2 text-sm not-italic leading-relaxed text-gray-700">
                    {BUSINESS.address.street}
                    <br />
                    {BUSINESS.address.area}, {BUSINESS.address.city} –{' '}
                    {BUSINESS.address.pincode}
                  </address>
                  <p className="mt-3 text-sm text-gray-600">
                    Mon – Sat: {BUSINESS.hours.weekday}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="mt-2">
            <TrustBar />
          </div>
        </Container>
      </Section>

      <Section className="py-10 lg:py-14">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900">
            About these estimates
          </h2>
          <div className="mt-6 max-w-3xl">
            <FaqAccordion faqs={ESTIMATOR_FAQS} />
          </div>
        </Container>
      </Section>
    </>
  )
}
