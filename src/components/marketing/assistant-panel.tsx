'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PublicChatLanguage, VisitorRecommendation } from '@/types/assistant'
import {
  IconArrowRight,
  IconCheck,
  IconClose,
  IconMic,
  IconPhone,
  IconSend,
  IconSparkle,
  IconStop,
  IconWhatsApp,
} from './icons'

type ChatMessage = { role: 'visitor' | 'assistant'; content: string }
type AgentAction = { label: string; href: string; kind: 'internal' | 'external' | 'phone' }

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

/** Requests are abandoned after this so the widget can never spin forever. */
const REQUEST_TIMEOUT_MS = 25_000

const localeOptions: Array<{
  value: PublicChatLanguage
  label: string
  speech: string
  welcome: string
  prompts: string[]
  placeholder: string
}> = [
  {
    value: 'en',
    label: 'English',
    speech: 'en-IN',
    welcome:
      'Hi! I can explain our services, give you an honest price range, and tell you the best next step. What device needs help?',
    prompts: ['My laptop screen is cracked', 'How much for an SSD upgrade?', 'Laptop not turning on'],
    placeholder: 'Describe the problem…',
  },
  {
    value: 'hi',
    label: 'हिंदी',
    speech: 'hi-IN',
    welcome:
      'नमस्ते! मैं आपको हमारी सेवाओं, अनुमानित कीमत और अगले सही कदम के बारे में बता सकता हूँ। आपके किस डिवाइस में समस्या है?',
    prompts: ['मेरी लैपटॉप स्क्रीन टूट गई है', 'SSD अपग्रेड की कीमत क्या है?', 'बैटरी फूल गई है'],
    placeholder: 'अपनी समस्या लिखें…',
  },
  {
    value: 'hinglish',
    label: 'Hinglish',
    speech: 'en-IN',
    welcome:
      'Hello! Main aapko services, honest price range aur best next step bata sakta hoon. Aapke device mein kya problem hai?',
    prompts: ['Laptop ki screen toot gayi', 'SSD upgrade kitne ka hoga?', 'Laptop on nahi ho raha'],
    placeholder: 'Apni problem likhein…',
  },
]

function initialMessage(language: PublicChatLanguage): ChatMessage {
  const option = localeOptions.find((item) => item.value === language) ?? localeOptions[0]
  return { role: 'assistant', content: option.welcome }
}

function speechConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const supported = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return supported.SpeechRecognition || supported.webkitSpeechRecognition
}

