import type { ReactElement } from 'react'

interface TrustItem {
  icon: string
  label: string
  detail: string
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: '⚡', label: 'Same-day service', detail: 'On most common faults' },
  { icon: '🛡️', label: 'Up to 1 year warranty', detail: 'On parts we supply' },
  { icon: '🔧', label: 'Chip-level capability', detail: 'Not just board swaps' },
  { icon: '💬', label: 'Upfront pricing', detail: 'Approve before we start' },
]

export function TrustBar(): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TRUST_ITEMS.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
