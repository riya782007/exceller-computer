'use client'

import { createInventoryItem, updateInventoryItem } from '@/lib/actions/inventory'
import { ErrorState, SuccessState } from '@/components/admin/ui-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InventoryCategory } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export interface InventoryFormValues {
  id: string
  sku: string
  name: string
  category: InventoryCategory
  brand: string | null
  model: string | null
  cost_price: number
  selling_price: number
  quantity: number
  hsn_sac: string | null
  is_public: boolean
  condition: string | null
  warranty_months: number | null
  low_stock_threshold: number
}

export function InventoryForm({ initial }: { initial?: InventoryFormValues }): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData): Promise<void> {
    setPending(true)
    setError(null)
    setSuccess(null)
    const payload = {
      sku: String(formData.get('sku') ?? ''),
      name: String(formData.get('name') ?? ''),
      category: String(formData.get('category') ?? 'part'),
      brand: String(formData.get('brand') ?? ''),
      model: String(formData.get('model') ?? ''),
      cost_price: Number(formData.get('cost_price') ?? 0),
      selling_price: Number(formData.get('selling_price') ?? 0),
      quantity: Number(formData.get('quantity') ?? 0),
      hsn_sac: String(formData.get('hsn_sac') ?? ''),
      is_public: formData.get('is_public') === 'on',
      condition: String(formData.get('condition') ?? ''),
      warranty_months: formData.get('warranty_months') ? Number(formData.get('warranty_months')) : undefined,
      low_stock_threshold: formData.get('low_stock_threshold')
        ? Number(formData.get('low_stock_threshold'))
        : undefined,
    }
    const result = initial
      ? await updateInventoryItem(initial.id, payload)
      : await createInventoryItem(payload)
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    if (!initial) {
      router.push('/admin/inventory')
      router.refresh()
      return
    }
    setSuccess('Inventory item saved')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <ErrorState message={error} /> : null}
      {success ? <SuccessState message={success} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required defaultValue={initial?.sku} disabled={Boolean(initial)} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? 'part'}
            className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
          >
            <option value="part">Part</option>
            <option value="refurbished_laptop">Refurbished laptop</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={initial?.name} className="mt-1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" defaultValue={initial?.brand ?? ''} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={initial?.model ?? ''} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="cost_price">Cost</Label>
          <Input id="cost_price" name="cost_price" type="number" min={0} step="0.01" required defaultValue={initial?.cost_price} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="selling_price">Selling</Label>
          <Input id="selling_price" name="selling_price" type="number" min={0} step="0.01" required defaultValue={initial?.selling_price} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="quantity">Qty</Label>
          <Input id="quantity" name="quantity" type="number" min={0} defaultValue={initial?.quantity ?? 0} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="hsn_sac">HSN/SAC</Label>
          <Input id="hsn_sac" name="hsn_sac" defaultValue={initial?.hsn_sac ?? ''} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Input id="condition" name="condition" defaultValue={initial?.condition ?? ''} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="warranty_months">Warranty (months)</Label>
          <Input id="warranty_months" name="warranty_months" type="number" min={0} defaultValue={initial?.warranty_months ?? ''} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="low_stock_threshold">Low-stock threshold</Label>
          <Input id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} defaultValue={initial?.low_stock_threshold ?? 2} className="mt-1" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_public" defaultChecked={initial?.is_public} />
        Show on public catalog when in stock
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save item'}
      </Button>
    </form>
  )
}
