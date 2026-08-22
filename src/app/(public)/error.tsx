'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { BUSINESS, whatsappLink } from '@/lib/constants'
import { IconPhone, IconWhatsApp } from '@/components/marketing/icons'

/**
 * Recovery UI for a failed public route.
 *
 * Scoped to the `(public)` segment on purpose: an error boundary replaces the
 * children of the layout *above* it, so placing this at `src/app/` would unmount
 * the header, footer and assistant. Here the site chrome survives and the
 * visitor still has every route to the shop.
 */
export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaced in the hosting platform's logs; the digest links it to the trace.
    console.error('Public route error:', error.digest ?? error.message)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <h1 className="text-2xl font-black tracking-tight text-slate-950">Something went wrong on our side</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This is our fault, not yours. Try again — and if it keeps happening, message the workshop directly and we will
          help straight away.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
          <a
            href={whatsappLink(`Hi ${BUSINESS.name}, the website showed an error. I need help with my device.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp-deep px-5 py-3 text-sm font-extrabold text-white transition hover:bg-whatsapp-dark"
          >
            <IconWhatsApp className="h-4 w-4" />
            Message us instead
          </a>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-5 text-sm text-slate-500">
          <Link href="/" className="font-bold text-brand-700 hover:text-brand-900">
            Back to home
          </Link>
          <span className="mx-2 text-slate-300">·</span>
          <a href={`tel:${BUSINESS.phone}`} className="inline-flex items-center gap-1.5 hover:text-slate-900">
            <IconPhone className="h-3.5 w-3.5" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  )
}
