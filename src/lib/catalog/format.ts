/**
 * Pure formatting helpers, kept in their own module with no data imports.
 *
 * The estimator is a client component. If it imported these from services.ts it
 * would pull the entire catalog — every long description, symptom list and FAQ —
 * into the browser bundle. Keeping them separate means the client ships only the
 * trimmed option list it actually renders.
 */

/** Format a price band for display, e.g. "₹2,500 – ₹8,000". */
export function formatPriceBand(min: number, max: number): string {
  const format = (value: number): string => `₹${value.toLocaleString('en-IN')}`
  return min === max ? format(min) : `${format(min)} – ${format(max)}`
}

/** Human-readable turnaround, e.g. "4 hours" / "2 days". */
export function formatTurnaround(hours: number): string {
  if (hours <= 0) return 'By appointment'
  if (hours < 24) return `${hours} hours`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Same or next day' : `${days} days`
}

/** Human-readable warranty term. */
export function formatWarranty(months: number): string {
  if (months <= 0) return 'Service guarantee'
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`
  const years = months / 12
  return years === 1 ? '1 year' : `${years} years`
}
