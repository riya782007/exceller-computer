import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS } from '@/lib/constants'
import { IconArrowLeft } from '@/components/marketing/icons'

export const metadata: Metadata = {
  title: 'Visitor chat privacy',
  description: 'How Exeller Assist processes public website chat and optional voice input.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 py-12 sm:py-16">
      <article className="container mx-auto max-w-3xl rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 sm:px-10 sm:py-12">
        <Link href="/" className="text-sm font-bold text-brand-700 hover:text-brand-900"><IconArrowLeft className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" />Back to Exeller Computer</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-brand-700">Visitor chat privacy</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">How Exeller Assist handles your chat.</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section><h2 className="text-lg font-black text-slate-950">Chat messages</h2><p className="mt-2">When you send a message, its text and the recent visitor messages in that browser session are sent to Exeller Computer&apos;s server and then to OpenAI to generate a service response. Do not enter passwords, device passcodes, OTPs, card or bank details, government IDs, or private documents.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Optional microphone input</h2><p className="mt-2">The microphone button uses your browser&apos;s speech-recognition feature. Depending on your browser and settings, your browser vendor may process audio to turn it into text. We receive the resulting text only when you send it. Voice input is optional; you can always type.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">What the assistant can access</h2><p className="mt-2">The public assistant receives reviewed service information, indicative price ranges, business contact details, and owner-approved public offers. It cannot access customer accounts, repair jobs, invoices, WhatsApp conversations, private photos, or payment records.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Accuracy and human support</h2><p className="mt-2">Chat guidance is informational. A technician confirms diagnosis, compatibility, stock, exact pricing, final turnaround and applicable warranty after inspection. For immediate human help, call <a className="font-bold text-brand-700 hover:text-brand-900" href={`tel:${BUSINESS.phone}`}>{BUSINESS.phoneDisplay}</a> or use WhatsApp from the website.</p></section>
          <section><h2 className="text-lg font-black text-slate-950">Questions</h2><p className="mt-2">Contact <a className="font-bold text-brand-700 hover:text-brand-900" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> for questions about this notice.</p></section>
        </div>
      </article>
    </div>
  )
}
