import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BaseProps {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: BaseProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

/** Card with hover affordance — use only when the whole card is clickable. */
export function CardInteractive({ className, children }: BaseProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm transition-all',
        'hover:border-brand-300 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: BaseProps): ReactElement {
  return <div className={cn('p-5 pb-0', className)}>{children}</div>
}

export function CardTitle({ className, children }: BaseProps): ReactElement {
  return (
    <h3 className={cn('text-base font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }: BaseProps): ReactElement {
  return (
    <p className={cn('mt-1.5 text-sm leading-relaxed text-gray-600', className)}>
      {children}
    </p>
  )
}

export function CardContent({ className, children }: BaseProps): ReactElement {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardFooter({ className, children }: BaseProps): ReactElement {
  return (
    <div className={cn('flex items-center gap-3 border-t p-5', className)}>
      {children}
    </div>
  )
}
