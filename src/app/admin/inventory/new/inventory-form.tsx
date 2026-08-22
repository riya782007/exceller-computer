'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInventoryItem } from '@/lib/actions/inventory'

export function InventoryForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    const number = (key: string) => Number(formData.get(key) || 0)
    startTransition(async () => {
      const result = await createInventoryItem({
        sku: String(formData.get('sku') ?? ''),
        name: String(formData.get('name') ?? ''),
        category: String(formData.get('category') ?? 'part') as 'part' | 'refurbished_laptop' | 'accessory',
        brand: String(formData.get('brand') ?? ''),
        model: String(formData.get('model') ?? ''),
        cost_price: number('costPrice'),
        selling_price: number('sellingPrice'),
        quantity: number('quantity'),
        hsn_sac: String(formData.get('hsnSac') ?? ''),
        condition: String(formData.get('condition') ?? ''),
        warranty_months: formData.get('warrantyMonths') ? number('warrantyMonths') : undefined,
        is_public: formData.get('isPublic') === 'on',
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push('/admin/inventory')
      router.refresh()
    })
  }

  const fieldClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <form action={submit} className="max-w-4xl space-y-6">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Item details</h2><p className="mt-1 text-sm text-slate-600">Use a unique SKU. This becomes the operational identity for stock and invoicing.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold">SKU</span><input required name="sku" placeholder="EXC-SSD-500-001" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Item name</span><input required name="name" placeholder="500GB NVMe SSD" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Category</span><select name="category" className={fieldClass}><option value="part">Part</option><option value="refurbished_laptop">Refurbished laptop</option><option value="accessory">Accessory</option></select></label><label className="block"><span className="text-sm font-semibold">Brand</span><input name="brand" placeholder="Samsung, Dell, HP…" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Model</span><input name="model" placeholder="Optional model" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Condition</span><input name="condition" placeholder="New, refurbished, open box…" className={fieldClass} /></label></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-950">Stock and pricing</h2><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><label className="block"><span className="text-sm font-semibold">Cost price (₹)</span><input required min="0" step="0.01" type="number" name="costPrice" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Selling price (₹)</span><input required min="0" step="0.01" type="number" name="sellingPrice" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Opening quantity</span><input required min="0" step="1" type="number" name="quantity" defaultValue="0" className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">HSN / SAC</span><input name="hsnSac" maxLength={20} className={fieldClass} /></label><label className="block"><span className="text-sm font-semibold">Warranty months</span><input min="0" step="1" type="number" name="warrantyMonths" className={fieldClass} /></label></div><label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" name="isPublic" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" /><span><span className="block text-sm font-bold text-slate-900">Publish as available stock</span><span className="block text-xs text-slate-600">Use only for products confirmed ready for a public listing.</span></span></label></section>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.back()} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button disabled={pending} className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50">{pending ? 'Saving…' : 'Save inventory item'}</button></div>
    </form>
  )
}
