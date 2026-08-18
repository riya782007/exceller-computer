'use client'

import { createInventoryItem } from '@/lib/actions/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function InventoryForm(): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData): Promise<void> {
    const result = await createInventoryItem({
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
    })
    if (!result.success) {
      setError(result.error)
      return
    }
    router.push('/admin/inventory')
    router.refresh()
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select id="category" name="category" className="mt-1 h-9 w-full rounded-md border px-3 text-sm">
            <option value="part">Part</option>
            <option value="refurbished_laptop">Refurbished laptop</option>
            <option value="accessory">Accessory</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required className="mt-1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" name="brand" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="cost_price">Cost</Label>
          <Input id="cost_price" name="cost_price" type="number" min={0} step="0.01" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="selling_price">Selling</Label>
          <Input id="selling_price" name="selling_price" type="number" min={0} step="0.01" required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="quantity">Qty</Label>
          <Input id="quantity" name="quantity" type="number" min={0} defaultValue={0} className="mt-1" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="hsn_sac">HSN/SAC</Label>
          <Input id="hsn_sac" name="hsn_sac" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Input id="condition" name="condition" className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="warranty_months">Warranty (months)</Label>
        <Input id="warranty_months" name="warranty_months" type="number" min={0} className="mt-1" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_public" />
        Show on public catalog when in stock
      </label>
      <Button type="submit">Save item</Button>
    </form>
  )
}
