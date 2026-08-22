'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { BUSINESS, whatsappLink } from '@/lib/constants'
import { IconSparkle, IconWhatsApp } from './icons'

/**
 * The conversation surface is the heaviest part of the widget (three locale
 * bundles, speech recognition, recommendation cards). Loading it only when a
 * visitor actually opens the assistant keeps it off the critical path for the
 * majority who never do.
 *
 * `loading` matters here: without it the launcher hides on the first tap and
 * nothing replaces it until the chunk arrives, which reads as a broken button.
 */
const AssistantPanel = dynamic(() => import('./assistant-panel').then((mod) => mod.AssistantPanel), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 sm:items-center sm:justify-end sm:p-6">
      <div className="flex h-40 w-full items-center justify-center rounded-t-3xl bg-white sm:h-64 sm:w-[25.5rem] sm:rounded-3xl">
        <span className="flex items-center gap-1.5">
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-600" />
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-600" />
          <span className="typing-dot h-2 w-2 rounded-full bg-brand-600" />
          <span className="sr-only">Opening Exeller Assist</span>
        </span>
      </div>
    </div>
  ),
})

/**
 * Floating assistant entry point.
 *
 * The site previously had two competing circular buttons 16px apart — the
 * assistant and a WhatsApp FAB — with no hierarchy, so neither read as the
 * primary action. This makes the AI assistant the single prominent CTA (it is
 * the differentiator, and it answers instantly at 2am) and demotes WhatsApp to a
 * smaller secondary control for people who simply prefer a human.
 */
export function VisitorChat() {
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const nudgeShown = useRef(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    function openAssistant() {
      setOpen(true)
    }
    window.addEventListener('open-exeller-assist', openAssistant)
    return () => window.removeEventListener('open-exeller-assist', openAssistant)
  }, [])

  /**
   * One late, finite nudge. `nudgeShown` means closing the panel does not
   * restart it, and the halo is cleared after a single cycle so the launcher
   * does not pulse for the rest of the session.
   */
  useEffect(() => {
    if (open || nudgeShown.current) return
    const show = window.setTimeout(() => {
      nudgeShown.current = true
      setNudge(true)
      window.setTimeout(() => setNudge(false), 5800)
    }, 6000)
    return () => window.clearTimeout(show)
  }, [open])

  /** Warm the chunk on intent so the first real click opens instantly. */
  function prefetchPanel() {
    void import('./assistant-panel')
  }

  return (
    <>
      {open ? <AssistantPanel onClose={close} /> : null}

      {/*
       * `pointer-events-none` must sit on the wrapper, not just its children:
       * hit-testing falls through a transparent child to its parent, and this
       * wrapper shares z-50 with the dialog while coming later in the DOM — so
       * it would otherwise swallow taps aimed at the sheet's composer on mobile.
       * Unmounting the controls entirely also keeps them out of the tab order
       * and the accessibility tree while the modal is open.
       */}
      <div
        className={cn(
          'fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6',
          open && 'pointer-events-none'
        )}
      >
        {open ? null : (
          <>
            {/* Secondary: for visitors who would rather reach a person. */}
            <a
              href={whatsappLink(`Hi ${BUSINESS.name}, I need help with my device.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 py-2 pl-2 pr-3.5 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-whatsapp-deep/30 hover:shadow-xl"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-whatsapp-deep text-white">
                <IconWhatsApp className="h-3.5 w-3.5" />
              </span>
              <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-950">
                Talk to a person
              </span>
            </a>

            {/* Primary: the assistant. */}
            <div className="relative">
              {nudge ? (
                <span className="halo absolute inset-0 -z-10 rounded-full bg-brand-500/40" aria-hidden="true" />
              ) : null}

              <button
                type="button"
                onClick={() => setOpen(true)}
                onPointerEnter={prefetchPanel}
                onFocus={prefetchPanel}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="sheen relative flex h-14 items-center gap-2.5 overflow-hidden rounded-full bg-slate-950 pl-3.5 pr-5 text-white shadow-xl shadow-slate-950/25 transition hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600">
                  <IconSparkle className="h-4 w-4" />
                </span>
                <span className="relative text-left leading-none">
                  <span className="block text-[13px] font-extrabold">Ask Exeller</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-brand-200">
                    <span className="breathe inline-block h-1 w-1 rounded-full bg-emerald-400" />
                    Answers in seconds
                  </span>
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
