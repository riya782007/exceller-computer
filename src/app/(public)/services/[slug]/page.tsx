import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LOCAL_SERVICE_PAGES, SITE_URL, localBusinessJsonLd } from '@/lib/seo/site'

interface PageProps {
  params: Promise<{ slug: string }>
}

const STATIC: Record<string, { title: string; h1: string; body: string }> = {
  'laptop-repair': {
    title: 'Laptop repair in Dwarka Mor',
    h1: 'Laptop hardware repair',
    body: 'We take in Dell, HP, Lenovo, Acer, Asus and Apple machines, log a job card, and diagnose before quoting. Pickup via WhatsApp is available in nearby Dwarka / Uttam Nagar areas.',
  },
  'screen-replacement': {
    title: 'Laptop screen replacement',
    h1: 'Display replacement',
    body: 'Cracked glass, dim backlight and no-display faults are separated into panel, cable and GPU/board issues. You only pay for the part that failed.',
  },
  'motherboard-repair': {
    title: 'Motherboard chip-level repair',
    h1: 'Chip-level motherboard repair',
    body: 'Short tracing, charging IC replacement and selected BGA work. If a board is not recoverable we will say so instead of inventing a success rate.',
  },
  'battery-hinge-upgrades': {
    title: 'Battery, hinge, RAM and SSD',
    h1: 'Battery, hinge and upgrades',
    body: 'Swollen packs, broken lids, slow boot from HDD and RAM faults. Upgrade parts come from inventory; stock is deducted on the job card.',
  },
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const local = LOCAL_SERVICE_PAGES.find((page) => page.slug === slug)
  const core = STATIC[slug]
  const title = local?.title ?? core?.title
  if (!title) return {}
  return {
    title,
    description: local?.summary ?? core?.body,
    alternates: { canonical: `/services/${slug}` },
    openGraph: { title, url: `${SITE_URL}/services/${slug}` },
  }
}

export function generateStaticParams(): Array<{ slug: string }> {
  return [
    ...Object.keys(STATIC).map((slug) => ({ slug })),
    ...LOCAL_SERVICE_PAGES.map((page) => ({ slug: page.slug })),
  ]
}

export default async function ServiceDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params
  const local = LOCAL_SERVICE_PAGES.find((page) => page.slug === slug)
  const core = STATIC[slug]
  if (!local && !core) notFound()

  const title = local?.h1 ?? core?.h1 ?? ''
  const body = local?.summary ?? core?.body ?? ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">{title}</h1>
      {local ? <p className="mt-2 text-sm text-gray-500">{local.area}</p> : null}
      <p className="mt-6 text-gray-700">{body}</p>
      <p className="mt-6 text-sm text-gray-500">
        Estimates on /estimate are indicative. Final commercial terms follow diagnosis on a job card.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...localBusinessJsonLd(),
            '@type': ['RepairShop', 'LocalBusiness'],
            name: `Exeller Computer — ${title}`,
          }),
        }}
      />
    </div>
  )
}
