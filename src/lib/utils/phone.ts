/**
 * Phone normalisation for customer contact links.
 *
 * Leads arrive from public web forms, so short, mistyped and non-Indian numbers
 * must be expected. Fabricating a number would open a chat with a stranger, so
 * anything we cannot verify returns null and the caller hides the button.
 */

/** Returns a wa.me-ready E.164 digit string, or null when the input is unusable. */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null

  const trimmed = raw.trim()
  const hadPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 0) return null

  // Explicit international format — trust it, only sanity-check the length.
  if (hadPlus) return digits.length >= 8 && digits.length <= 15 ? digits : null

  // Indian mobile: 10 digits starting 6-9.
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`

  // Already carries the country code.
  if (/^91[6-9]\d{9}$/.test(digits)) return digits

  // 0-prefixed domestic dialling.
  if (/^0[6-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`

  return null
}

/** Builds a wa.me deep link, or null when the number cannot be trusted. */
export function whatsAppHref(raw: string | null | undefined, message: string): string | null {
  const number = toWhatsAppNumber(raw)
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Returns a tel: href only for a plausible number. */
export function telHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8) return null
  return `tel:${raw.trim().startsWith('+') ? `+${digits}` : digits}`
}

/** Start of the current day in a fixed business timezone, as an ISO string. */
export function startOfBusinessDayIso(timeZone = 'Asia/Kolkata'): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? '0')
  const elapsedMs =
    (get('hour') % 24) * 3600_000 + get('minute') * 60_000 + get('second') * 1000 + now.getMilliseconds()

  return new Date(now.getTime() - elapsedMs).toISOString()
}

/** Current hour in the business timezone, for time-of-day greetings. */
export function businessHour(timeZone = 'Asia/Kolkata'): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(new Date())
  )
}
