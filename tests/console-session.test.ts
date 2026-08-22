import { beforeEach, describe, expect, it } from 'vitest'
import { issueSessionToken, safeEqualSecret, verifySessionToken } from '@/lib/auth/console-session'

/**
 * These guard the console's front door. A regression here silently exposes every
 * customer record, so the forgery cases are the point of the file.
 *
 * The implementation uses Web Crypto so it can also run in Edge middleware;
 * these tests therefore exercise the same code path production does.
 */
describe('console session tokens', () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-signing-secret-value'
  })

  it('accepts a token this server issued', async () => {
    await expect(verifySessionToken(await issueSessionToken())).resolves.toBe(true)
  })

  it('rejects a self-invented token of the right length', async () => {
    // The original bug: any long string was treated as a valid session.
    await expect(verifySessionToken('a'.repeat(64))).resolves.toBe(false)
    await expect(verifySessionToken('a'.repeat(32))).resolves.toBe(false)
  })

  it('rejects empty, malformed and partial tokens', async () => {
    await expect(verifySessionToken(undefined)).resolves.toBe(false)
    await expect(verifySessionToken(null)).resolves.toBe(false)
    await expect(verifySessionToken('')).resolves.toBe(false)
    await expect(verifySessionToken('not-a-token')).resolves.toBe(false)
    await expect(verifySessionToken('123.abc')).resolves.toBe(false)
  })

  it('rejects a token whose signature was tampered with', async () => {
    const token = await issueSessionToken()
    const [expiry, nonce, signature] = token.split('.')
    const flipped = signature.startsWith('0') ? `1${signature.slice(1)}` : `0${signature.slice(1)}`
    await expect(verifySessionToken(`${expiry}.${nonce}.${flipped}`)).resolves.toBe(false)
  })

  it('rejects a token whose expiry was extended', async () => {
    const token = await issueSessionToken()
    const [, nonce, signature] = token.split('.')
    const future = Date.now() + 90 * 24 * 60 * 60 * 1000
    await expect(verifySessionToken(`${future}.${nonce}.${signature}`)).resolves.toBe(false)
  })

  it('rejects an expired token', async () => {
    const past = Date.now() - 1000
    await expect(verifySessionToken(`${past}.abc.def`)).resolves.toBe(false)
  })

  it('rejects a token signed with a different secret', async () => {
    const token = await issueSessionToken()
    process.env.ADMIN_SESSION_SECRET = 'a-completely-different-secret'
    await expect(verifySessionToken(token)).resolves.toBe(false)
  })
})

describe('safeEqualSecret', () => {
  it('matches identical secrets', async () => {
    await expect(safeEqualSecret('excellercomputer2026', 'excellercomputer2026')).resolves.toBe(true)
  })

  it('rejects different secrets, including differing lengths', async () => {
    await expect(safeEqualSecret('excellercomputer2026', 'excellercomputer2027')).resolves.toBe(false)
    await expect(safeEqualSecret('short', 'excellercomputer2026')).resolves.toBe(false)
    await expect(safeEqualSecret('', 'excellercomputer2026')).resolves.toBe(false)
  })
})
