'use client'

import { useState } from 'react'
import { captureLead } from '@/lib/actions/leads'
import { MOBILE_HINT, isValidIndianMobile, normaliseIndianMobile } from '@/lib/utils/indian-mobile'
import { buttonClasses } from '@/components/ui/button'

interface ContactFormProps {
  whatsappBase: string
}

export function ContactForm({ whatsappBase }: ContactFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [locality, setLocality] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)

    if (!isValidIndianMobile(phone)) {
      setError(MOBILE_HINT)
      return
    }

    setSending(true)
    const result = await captureLead({
      full_name: name,
      phone: normaliseIndianMobile(phone),
      locality,
      issue_summary: message,
      source: 'website_contact',
    })
    setSending(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSent(true)
  }

  if (sent) {
    const followUp = `${whatsappBase}?text=${encodeURIComponent(
      `Hi, I just submitted an enquiry on your website.${
        name.trim() !== '' ? ` My name is ${name.trim()}.` : ''
      }`
    )}`

    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="text-base font-semibold text-green-900">
          Thanks, we have your enquiry
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-green-800">
          We will call you back during working hours. If it is urgent, message us
          on WhatsApp and you will usually get a reply within minutes.
        </p>
        <a
          href={followUp}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('whatsapp', 'md', 'mt-5')}
        >
          Continue on WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-base font-semibold text-gray-900">
        Send us an enquiry
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Tell us what is happening and we will get back to you with a likely cause
        and cost.
      </p>

      {error ? (
        <div
          id="contact-error"
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Mobile number <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? 'contact-error' : undefined}
            placeholder="10-digit mobile number"
            className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label
            htmlFor="locality"
            className="block text-sm font-medium text-gray-700"
          >
            Area or pincode <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="locality"
            type="text"
            value={locality}
            onChange={(event) => setLocality(event.target.value)}
            placeholder="e.g. Uttam Nagar, 110059"
            className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            What is the problem?
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Device, brand and what is happening"
            maxLength={1000}
            className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={sending}
        className={buttonClasses('primary', 'lg', 'mt-6 w-full')}
      >
        {sending ? 'Sending...' : 'Send enquiry'}
      </button>

      <p className="mt-3 text-xs text-gray-500">
        We use your number only to respond to this enquiry.
      </p>
    </form>
  )
}
