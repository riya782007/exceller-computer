'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { type PublicChatLanguage, type VisitorRecommendation } from '@/lib/ai/public-chat'

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

const localeOptions: Array<{ value: PublicChatLanguage; label: string; speech: string; welcome: string; prompts: string[] }> = [
  {
    value: 'en',
    label: 'English',
    speech: 'en-IN',
    welcome: 'Hi! I can help you understand Exeller Computer services, indicative repair ranges, and the best next step. What device needs help?',
    prompts: ['My laptop screen is cracked', 'How much does an SSD upgrade cost?', 'I need a computer for office work'],
  },
  {
    value: 'hi',
    label: 'हिंदी',
    speech: 'hi-IN',
    welcome: 'नमस्ते! मैं Exeller Computer की सेवाओं, अनुमानित कीमतों और अगले सही कदम में मदद कर सकता हूँ। आपके किस डिवाइस में समस्या है?',
    prompts: ['मेरी लैपटॉप स्क्रीन टूट गई है', 'SSD upgrade की कीमत क्या है?', 'बैटरी फूल गई है, क्या करूँ?'],
  },
  {
    value: 'hinglish',
    label: 'Hinglish',
    speech: 'en-IN',
    welcome: 'Hello! Main Exeller Computer ki services, indicative price range aur next step mein help kar sakta hoon. Aapke device mein kya problem hai?',
    prompts: ['Laptop ki screen toot gayi hai', 'SSD upgrade kitne ka hoga?', 'Battery phool gayi hai, kya karun?'],
  },
]

function initialMessage(language: PublicChatLanguage): ChatMessage {
  return { role: 'assistant', content: localeOptions.find((option) => option.value === language)?.welcome || localeOptions[0].welcome }
}

function speechConstructor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const supported = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return supported.SpeechRecognition || supported.webkitSpeechRecognition
}

