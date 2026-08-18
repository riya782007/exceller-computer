import { cn } from '@/lib/utils'
import type { LabelHTMLAttributes, ReactElement } from 'react'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>): ReactElement {
  return <label className={cn('text-sm font-medium text-gray-700', className)} {...props} />
}
