import { describe, expect, it } from 'vitest'
import { MOBILE_HINT, isValidIndianMobile, normaliseIndianMobile } from '@/lib/utils/indian-mobile'

/**
 * The server rule in `src/lib/actions/leads.ts` is
 * `/^(\+?91)?[6-9]\d{9}$/` applied to a trimmed string. These tests exist to
 * keep the client predicate and the submitted value in agreement — the previous
 * mismatch let a visitor clear field validation and then get a generic,
 * unattached error back from the server.
 */
const SERVER_RULE = /^(?:\+?91)?[6-9]\d{9}$/

describe('isValidIndianMobile', () => {
  it('accepts plain and formatted Indian mobiles', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true)
    expect(isValidIndianMobile('98765 43210')).toBe(true)
    expect(isValidIndianMobile('98765-43210')).toBe(true)
    expect(isValidIndianMobile('+91 98765 43210')).toBe(true)
    expect(isValidIndianMobile('919876543210')).toBe(true)
    expect(isValidIndianMobile('  9876543210  ')).toBe(true)
  })

  it('rejects numbers the server would also reject', () => {
    expect(isValidIndianMobile('1234567890')).toBe(false) // must start 6-9
    expect(isValidIndianMobile('5876543210')).toBe(false)
    expect(isValidIndianMobile('98765')).toBe(false)
    expect(isValidIndianMobile('')).toBe(false)
    expect(isValidIndianMobile('not a number')).toBe(false)
    expect(isValidIndianMobile('98765432101234')).toBe(false)
  })

  it('produces a value the server regex accepts', () => {
    // The regression guard: anything the form accepts must survive the server.
    for (const input of ['9876543210', '98765 43210', '98765-43210', '+91 98765 43210', '(98765) 43210']) {
      expect(isValidIndianMobile(input)).toBe(true)
      expect(SERVER_RULE.test(normaliseIndianMobile(input))).toBe(true)
    }
  })

  it('exposes one shared message for both forms', () => {
    expect(MOBILE_HINT).toContain('10-digit')
  })
})

describe('normaliseIndianMobile', () => {
  it('strips only formatting characters', () => {
    expect(normaliseIndianMobile('+91 (98765) 43-210')).toBe('+919876543210')
    expect(normaliseIndianMobile('98765.43210')).toBe('9876543210')
  })
})