function AgentActionLink({ action }: { action: AgentAction }) {
  if (action.kind === 'internal') {
    return <Link href={action.href} className="rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-50">{action.label}</Link>
  }

  const isExternal = action.kind === 'external'
  return <a href={action.href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100">{action.label}</a>
}

export function VisitorChat() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<PublicChatLanguage>('en')
  const [messages, setMessages] = useState<ChatMessage[]>(() => [initialMessage('en')])
  const [draft, setDraft] = useState('')
  const [recommendations, setRecommendations] = useState<VisitorRecommendation[]>([])
  const [actions, setActions] = useState<AgentAction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceNoticeAccepted, setVoiceNoticeAccepted] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const launcherRef = useRef<HTMLButtonElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const currentLocale = useMemo(() => localeOptions.find((option) => option.value === language) || localeOptions[0], [language])

  useEffect(() => {
    function openAssistant() {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setOpen(true)
    }
    window.addEventListener('open-exeller-assist', openAssistant)
    return () => window.removeEventListener('open-exeller-assist', openAssistant)
  }, [])

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusableSelector = 'a[href], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled])'
    const frame = window.requestAnimationFrame(() => dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')?.focus())

    function constrainFocus(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        window.requestAnimationFrame(() => restoreFocusRef.current?.focus())
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', constrainFocus)
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener('keydown', constrainFocus) }
  }, [open])

  function openFromLauncher() {
    restoreFocusRef.current = launcherRef.current
    setOpen(true)
  }

  function closeChat() {
    setOpen(false)
    window.requestAnimationFrame(() => restoreFocusRef.current?.focus())
  }

  function changeLanguage(nextLanguage: PublicChatLanguage) {
    setLanguage(nextLanguage)
    setMessages([initialMessage(nextLanguage)])
    setRecommendations([])
    setActions([])
    setError(null)
    recognitionRef.current?.stop()
  }

  async function send(message?: string) {
    const value = (message ?? draft).trim()
    if (!value || pending) return

    const history = messages.filter((entry) => entry.role === 'visitor').slice(-5).map((entry) => entry.content)
    setMessages((current) => [...current, { role: 'visitor', content: value }])
    setDraft('')
    setError(null)
    setPending(true)

    try {
      const response = await fetch('/api/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, language, history }),
      })
      const result: unknown = await response.json().catch(() => null)
      const data = typeof result === 'object' && result !== null ? result as { answer?: unknown; error?: unknown; recommendations?: unknown; actions?: unknown } : null

      if (!response.ok || !data || typeof data.answer !== 'string') {
        setError(typeof data?.error === 'string' ? data.error : 'Please try again or contact the workshop on WhatsApp.')
        return
      }

      setMessages((current) => [...current, { role: 'assistant', content: data.answer as string }])
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations as VisitorRecommendation[] : [])
      setActions(Array.isArray(data.actions) ? data.actions as AgentAction[] : [])
    } catch {
      setError('The chat assistant is unavailable right now. Please try again or use WhatsApp.')
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void send()
  }

  function toggleSpeech() {
    const Constructor = speechConstructor()
    if (!Constructor) {
      setError('Voice input is not supported in this browser. You can type your question or use a current Chrome, Edge, or Safari browser.')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    if (!voiceNoticeAccepted) {
      const accepted = window.confirm('Voice input uses your browser\'s speech-recognition service. Depending on your browser, audio may be processed by its vendor to create text. Continue?')
      if (!accepted) return
      setVoiceNoticeAccepted(true)
    }

    setError(null)
    const recognition = new Constructor()
    recognitionRef.current = recognition
    recognition.lang = currentLocale.speech
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex]
      const transcript = result?.[0]?.transcript?.trim()
      if (transcript) setDraft((current) => current ? `${current} ${transcript}` : transcript)
    }
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') setError('Voice input could not hear that clearly. Please try again or type your message.')
    }
    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  return (
    <div className="fixed bottom-6 right-24 z-50 sm:right-24">
      {open && (
        <section ref={dialogRef} id="visitor-chat" role="dialog" aria-modal="true" aria-label="Chat with Exeller Assist" className="absolute bottom-16 right-0 flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[25rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/25">
          <header className="bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg">✦</span><div><p className="font-extrabold">Exeller Assist</p><p className="mt-0.5 text-xs text-slate-300">Service guide · Price ranges · Human handoff</p></div></div>
              <button type="button" data-dialog-initial-focus onClick={closeChat} className="rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close chat">✕</button>
            </div>
            <label className="mt-4 block"><span className="sr-only">Chat language</span><select value={language} onChange={(event) => changeLanguage(event.target.value as PublicChatLanguage)} className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none"><option className="text-slate-950" value="en">English</option><option className="text-slate-950" value="hi">हिंदी</option><option className="text-slate-950" value="hinglish">Hinglish</option></select></label>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === 'visitor' ? 'ml-7 rounded-2xl rounded-br-sm bg-brand-700 px-4 py-3 text-sm leading-6 text-white' : 'mr-7 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm'}>{message.content}</div>)}
            {pending && <div className="mr-7 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" /><span>Finding the best answer…</span></div>}
            {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{error}</p>}
            {recommendations.length > 0 && <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approved recommendations</p>{recommendations.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex gap-3 p-3">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />}<div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.summary}</p>{item.priceNote && <p className="mt-1 text-xs font-semibold text-brand-700">{item.priceNote}</p>}</div></div><div className="flex border-t border-slate-100">{item.serviceHref && <Link href={item.serviceHref} className="flex-1 px-3 py-2.5 text-center text-xs font-bold text-brand-700 hover:bg-brand-50">Service details</Link>}{item.paymentUrl && <a href={item.paymentUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border-l border-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-900 hover:bg-slate-50">{item.ctaLabel}</a>}</div></article>)}</div>}
            {actions.length > 0 && <div className="flex flex-wrap gap-2">{actions.map((action) => <AgentActionLink key={action.href} action={action} />)}</div>}
          </div>

          <div className="border-t border-slate-200 bg-white p-3"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{currentLocale.prompts.map((prompt) => <button key={prompt} type="button" disabled={pending} onClick={() => void send(prompt)} className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">{prompt}</button>)}</div><form onSubmit={handleSubmit} className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={700} placeholder={language === 'hi' ? 'अपना सवाल लिखें…' : 'Type your question…'} className="min-h-[46px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm leading-5 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /><button type="button" onClick={toggleSpeech} aria-label={listening ? 'Stop voice input' : 'Use voice input'} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg transition ${listening ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>{listening ? '■' : '🎙'}</button><button disabled={pending || draft.trim().length < 2} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">➜</button></form><p className="mt-2 text-[11px] leading-4 text-slate-500">By sending, you agree that chat text is processed by OpenAI. Voice input is optional and uses your browser&apos;s speech service. <Link href="/privacy" className="font-bold text-brand-700 hover:text-brand-900">Privacy details</Link></p></div>
        </section>
      )}
      <button ref={launcherRef} type="button" onClick={openFromLauncher} className="flex h-14 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800" aria-expanded={open} aria-controls="visitor-chat"><span className="text-lg">✦</span><span className="hidden sm:inline">Ask Exeller</span><span className="sr-only sm:hidden">Ask Exeller</span></button>
    </div>
  )
}
