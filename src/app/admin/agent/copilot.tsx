'use client'

import { useState, useTransition } from 'react'
import { askOwnerCopilot } from '@/lib/actions/ai'

const suggestedQuestions = [
  'What should I prioritise in the repair desk today?',
  'Give me a simple follow-up plan for new leads.',
  'How can we reduce delays in the repair approval process?',
  'What should the front desk check at device intake?',
]

export function OwnerCopilot() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function ask(nextQuestion?: string) {
    const value = (nextQuestion ?? question).trim()
    if (!value) return
    setQuestion(value)
    setError(null)
    setAnswer(null)
    startTransition(async () => {
      const result = await askOwnerCopilot({ question: value })
      if (!result.success) {
        setError(result.error)
        return
      }
      setAnswer(result.data.answer)
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-xl text-white">✦</div><div><h2 className="text-xl font-black tracking-tight text-slate-950">Ask the owner copilot</h2><p className="mt-1 text-sm leading-6 text-slate-600">It sees aggregate operational counts, not customer secrets. It recommends next steps; it cannot change records or send messages.</p></div></div>
        <form onSubmit={(event) => { event.preventDefault(); ask() }} className="mt-7"><label className="block"><span className="text-sm font-bold text-slate-900">Your question</span><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={5} maxLength={1500} placeholder="Example: Which operational bottlenecks should I review before closing today?" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label><div className="mt-4 flex items-center justify-between gap-4"><p className="text-xs text-slate-500">Do not enter API keys, passwords, OTPs, or payment data.</p><button disabled={pending || question.trim().length < 4} className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{pending ? 'Thinking…' : 'Get recommendation'}</button></div></form>
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-bold">Copilot unavailable</p><p className="mt-1">{error}</p></div>}
        {answer && <article className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Recommendation</p><div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{answer}</div><p className="mt-5 border-t border-brand-100 pt-4 text-xs leading-5 text-slate-500">Review this recommendation before changing prices, approving work, issuing invoices, or committing to a customer.</p></article>}
      </section>
      <aside className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Useful prompts</p><h2 className="mt-3 text-2xl font-black tracking-tight">Turn the dashboard into an action plan.</h2><div className="mt-6 space-y-3">{suggestedQuestions.map((item) => <button key={item} type="button" onClick={() => ask(item)} disabled={pending} className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm font-semibold leading-6 text-slate-100 transition hover:bg-white/10 disabled:opacity-50">{item}</button>)}</div><div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-xs leading-5 text-amber-100"><strong>Human approval stays required.</strong> The copilot does not make repairs, contact customers, set prices, issue invoices, or change database records.</div></aside>
    </div>
  )
}
