import Link from 'next/link'
import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}): ReactElement {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message }: { message: string }): ReactElement {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
      <p className="text-sm font-medium text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  )
}

export function SuccessState({ message }: { message: string }): ReactElement {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
      {message}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string
  description: string
  href?: string
  actionLabel?: string
}): ReactElement {
  return (
    <div className="rounded-lg border border-dashed bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      {href && actionLabel ? (
        <Button asChild className="mt-4">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
