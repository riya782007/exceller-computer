import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RealtimeRefresh } from '@/components/admin/realtime-refresh'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Inventory',
}

export default async function InventoryPage(): Promise<React.ReactElement> {
  const supabase = await createServerSupabaseClient()
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name', { ascending: true })
    .limit(200)

  if (error) {
    return <ErrorState message="Could not load inventory from the database." />
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Parts, accessories, and refurbished laptops. Quantity cannot go below zero."
        action={
          <Button asChild>
            <Link href="/admin/inventory/new">Add item</Link>
          </Button>
        }
      />
      <RealtimeRefresh table="inventory_items" channelName="admin-inventory" />

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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Catalog</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(items ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                  No inventory rows yet. Add an item to start tracking stock.
                </td>
              </tr>
            ) : (
              (items ?? []).map((item) => {
                const low = item.quantity <= item.low_stock_threshold
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">{item.sku}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/inventory/${item.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-800">
                        {item.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs capitalize text-gray-700">
                      {item.category.replace(/_/g, ' ')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.brand || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{formatCurrency(item.cost_price)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{formatCurrency(item.selling_price)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-sm font-medium ${item.quantity === 0 ? 'text-red-600' : low ? 'text-amber-600' : 'text-green-700'}`}>
                      {item.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {item.is_public ? 'Public' : 'Internal'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
