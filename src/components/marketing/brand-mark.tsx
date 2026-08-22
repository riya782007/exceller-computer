'use client'

import { useId, type ReactElement } from 'react'
import { cn } from '@/lib/utils'

/**
 * Animated brand mark.
 *
 * A repair shop's credibility starts with looking permanent, so the logo is a
 * real drawn mark rather than a letter in a box: a circuit node inside a rounded
 * shield, with a filament that draws itself once on load and a slow orbit that
 * signals "the system is live". Motion is decoration only — the mark is fully
 * legible with animation disabled.
 */
export function BrandMark({ className }: { className?: string }): ReactElement {
  // Header and footer both render this on every page, so a fixed id would be
  // duplicated in the document.
  const gradientId = useId()
  return (
    <span className={cn('brand-mark relative inline-flex h-9 w-9 shrink-0', className)}>
      <span className="brand-mark-glow absolute inset-0 rounded-[0.85rem] bg-brand-500/30 blur-md" aria-hidden="true" />
      <svg
        viewBox="0 0 40 40"
        className="relative h-full w-full"
        role="img"
        aria-label="Exeller Computer"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill={`url(#${gradientId})`} />

        {/* Filament: draws itself once, forming an E from circuit traces. */}
        <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none">
          <path className="brand-trace" d="M25.5 12.5H15.5v15h10" pathLength={1} />
          <path className="brand-trace brand-trace-2" d="M15.5 20h7" pathLength={1} />
        </g>

        {/* Orbit: the "live system" tell. */}
        <circle className="brand-orbit" cx="20" cy="20" r="14" stroke="#93c5fd" strokeWidth="1" fill="none" strokeDasharray="3 6" opacity="0.55" />
        <circle className="brand-node" cx="27.5" cy="27.5" r="2.6" fill="#60a5fa" />
      </svg>
    </span>
  )
}

/**
 * Wordmark + mark lockup used in the header and footer.
 * `tagline` is optional so the footer can render a tighter version.
 */
export function BrandLockup({
  tagline = 'Computer care',
  className,
  invert = false,
}: {
  tagline?: string | false
  className?: string
  invert?: boolean
}): ReactElement {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className="min-w-0">
        <span
          className={cn(
            'block text-base font-extrabold leading-none tracking-tight',
            invert ? 'text-white' : 'text-slate-950'
          )}
        >
          Exeller
        </span>
        {tagline ? (
          <span
            className={cn(
              'mt-1 block text-[10px] font-bold uppercase leading-none tracking-[0.15em]',
              invert ? 'text-brand-200' : 'text-brand-700'
            )}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  )
}
