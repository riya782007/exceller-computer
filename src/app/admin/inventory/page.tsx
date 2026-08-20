import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Inventory',
}

export default async function InventoryPage() {
  const supabase = await createServerSupabaseClient()

  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true })
    .limit(50)

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">Error loading inventory: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">Manage parts, accessories, and refurbished laptops</p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          + Add Item
        </Link>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Brand</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items && items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/inventory/${item.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                      {item.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 capitalize">
                      {item.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.brand || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatCurrency(item.cost_price)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatCurrency(item.selling_price)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`text-sm font-medium ${item.quantity === 0 ? 'text-red-600' : item.quantity <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {item.is_public ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Public</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Internal</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No inventory items found. Add your first item to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
