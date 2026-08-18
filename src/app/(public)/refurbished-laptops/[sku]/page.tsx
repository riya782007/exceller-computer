import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'
import { SITE_URL } from '@/lib/seo/site'

interface PageProps {
  params: Promise<{ sku: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sku } = await params
  return {
    title: `Refurbished ${sku}`,
    alternates: { canonical: `/refurbished-laptops/${sku}` },
  }
}

export default async function ProductPage({ params }: PageProps): Promise<React.ReactElement> {
  const { sku } = await params
  try {
    const supabase = await createServerSupabaseClient()
    const { data: item } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('sku', sku)
      .eq('category', 'refurbished_laptop')
      .eq('is_public', true)
      .gt('quantity', 0)
      .maybeSingle()

    if (!item) notFound()

  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const wa = generateWhatsAppLink(
    phone,
    `Hi Exeller, I want to check this refurbished unit:\n${item.name} (SKU ${item.sku})\nListed at ${formatCurrency(Number(item.selling_price))}`
  )

  const specs = item.specifications && typeof item.specifications === 'object' ? (item.specifications as Record<string, unknown>) : {}

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-gray-500">{item.brand}</p>
      <h1 className="text-4xl font-bold">{item.name}</h1>
      <p className="mt-4 text-3xl font-semibold">{formatCurrency(Number(item.selling_price))}</p>
      <p className="mt-1 text-sm text-green-700">{item.quantity} available</p>
      <p className="mt-2 text-sm text-gray-600">{item.condition}</p>
      <dl className="mt-8 grid gap-2 text-sm">
        {Object.entries(specs).map(([key, value]) => (
          <div key={key} className="flex justify-between border-b py-2">
            <dt className="capitalize text-gray-500">{key}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
      <a href={wa} className="mt-8 inline-flex rounded-lg bg-whatsapp px-5 py-3 text-sm font-semibold text-white">
        Ask on WhatsApp
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: item.name,
            sku: item.sku,
            brand: item.brand,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: item.selling_price,
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/refurbished-laptops/${item.sku}`,
            },
          }),
        }}
      />
    </div>
  )
  } catch {
    notFound()
  }
}
