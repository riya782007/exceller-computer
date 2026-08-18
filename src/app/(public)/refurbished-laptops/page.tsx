import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Refurbished business laptops',
  description: 'Live stock of certified refurbished Latitude, EliteBook and ThinkPad units at Exeller Computer, Dwarka Mor.',
  alternates: { canonical: '/refurbished-laptops' },
}

interface Search {
  brand?: string
  processor?: string
  ram?: string
  storage?: string
  budget?: string
  condition?: string
}

function specValue(specs: unknown, key: string): string {
  if (!specs || typeof specs !== 'object') return ''
  const value = (specs as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}): Promise<React.ReactElement> {
  const filters = await searchParams
  let items: Array<{
    id: string
    sku: string
    name: string
    brand: string | null
    selling_price: number
    quantity: number
    condition: string | null
    specifications: unknown
    is_public: boolean
  }> = []

  try {
    const supabase = await createServerSupabaseClient()
    const result = await supabase
      .from('inventory_items')
      .select('id, sku, name, brand, selling_price, quantity, condition, specifications, is_public')
      .eq('category', 'refurbished_laptop')
      .eq('is_public', true)
      .gt('quantity', 0)
      .order('selling_price')
    items = result.data ?? []
  } catch {
    items = []
  }

  const filtered = items.filter((item) => {
    if (filters.brand && item.brand !== filters.brand) return false
    if (filters.condition && (item.condition ?? '') !== filters.condition) return false
    if (filters.processor && !specValue(item.specifications, 'processor').toLowerCase().includes(filters.processor.toLowerCase())) {
      return false
    }
    if (filters.ram && specValue(item.specifications, 'ram') !== filters.ram) return false
    if (filters.storage && specValue(item.specifications, 'storage') !== filters.storage) return false
    if (filters.budget === 'under-25k' && Number(item.selling_price) >= 25000) return false
    if (filters.budget === '25-35k' && (Number(item.selling_price) < 25000 || Number(item.selling_price) > 35000)) return false
    if (filters.budget === '35k-plus' && Number(item.selling_price) <= 35000) return false
    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold">Refurbished business laptops</h1>
      <p className="mt-3 text-gray-600">
        Availability is the warehouse quantity. When a unit is sold in the ERP it disappears here.
      </p>
      <form className="mt-6 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <input name="brand" placeholder="Brand" defaultValue={filters.brand} className="h-9 rounded-md border px-2 text-sm" />
        <input name="processor" placeholder="Processor" defaultValue={filters.processor} className="h-9 rounded-md border px-2 text-sm" />
        <input name="ram" placeholder="RAM" defaultValue={filters.ram} className="h-9 rounded-md border px-2 text-sm" />
        <input name="storage" placeholder="Storage" defaultValue={filters.storage} className="h-9 rounded-md border px-2 text-sm" />
        <select name="budget" defaultValue={filters.budget} className="h-9 rounded-md border px-2 text-sm">
          <option value="">Any budget</option>
          <option value="under-25k">Under ₹25,000</option>
          <option value="25-35k">₹25,000–35,000</option>
          <option value="35k-plus">₹35,000+</option>
        </select>
        <input name="condition" placeholder="Condition" defaultValue={filters.condition} className="h-9 rounded-md border px-2 text-sm" />
        <button className="h-9 rounded-md bg-brand-600 px-3 text-sm text-white sm:col-span-3 lg:col-span-6" type="submit">
          Filter live stock
        </button>
      </form>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Link key={item.id} href={`/refurbished-laptops/${item.sku}`} className="rounded-xl border bg-white p-5 hover:border-brand-300">
            <p className="text-xs text-gray-500">{item.brand}</p>
            <h2 className="mt-1 font-semibold">{item.name}</h2>
            <p className="mt-2 text-lg font-bold">{formatCurrency(Number(item.selling_price))}</p>
            <p className="text-xs text-green-700">{item.quantity} in stock</p>
            <p className="mt-1 text-xs text-gray-500">{item.condition}</p>
          </Link>
        ))}
        {filtered.length === 0 ? <p className="text-sm text-gray-500">No matching units in stock right now.</p> : null}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            url: `${SITE_URL}/refurbished-laptops`,
            itemListElement: filtered.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: `${SITE_URL}/refurbished-laptops/${item.sku}`,
              name: item.name,
            })),
          }),
        }}
      />
    </div>
  )
}
