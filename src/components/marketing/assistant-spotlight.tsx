'use client'

import { useEffect, useState } from 'react'
import { IconMic, IconSend, IconSparkle } from './icons'

/**
 * Hero showcase for the assistant.
 *
 * The agent is the product's differentiator, but as a floating button alone it
 * was easy to miss. This shows a visitor what the conversation actually looks
 * like — a real exchange typing itself out — so the value is obvious before they
 * commit to opening anything. The whole card is one button: clicking anywhere
 * opens the real assistant.
 */
/**
 * Example exchange.
 *
 * Deliberately constrained to what the live assistant is permitted to say: the
 * price band matches the catalog for `laptop-screen-replacement`, and there is
 * no claim about stock, turnaround or diagnosis — the system prompt in
 * `lib/ai/public-chat.ts` forbids those, so a scripted demo must not imply them
 * either.
 */
const SCRIPT: Array<{ role: 'visitor' | 'assistant'; text: string }> = [
  { role: 'visitor', text: 'Laptop screen cracked. Kitna lagega?' },
  {
    role: 'assistant',
    text: 'Screen replacement usually runs ₹2,500–₹8,000 depending on the model and panel. Which brand is it?',
  },
  { role: 'visitor', text: 'Dell Inspiron 15' },
  {
    role: 'assistant',
    text: 'Noted. A technician checks the panel and cable, then confirms the exact price before anything starts — you approve it first. Want me to open the estimator for your model?',
  },
]

const TYPING_MS = 900
const HOLD_MS = 1500

export function AssistantSpotlight() {
  const [visible, setVisible] = useState(1)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    // Respect the OS setting: show the full exchange immediately instead of
    // animating it.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(SCRIPT.length)
      return
    }

    let cancelled = false
    // A single tracked timer rather than an array: the loop is sequential, so
    // only one is ever outstanding and nothing accumulates over a long session.
    let timer = 0

    function after(ms: number, fn: () => void) {
      timer = window.setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
    }

    function step(index: number) {
      if (cancelled) return

      if (index >= SCRIPT.length) {
        // Loop so a visitor arriving mid-cycle still sees the opening question.
        after(5200, () => {
          setVisible(1)
          step(1)
        })
        return
      }

      const isAssistant = SCRIPT[index].role === 'assistant'
      setTyping(isAssistant)
      after(isAssistant ? TYPING_MS : 420, () => {
        setTyping(false)
        setVisible(index + 1)
        after(HOLD_MS, () => step(index + 1))
      })
    }

    after(1400, () => step(1))
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  function open() {
    window.dispatchEvent(new Event('open-exeller-assist'))
  }

  return (
    <div className="animate-settle relative">
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label="Open Exeller Assist to ask about your device"
        className="card-3d group block w-full rounded-3xl border border-white/10 bg-white/95 p-2 text-left shadow-2xl shadow-brand-950/40 backdrop-blur focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/50"
      >
        <div className="card-3d-layer rounded-[1.35rem] bg-white">
          {/* Assistant header */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white">
              <IconSparkle className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center">
                <span className="breathe h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-slate-950">Exeller Assist</span>
              <span className="mt-0.5 block text-[11px] font-semibold text-emerald-700">
                Available 24/7 · English, हिंदी, Hinglish
              </span>
            </span>
            {/* Labelled as an example so a scripted demo is never mistaken for a
                real session the shop is accountable for. */}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Example
            </span>
          </div>

          {/* Scripted exchange. Fixed height, not a floor: a min-height lets the
              hero row change size every time the loop restarts. */}
          <div className="h-[17rem] space-y-2.5 overflow-hidden p-4">
            {SCRIPT.slice(0, visible).map((line, index) => (
              <div
                key={index}
                className={
                  line.role === 'visitor'
                    ? 'reveal ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2.5 text-[13px] leading-5 text-white'
                    : 'reveal max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] leading-5 text-slate-800'
                }
              >
                {line.text}
              </div>
            ))}

            {typing ? (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-3.5 py-3">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
              </div>
            ) : null}
          </div>

          {/* Composer — visual only; the real one opens on click */}
          <div className="flex items-center gap-2 border-t border-slate-100 p-3">
            <span className="flex-1 rounded-xl bg-slate-100 px-3.5 py-2.5 text-[13px] text-slate-400">
              Ask about your device…
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500">
              <IconMic className="h-4 w-4" />
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white transition group-hover:bg-brand-800">
              <IconSend className="h-4 w-4" />
            </span>
          </div>
        </div>
      </button>

      <p className="mt-3.5 text-center text-[11px] font-semibold text-slate-400">
        Price ranges are indicative until a technician checks the device.
      </p>
    </div>
  )
}