function ActionChip({ action }: { action: AgentAction }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition'

  if (action.kind === 'internal') {
    return (
      <Link href={action.href} className={cn(base, 'border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100')}>
        {action.label}
        <IconArrowRight className="h-3 w-3" />
      </Link>
    )
  }

  const isExternal = action.kind === 'external'
  return (
    <a
      href={action.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={cn(base, 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
    >
      {isExternal ? <IconWhatsApp className="h-3 w-3" /> : <IconPhone className="h-3 w-3" />}
      {action.label}
    </a>
  )
}

/**
 * The assistant conversation surface.
 *
 * Split out of the launcher and loaded on demand: three locale bundles (including
 * Devanagari copy), the speech-recognition logic and the recommendation renderer
 * should not be in the bundle for a visitor who never opens the chat.
 */
export function AssistantPanel({ onClose }: { onClose: () => void }) {
  const [language, setLanguage] = useState<PublicChatLanguage>('en')
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialMessage('en')])
  const [draft, setDraft] = useState('')
  const [recommendations, setRecommendations] = useState<VisitorRecommendation[]>([])
  const [actions, setActions] = useState<AgentAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceConsent, setVoiceConsent] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement | null>(null)
  const locale = useMemo(
    () => localeOptions.find((item) => item.value === language) ?? localeOptions[0],
    [language]
  )

  /* Focus management + escape, and lock the page behind a genuinely modal dialog. */
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    const { overflow, paddingRight } = document.body.style
    // Compensate for the scrollbar we are about to remove, otherwise the page
    // and sticky header shift sideways as the panel opens.
    const gutter = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled])'
        )
      ).filter((node) => node.offsetParent !== null)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      // Also pulls focus back if it has escaped the dialog entirely.
      if (!dialog.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }
      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      recognitionRef.current?.stop()
      previouslyFocused?.focus()
    }
  }, [onClose])

  /* Keep the newest message in view without re-announcing the whole transcript. */
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, pending])

  function changeLanguage(next: PublicChatLanguage) {
    setLanguage(next)
    setMessages([initialMessage(next)])
    setRecommendations([])
    setActions([])
    setError(null)
    recognitionRef.current?.stop()
  }

  async function send(message?: string) {
    const value = (message ?? draft).trim()
    if (!value || pending) return

    const history = messages
      .filter((entry) => entry.role === 'visitor')
      .slice(-5)
      .map((entry) => entry.content)

    setMessages((current) => [...current, { role: 'visitor', content: value }])
    setDraft('')
    setError(null)
    setPending(true)

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch('/api/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, language, history }),
        signal: controller.signal,
      })
      const result: unknown = await response.json().catch(() => null)
      const data =
        typeof result === 'object' && result !== null
          ? (result as { answer?: unknown; error?: unknown; recommendations?: unknown; actions?: unknown })
          : null

      if (!response.ok || !data || typeof data.answer !== 'string') {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : 'That did not go through. Please try again, or message us on WhatsApp.'
        )
        return
      }

      setMessages((current) => [...current, { role: 'assistant', content: data.answer as string }])
      setRecommendations(Array.isArray(data.recommendations) ? (data.recommendations as VisitorRecommendation[]) : [])
      setActions(Array.isArray(data.actions) ? (data.actions as AgentAction[]) : [])
    } catch (caught) {
      setError(
        caught instanceof DOMException && caught.name === 'AbortError'
          ? 'That took too long. Please try again, or message us on WhatsApp for a fast reply.'
          : 'The assistant is unavailable right now. Please use WhatsApp and we will help you directly.'
      )
    } finally {
      window.clearTimeout(timeout)
      setPending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send()
  }

  function toggleSpeech() {
    const Recognition = speechConstructor()
    if (!Recognition) {
      setError('Voice input is not supported in this browser. Please type your question instead.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    if (!voiceConsent) {
      const accepted = window.confirm(
        "Voice input uses your browser's speech recognition. Depending on your browser, audio may be processed by its vendor to create text. Continue?"
      )
      if (!accepted) return
      setVoiceConsent(true)
    }

    setError(null)
    const recognition = new Recognition()
    recognitionRef.current = recognition
    recognition.lang = locale.speech
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript?.trim()
      if (transcript) setDraft((current) => (current ? `${current} ${transcript}` : transcript))
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError('I could not hear that clearly. Please try again or type it instead.')
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  return (
    <>
      {/* Scrim: makes the dialog genuinely modal and gives a tap-to-close target. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade fixed inset-0 z-40 cursor-default bg-slate-950/45 sm:bg-slate-950/25 sm:backdrop-blur-[2px]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className={cn(
          'animate-settle fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl shadow-slate-950/30',
          // Mobile: a full-width sheet pinned to the bottom. The previous build
          // positioned the panel inside a container offset 96px from the right
          // edge, so on any phone it overflowed off the left of the screen.
          'inset-x-0 bottom-0 max-h-[88vh] rounded-t-3xl',
          // Desktop: an anchored card above the launcher.
          'sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(640px,calc(100vh-9rem))] sm:max-h-none sm:w-[25.5rem] sm:rounded-3xl sm:border sm:border-slate-200'
        )}
      >
        {/* Header */}
        <header className="relative shrink-0 overflow-hidden bg-slate-950 px-5 py-4 text-white">
          <div className="aurora absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand-500/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
                <IconSparkle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p id="assistant-title" className="flex items-center gap-2 font-extrabold leading-tight">
                  Exeller Assist
                  <span className="breathe inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-300">
                  Instant answers · Real price ranges · Human handover
                </p>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="-mr-1 -mt-1 rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-3.5 flex gap-1.5" role="group" aria-label="Conversation language">
            {localeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeLanguage(option.value)}
                aria-pressed={language === option.value}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-bold transition',
                  language === option.value
                    ? 'bg-white text-slate-950'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {/* Transcript */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                'reveal max-w-[88%] text-sm leading-6',
                message.role === 'visitor'
                  ? 'ml-auto rounded-2xl rounded-br-md bg-brand-700 px-4 py-2.5 text-white'
                  : 'rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm'
              )}
            >
              {message.content}
            </div>
          ))}

          {pending ? (
            <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-600" />
              <span className="sr-only">Finding the best answer</span>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
              {error}
            </div>
          ) : null}

          {recommendations.length > 0 ? (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Recommended for you</p>
              {recommendations.map((item) => (
                <article key={item.id} className="reveal overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex gap-3 p-3">
                    {item.imageUrl ? (
                      /* Remote owner-approved URL on an arbitrary host, so this
                         stays a plain img; explicit dimensions prevent shift. */
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        width={64}
                        height={64}
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.summary}</p>
                      {item.priceNote ? (
                        <p className="mt-1 text-xs font-bold text-brand-700">{item.priceNote}</p>
                      ) : null}
                    </div>
                  </div>
                  {item.serviceHref || item.paymentUrl ? (
                    <div className="flex border-t border-slate-100">
                      {item.serviceHref ? (
                        <Link
                          href={item.serviceHref}
                          className="flex-1 px-3 py-2.5 text-center text-[11px] font-bold text-brand-700 transition hover:bg-brand-50"
                        >
                          Service details
                        </Link>
                      ) : null}
                      {item.paymentUrl ? (
                        <a
                          href={item.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 border-l border-slate-100 px-3 py-2.5 text-center text-[11px] font-bold text-slate-900 transition hover:bg-slate-50"
                        >
                          {item.ctaLabel}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {actions.map((action) => (
                <ActionChip key={action.href} action={action} />
              ))}
            </div>
          ) : null}

          <div ref={transcriptEndRef} />
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {messages.length <= 1 ? (
            <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {locale.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={pending}
                  onClick={() => void send(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Your message</span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void send()
                  }
                }}
                rows={1}
                maxLength={700}
                placeholder={locale.placeholder}
                className="block max-h-24 min-h-[2.75rem] w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-sm leading-5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <button
              type="button"
              onClick={toggleSpeech}
              aria-label={listening ? 'Stop voice input' : 'Use voice input'}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition',
                listening
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {listening ? <IconStop className="h-4 w-4" /> : <IconMic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={pending || draft.trim().length < 2}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconSend className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-slate-500">
            <IconCheck className="mt-px h-3 w-3 shrink-0 text-emerald-600" />
            <span>
              Price ranges are indicative until a technician checks the device. Chat text is processed by OpenAI.{' '}
              <Link href="/privacy" className="font-bold text-brand-700 hover:text-brand-900">
                Privacy
              </Link>
            </span>
          </p>
        </div>
      </div>
    </>
  )
}
