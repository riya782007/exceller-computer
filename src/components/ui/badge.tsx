import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: ReactNode
}

export function Badge({
  variant = 'neutral',
  className,
  children,
}: BadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
