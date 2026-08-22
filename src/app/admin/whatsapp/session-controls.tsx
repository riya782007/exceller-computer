'use client'

import { useState, useTransition } from 'react'
import { updateChatSessionState } from '@/lib/actions/whatsapp'
import type { BotState } from '@/types'

export function SessionControls({ sessionId, state }: { sessionId: string; state: BotState }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1">
        {state !== 'paused' && <button disabled={pending} onClick={() => changeState('paused')} className="rounded border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50">Take over</button>}
        {state !== 'escalated' && <button disabled={pending} onClick={() => changeState('escalated')} className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Escalate</button>}
        {state !== 'active' && <button disabled={pending} onClick={() => changeState('active')} className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Resume</button>}
      </div>
      {error && <span role="alert" className="max-w-48 text-right text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
