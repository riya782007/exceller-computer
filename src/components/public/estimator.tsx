'use client'

import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'
import { REPAIR_PRICE_ESTIMATES } from '@/lib/constants'
import { REPAIR_ISSUES, SUPPORTED_BRANDS } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMemo, useState } from 'react'

export function Estimator(): React.ReactElement {
  const [brand, setBrand] = useState<(typeof SUPPORTED_BRANDS)[number]>('Dell')
  const [model, setModel] = useState('')
  const [issue, setIssue] = useState<(typeof REPAIR_ISSUES)[number]>('Screen Replacement')

  const estimate = useMemo(() => {
    const table = REPAIR_PRICE_ESTIMATES[issue]
    return table?.[brand] ?? null
  }, [brand, issue])

  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const message = `Hi Exeller Computer, I want to book a pickup.
Brand: ${brand}
Model: ${model || '(not specified)'}
Problem: ${issue}
Estimated range: ${estimate ? `₹${estimate.min}–₹${estimate.max}` : 'to be diagnosed'}
This is a request for booking, not a confirmed quote.`

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6">
      <div>
        <Label htmlFor="brand">Brand</Label>
        <select
          id="brand"
          className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
          value={brand}
          onChange={(event) => setBrand(event.target.value as (typeof SUPPORTED_BRANDS)[number])}
        >
          {SUPPORTED_BRANDS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="model">Device / model</Label>
        <Input id="model" value={model} onChange={(event) => setModel(event.target.value)} className="mt-1" placeholder="Latitude 5490" />
      </div>
      <div>
        <Label htmlFor="issue">Issue</Label>
        <select
          id="issue"
          className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
          value={issue}
          onChange={(event) => setIssue(event.target.value as (typeof REPAIR_ISSUES)[number])}
        >
          {REPAIR_ISSUES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      {estimate ? (
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-sm text-gray-500">Indicative range (not a final quote)</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{estimate.min.toLocaleString('en-IN')} – ₹{estimate.max.toLocaleString('en-IN')}
          </p>
          <p className="mt-2 text-sm text-gray-600">Typical parts warranty on this job type: {estimate.warranty}.</p>
          <p className="mt-2 text-sm text-gray-600">
            Final commercial terms follow bench diagnosis. Water damage and no-power boards can fall outside this range.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-600">This issue is diagnosed in the shop. WhatsApp us to book a drop-off.</p>
      )}
      <a href={generateWhatsAppLink(phone, message)} target="_blank" rel="noopener noreferrer">
        <Button variant="whatsapp" type="button">
          Book pickup via WhatsApp
        </Button>
      </a>
    </div>
  )
}
