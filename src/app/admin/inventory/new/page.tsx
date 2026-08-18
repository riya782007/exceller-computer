import type { Metadata } from 'next'
import { InventoryForm } from '@/components/admin/inventory-form'
import { PageHeader } from '@/components/admin/ui-state'

export const metadata: Metadata = { title: 'Add inventory' }

export default function NewInventoryPage(): React.ReactElement {
  return (
    <div>
      <PageHeader title="Add inventory item" description="SKU must be unique. Quantity cannot be negative." />
      <InventoryForm />
    </div>
  )
}
