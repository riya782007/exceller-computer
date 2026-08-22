import { beforeEach, describe, expect, it } from 'vitest'
import { issueSessionToken, safeEqualSecret, verifySessionToken } from '@/lib/auth/console-session'

/**
 * These guard the console's front door. A regression here silently exposes every
 * customer record, so the forgery cases are the point of the file.
 */
describe('console session tokens', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-signing-secret-value'
  })

  it('accepts a token this server issued', () => {
    expect(verifySessionToken(issueSessionToken())).toBe(true)
  })

  it('rejects a self-invented token of the right length', () => {
    // The original bug: any long string was treated as a valid session.
    expect(verifySessionToken('a'.repeat(64))).toBe(false)
    expect(verifySessionToken('a'.repeat(32))).toBe(false)
  })

  it('rejects empty, malformed and partial tokens', () => {
    expect(verifySessionToken(undefined)).toBe(false)
    expect(verifySessionToken(null)).toBe(false)
    expect(verifySessionToken('')).toBe(false)
    expect(verifySessionToken('not-a-token')).toBe(false)
    expect(verifySessionToken('123.abc')).toBe(false)
  })

  it('rejects a token whose signature was tampered with', () => {
    const token = issueSessionToken()
    const [expiry, nonce, signature] = token.split('.')
    const flipped = signature.startsWith('0') ? `1${signature.slice(1)}` : `0${signature.slice(1)}`
    expect(verifySessionToken(`${expiry}.${nonce}.${flipped}`)).toBe(false)
  })

  it('rejects a token whose expiry was extended', () => {
    const token = issueSessionToken()
    const [, nonce, signature] = token.split('.')
    const future = Date.now() + 90 * 24 * 60 * 60 * 1000
    expect(verifySessionToken(`${future}.${nonce}.${signature}`)).toBe(false)
  })

  it('rejects an expired token', () => {
    const past = Date.now() - 1000
    expect(verifySessionToken(`${past}.abc.def`)).toBe(false)
  })

  it('rejects a token signed with a different secret', () => {
    const token = issueSessionToken()
    process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret'
    expect(verifySessionToken(token)).toBe(false)
  })
})

describe('safeEqualSecret', () => {
  it('matches identical secrets', () => {
    expect(safeEqualSecret('excellercomputer2026', 'excellercomputer2026')).toBe(true)
  })

  it('rejects different secrets, including differing lengths', () => {
    expect(safeEqualSecret('excellercomputer2026', 'excellercomputer2027')).toBe(false)
    expect(safeEqualSecret('short', 'excellercomputer2026')).toBe(false)
    expect(safeEqualSecret('', 'excellercomputer2026')).toBe(false)
  })
})
