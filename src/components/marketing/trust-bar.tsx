import type { ReactElement } from 'react'
import { IconBolt, IconShieldCheck, IconTag, IconWrench, type MarketingIcon } from './icons'

interface TrustItem {
  icon: MarketingIcon
  label: string
  detail: string
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: IconBolt, label: 'Same-day service', detail: 'On most common faults' },
  { icon: IconShieldCheck, label: 'Up to 1 year warranty', detail: 'On parts we supply' },
  { icon: IconWrench, label: 'Chip-level capability', detail: 'Not just board swaps' },
  { icon: IconTag, label: 'Upfront pricing', detail: 'Approve before we start' },
]

export function TrustBar(): ReactElement {
  return (
    <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="lift flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-200 hover:shadow-[0_12px_30px_-22px_rgba(15,23,42,0.4)]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{item.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
