'use client'

import { useState, useTransition } from 'react'
import { generateWhatsAppReplyDraft } from '@/lib/actions/ai'
import { updateChatSessionState } from '@/lib/actions/whatsapp'
import type { BotState } from '@/types'

export function SessionControls({ sessionId, state }: { sessionId: string; state: BotState }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<string | null>(null)

  function changeState(next: BotState) {
    setError(null)
    startTransition(async () => {
      const result = await updateChatSessionState({
        session_id: sessionId,
        bot_state: next,
        escalation_reason: next === 'escalated' ? 'Marked for owner follow-up in the console' : undefined,
      })
      if (!result.success) setError(result.error)
    })
  }

  function createDraft() {
    setError(null)
    setDraft(null)
    startTransition(async () => {
      const result = await generateWhatsAppReplyDraft({ sessionId })
      if (!result.success) {
        setError(result.error)
        return
      }
      setDraft(result.data.draft)
    })
  }

  async function copyDraft() {
    if (!draft) return
    await navigator.clipboard.writeText(draft)
  }

  return (
    <div className="flex max-w-64 flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-1">
        {state === 'active' && <button disabled={pending} onClick={createDraft} className="rounded border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">Draft reply</button>}
        {state !== 'paused' && <button disabled={pending} onClick={() => changeState('paused')} className="rounded border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Take over</button>}
        {state !== 'escalated' && <button disabled={pending} onClick={() => changeState('escalated')} className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Escalate</button>}
        {state !== 'active' && <button disabled={pending} onClick={() => changeState('active')} className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Resume</button>}
      </div>
      {draft && <div className="w-full rounded-lg border border-brand-100 bg-brand-50 p-2 text-left"><p className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Unsent AI draft</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700">{draft}</p><button onClick={copyDraft} className="mt-2 text-xs font-bold text-brand-700 hover:text-brand-900">Copy draft</button></div>}
      {error && <span role="alert" className="max-w-64 text-right text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
