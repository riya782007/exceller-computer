import type { Metadata } from 'next'
import { Container, Section, SectionHeading } from '@/components/ui/layout'
import { ButtonLink, ButtonAnchor } from '@/components/ui/button'
import { ServiceCard } from '@/components/marketing/service-card'
import { CategoryIcon } from '@/components/marketing/category-icon'
import { TrustBar } from '@/components/marketing/trust-bar'
import { Breadcrumbs, BreadcrumbsJsonLd } from '@/components/marketing/breadcrumbs'
import { SERVICE_CATEGORIES, getServicesByCategory } from '@/lib/catalog/services'
import { whatsappLink, siteUrl } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Laptop & Computer Repair Services in Delhi NCR',
  description:
    'Screen replacement, battery, keyboard, hinge, motherboard chip-level repair, SSD and RAM upgrades. Transparent pricing, up to 1 year warranty. Dwarka Mor, New Delhi.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Laptop & Computer Repair Services | Exeller Computer',
    description:
      'Component-level repair for Dell, HP, Lenovo, Acer, Asus and Apple. Transparent pricing and same-day service on most faults.',
    url: `${siteUrl()}/services`,
  },
}

const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'Services' }]

export default function ServicesIndexPage() {
  return (
    <>
      <BreadcrumbsJsonLd items={CRUMBS} />

      {/* Header */}
      <Section className="pb-8 lg:pb-10">
        <Container>
          <Breadcrumbs items={CRUMBS} />
          <SectionHeading
            as="h1"
            centered={false}
            className="mt-6"
            title="Repair services and pricing"
            description="Every price below is a genuine range, not a headline figure. The final cost is confirmed after diagnosis and you approve it before any work starts."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/estimator" size="lg">
              Get an instant estimate
            </ButtonLink>
            <ButtonAnchor
              href={whatsappLink('Hi, I need help with my laptop.')}
              variant="whatsapp"
              size="lg"
            >
              Ask on WhatsApp
            </ButtonAnchor>
          </div>
          <div className="mt-10">
            <TrustBar />
          </div>
        </Container>
      </Section>

      {/* Services grouped by category */}
      {SERVICE_CATEGORIES.map((category, index) => {
        const services = getServicesByCategory(category.key)
        if (services.length === 0) return null

        return (
          <Section
            key={category.key}
            muted={index % 2 === 1}
            className="py-10 lg:py-14"
          >
            <Container>
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <CategoryIcon icon={category.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard key={service.key} service={service} />
                ))}
              </div>
            </Container>
          </Section>
        )
      })}

      {/* Closing CTA */}
      <Section muted>
        <Container>
          <div className="rounded-2xl bg-brand-700 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Not sure what is wrong with your laptop?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Describe the symptoms and we will tell you the likely cause and a
              realistic price range before you bring it in.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href="/estimator" variant="outline" size="lg">
                Use the price estimator
              </ButtonLink>
              <ButtonAnchor
                href={whatsappLink(
                  'Hi, I am not sure what is wrong with my laptop. Can you help?'
                )}
                variant="whatsapp"
                size="lg"
              >
                Describe it on WhatsApp
              </ButtonAnchor>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
