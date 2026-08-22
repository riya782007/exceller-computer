import type { Metadata } from 'next'
import { InventoryForm } from './inventory-form'

export const metadata: Metadata = { title: 'Add Inventory' }

export default function NewInventoryPage() {
  return <div className="mx-auto max-w-5xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Inventory control</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Add inventory item</h1><p className="mt-2 text-sm text-slate-600">Create clean stock records that can be allocated to jobs and included in invoices.</p></div><InventoryForm /></div>
}
