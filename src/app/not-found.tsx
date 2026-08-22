import type { Metadata } from 'next'
import Link from 'next/link'
import { BUSINESS, whatsappLink } from '@/lib/constants'
import { IconArrowRight, IconPhone, IconWhatsApp } from '@/components/marketing/icons'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

/**
 * A 404 previously rendered Next's default black-and-white page with no header,
 * footer or way to contact the shop — a dead end for a customer who mistyped a
 * service URL. This keeps them one tap from a repair.
 */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-slate-950 px-4 py-16 text-white">
      <div className="aurora absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-brand-600/25 blur-3xl" />
      <div className="aurora-slow absolute -bottom-32 right-0 h-[22rem] w-[22rem] rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="circuit-grid absolute inset-0 opacity-40" />

      <div className="relative mx-auto w-full max-w-2xl text-center">
        <p className="reveal text-sm font-bold uppercase tracking-[0.2em] text-brand-300">Page not found</p>
        <h1 className="reveal reveal-1 mt-5 text-4xl font-black tracking-tight sm:text-5xl">
          That page has moved or never existed.
        </h1>
        <p className="reveal reveal-2 mx-auto mt-5 max-w-lg text-base leading-7 text-slate-300">
          Your device problem is still fixable though. Start with a price range, or message the workshop and describe
          the fault.
        </p>

        <div className="reveal reveal-3 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/estimator"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-brand-50"
          >
            Get a repair estimate
            <IconArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={whatsappLink('Hi Exeller Computer, I need help with my device.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20"
          >
            <IconWhatsApp className="h-4 w-4" />
            Message the team
          </a>
        </div>

        <div className="reveal reveal-4 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          <Link href="/" className="font-bold text-white underline-offset-4 hover:underline">
            Back to home
          </Link>
          <Link href="/services" className="hover:text-white">
            All services
          </Link>
          <a href={`tel:${BUSINESS.phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
            <IconPhone className="h-3.5 w-3.5" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </main>
  )
}
