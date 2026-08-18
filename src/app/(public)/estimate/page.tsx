import type { Metadata } from 'next'
import { Estimator } from '@/components/public/estimator'

export const metadata: Metadata = {
  title: 'Laptop repair estimate',
  description: 'Indicative repair ranges for Dell, HP, Lenovo, Acer, Asus and Apple. Book pickup on WhatsApp after you see the range.',
  alternates: { canonical: '/estimate' },
}

export default function EstimatePage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Repair estimate</h1>
      <p className="mt-4 text-gray-600">
        These figures are planning ranges from typical Dwarka Mor jobs. They are not a final diagnostic quote and do not reserve a part.
      </p>
      <div className="mt-8">
        <Estimator />
      </div>
    </div>
  )
}
