import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps {
  className?: string
  children: ReactNode
}

export function Container({ className, children }: ContainerProps): ReactElement {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}>
      {children}
    </div>
  )
}

interface SectionProps {
  className?: string
  children: ReactNode
  /** Tints the section background to separate it from adjacent sections */
  muted?: boolean
}

export function Section({
  className,
  children,
  muted = false,
}: SectionProps): ReactElement {
  return (
    <section
      className={cn('py-14 lg:py-20', muted && 'bg-gray-50', className)}
    >
      {children}
    </section>
  )
}

interface SectionHeadingProps {
  title: string
  description?: string
  /** Renders as h1 on a page where this is the primary heading */
  as?: 'h1' | 'h2'
  centered?: boolean
  className?: string
}

export function SectionHeading({
  title,
  description,
  as = 'h2',
  centered = true,
  className,
}: SectionHeadingProps): ReactElement {
  const Heading = as
  return (
    <div className={cn(centered && 'text-center', className)}>
      <Heading
        className={cn(
          'font-bold tracking-tight text-gray-900',
          as === 'h1' ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl'
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed text-gray-600',
            centered && 'mx-auto max-w-2xl'
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
