import type { ReactElement, ReactNode, ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary:
    'bg-gray-900 text-white shadow-sm hover:bg-gray-800 focus-visible:ring-gray-500',
  outline:
    'border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus-visible:ring-brand-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
  whatsapp:
    'bg-whatsapp text-white shadow-sm hover:bg-whatsapp-dark focus-visible:ring-whatsapp',
}

// Heights must exist in the default Tailwind scale. `h-13` is not a real class
// and would silently render with no height rather than failing the build.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base',
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50'

/**
 * Shared class builder so the button, internal link and external link variants
 * stay visually identical.
 *
 * Deliberately three separate components rather than one polymorphic `as` prop:
 * polymorphic typing is where this pattern usually goes wrong, and internal vs
 * external links have genuinely different requirements (next/link prefetching
 * vs `rel="noopener"`).
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string
): string {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}

/** Internal navigation — uses next/link for client-side routing and prefetch. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: ButtonLinkProps): ReactElement {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  )
}

interface ButtonAnchorProps {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  /** Set false for tel: and mailto:, which should not open a new tab */
  newTab?: boolean
}

/** External links — WhatsApp, tel:, mailto:. */
export function ButtonAnchor({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  newTab = true,
}: ButtonAnchorProps): ReactElement {
  return (
    <a
      href={href}
      className={buttonClasses(variant, size, className)}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}
