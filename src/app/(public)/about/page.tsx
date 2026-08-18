import type { Metadata } from 'next'
import { BUSINESS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'About Exeller Computer',
  description: 'Exeller Infosolutions LLP — laptop repair workshop opposite Dwarka Mor Metro Station Gate No. 2.',
  alternates: { canonical: '/about' },
}

export default function AboutPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">About the workshop</h1>
      <p className="mt-4 text-gray-700">
        {BUSINESS.legalName} runs Exeller Computer as a neighbourhood repair and refurbished-laptop counter, not a marketplace storefront.
        Job cards, parts and invoices live in one system so a WhatsApp chat is not the source of truth.
      </p>
      <p className="mt-4 text-gray-700">
        Walk in opposite Dwarka Mor Metro Station Gate No. 2, Sewak Park, New Delhi 110059.
      </p>
    </div>
  )
}
