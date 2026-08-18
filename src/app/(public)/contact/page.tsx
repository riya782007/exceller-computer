import type { Metadata } from 'next'
import { BUSINESS } from '@/lib/constants'
import { generateWhatsAppLink } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Contact Exeller Computer',
  description: 'Visit or WhatsApp Exeller Computer opposite Dwarka Mor Metro Gate No. 2, Sewak Park, New Delhi 110059.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage(): React.ReactElement {
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone
  const wa = generateWhatsAppLink(phone, 'Hi Exeller, I would like to visit / book a pickup.')

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Contact</h1>
      <address className="mt-6 not-italic text-gray-700">
        {BUSINESS.address.street}<br />
        {BUSINESS.address.area}, {BUSINESS.address.city} – {BUSINESS.address.pincode}
      </address>
      <p className="mt-4">
        <a className="text-brand-700" href={`tel:${phone}`}>{phone}</a>
        <br />
        <a className="text-brand-700" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
      </p>
      <p className="mt-4 text-gray-600">Mon–Sat 10:00 AM – 8:00 PM · Sunday closed</p>
      <a href={wa} className="mt-6 inline-flex rounded-lg bg-whatsapp px-5 py-3 text-sm font-semibold text-white">
        WhatsApp the shop
      </a>
    </div>
  )
}
