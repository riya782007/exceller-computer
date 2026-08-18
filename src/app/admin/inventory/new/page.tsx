import type { Metadata } from 'next'
import { InventoryForm } from '@/components/admin/inventory-form'

export const metadata: Metadata = { title: 'Add inventory' }

export default function NewInventoryPage(): React.ReactElement {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add inventory item</h1>
      <InventoryForm />
    </div>
  )
}
