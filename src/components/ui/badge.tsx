import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactElement } from 'react'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>): ReactElement {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', className)}
      {...props}
    />
  )
}
