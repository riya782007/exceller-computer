/**
 * Single source of truth for the mobile-number rule shared by the public forms
 * and the `captureLead` server action.
 *
 * The forms previously only checked `digits.length >= 10`, so 1234567890 passed
 * locally, round-tripped, and came back as an unattached generic error. Because
 * the server regex runs against a value that has only been trimmed, the forms
 * must submit the *normalised* string — otherwise "+91 98765 43210" clears field
 * validation and is then rejected, which is the exact failure this replaces.
 */
const INDIAN_MOBILE = /^(?:\+?91)?[6-9]\d{9}$/

/** Strips formatting the server regex does not tolerate. */
export function normaliseIndianMobile(raw: string): string {
  return raw.replace(/[\s()\-.]/g, '')
}

export function isValidIndianMobile(raw: string): boolean {
  return INDIAN_MOBILE.test(normaliseIndianMobile(raw))
}

/** The single message both public forms show for a bad number. */
export const MOBILE_HINT =
  'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.'
