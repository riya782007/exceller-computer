import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InventoryForm } from '@/components/admin/inventory-form'
import { ErrorState, PageHeader } from '@/components/admin/ui-state'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Edit inventory' }

export default async function InventoryItemPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: item, error } = await supabase.from('inventory_items').select('*').eq('id', id).maybeSingle()

  if (error) return <ErrorState message="Could not load this inventory item." />
  if (!item) notFound()

  return (
    <div>
      <PageHeader title={item.name} description={`SKU ${item.sku}`} />
      <InventoryForm
        initial={{
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          quantity: item.quantity,
          hsn_sac: item.hsn_sac,
          is_public: item.is_public,
          condition: item.condition,
          warranty_months: item.warranty_months,
          low_stock_threshold: item.low_stock_threshold,
        }}
      />
    </div>
  )
}
