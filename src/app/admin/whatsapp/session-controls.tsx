'use client'

import { setChatBotState } from '@/lib/actions/chat'
import type { BotState } from '@/types'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ChatSessionControls({
  sessionId,
  state,
}: {
  sessionId: string
  state: BotState
}): React.ReactElement {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function setState(next: BotState): Promise<void> {
    setPending(true)
    setError(null)
    const result = await setChatBotState({
      session_id: sessionId,
      bot_state: next,
      escalation_reason: next === 'active' ? '' : 'Staff takeover from ERP',
    })
    setPending(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state !== 'paused' ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => void setState('paused')}>
          Pause bot
        </Button>
      ) : null}
      {state !== 'active' ? (
        <Button size="sm" disabled={pending} onClick={() => void setState('active')}>
          Resume bot
        </Button>
      ) : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
