import { describe, it, expect } from 'vitest'
import { shouldEscalate } from '@/lib/ai/escalation'

describe('human escalation heuristics', () => {
  it('pauses when a human is requested', () => {
    expect(shouldEscalate('I want to talk to a human').escalate).toBe(true)
  })

  it('pauses on discount requests', () => {
    expect(shouldEscalate('bhai thoda discount de do').escalate).toBe(true)
  })

  it('does not pause ordinary status questions', () => {
    expect(shouldEscalate('What is the status of EXC-2026-1001?').escalate).toBe(false)
  })
})
