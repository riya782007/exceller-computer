import { describe, expect, it } from 'vitest'
import { telHref, toWhatsAppNumber, whatsAppHref } from '@/lib/utils/phone'

/**
 * Leads come from public web forms, so bad input is normal. Fabricating a number
 * would open a customer chat with an unrelated stranger, so "reject" is the
 * required behaviour for anything we cannot verify.
 */
describe('toWhatsAppNumber', () => {
  it('normalises Indian mobile formats', () => {
    expect(toWhatsAppNumber('9876543210')).toBe('919876543210')
    expect(toWhatsAppNumber('98765 43210')).toBe('919876543210')
    expect(toWhatsAppNumber('919876543210')).toBe('919876543210')
    expect(toWhatsAppNumber('09876543210')).toBe('919876543210')
    expect(toWhatsAppNumber('+91 98765 43210')).toBe('919876543210')
  })

  it('does not fabricate a number from too few digits', () => {
    // Previously '98765' became '919191998765' via padStart repetition.
    expect(toWhatsAppNumber('98765')).toBeNull()
    expect(toWhatsAppNumber('12345')).toBeNull()
    expect(toWhatsAppNumber('1')).toBeNull()
  })

  it('does not force an Indian country code onto international numbers', () => {
    expect(toWhatsAppNumber('+1 415 555 0132')).toBe('14155550132')
    expect(toWhatsAppNumber('+971 50 123 4567')).toBe('971501234567')
  })

  it('rejects empty, non-numeric and implausible input', () => {
    expect(toWhatsAppNumber(null)).toBeNull()
    expect(toWhatsAppNumber(undefined)).toBeNull()
    expect(toWhatsAppNumber('')).toBeNull()
    expect(toWhatsAppNumber('not a phone')).toBeNull()
    expect(toWhatsAppNumber('1234567890')).toBeNull() // Indian mobiles start 6-9
  })
})

describe('whatsAppHref', () => {
  it('builds a wa.me link with an encoded message', () => {
    const href = whatsAppHref('9876543210', 'Hello & welcome')
    expect(href).toBe('https://wa.me/919876543210?text=Hello%20%26%20welcome')
  })

  it('returns null rather than a link to a fabricated number', () => {
    expect(whatsAppHref('98765', 'Hello')).toBeNull()
    expect(whatsAppHref(null, 'Hello')).toBeNull()
  })
})

describe('telHref', () => {
  it('builds a tel link for a plausible number', () => {
    expect(telHref('9876543210')).toBe('tel:9876543210')
    expect(telHref('+91 98765 43210')).toBe('tel:+919876543210')
  })

  it('returns null for too-short input', () => {
    expect(telHref('123')).toBeNull()
    expect(telHref(null)).toBeNull()
  })
})
