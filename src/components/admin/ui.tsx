import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { IconAlert, IconArrowRight, type IconProps } from './icons'

type IconComponent = (props: IconProps) => ReactElement

/* ---------------------------------------------------------------- page header */

interface PageHeaderProps {
  /** Small uppercase context line — tells the owner which part of the business this is. */
  eyebrow: string
  title: string
  /** One sentence on why this screen exists. Every screen must justify itself. */
  description: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps): ReactElement {
  return (
    <header className={cn('mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
        <h1 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}

/* ---------------------------------------------------------------------- panel */

interface PanelProps {
  className?: string
  children: ReactNode
}

export function Panel({ className, children }: PanelProps): ReactElement {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]',
        className
      )}
    >
      {children}
    </section>
  )
}

interface PanelHeaderProps {
  icon?: IconComponent
  title: string
  /** Explains the business purpose, not the mechanics. */
  hint?: string
  action?: ReactNode
  className?: string
}

export function PanelHeader({ icon: Icon, title, hint, action, className }: PanelHeaderProps): ReactElement {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4', className)}>
      <div className="flex min-w-0 gap-3">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-slate-900">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs leading-5 text-slate-500">{hint}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function PanelBody({ className, children }: PanelProps): ReactElement {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

/* ----------------------------------------------------------------- metric card */

export type MetricTone = 'brand' | 'amber' | 'emerald' | 'slate' | 'rose'

const TONE: Record<MetricTone, { chip: string; value: string; rail: string }> = {
  brand: { chip: 'bg-brand-50 text-brand-700', value: 'text-slate-900', rail: 'bg-brand-500' },
  amber: { chip: 'bg-amber-50 text-amber-700', value: 'text-slate-900', rail: 'bg-amber-500' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700', value: 'text-slate-900', rail: 'bg-emerald-500' },
  slate: { chip: 'bg-slate-100 text-slate-600', value: 'text-slate-900', rail: 'bg-slate-400' },
  rose: { chip: 'bg-rose-50 text-rose-700', value: 'text-slate-900', rail: 'bg-rose-500' },
}

interface MetricCardProps {
  icon: IconComponent
  label: string
  value: string | number
  /** The "so what" — what this number means for the business today. */
  meaning: string
  tone?: MetricTone
  href?: string
  /** Optional right-aligned note, e.g. a money value or delta. */
  note?: string
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  meaning,
  tone = 'slate',
  href,
  note,
}: MetricCardProps): ReactElement {
  const t = TONE[tone]
  const body = (
    <>
      <span className={cn('absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100', t.rail)} />
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.chip)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {note ? <span className="text-xs font-semibold text-slate-400">{note}</span> : null}
      </div>
      <p className={cn('mt-4 text-3xl font-bold leading-none tracking-tight tabular-nums', t.value)}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{meaning}</p>
      {href ? (
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
          Open
          <IconArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </>
  )

  const shell =
    'group relative isolate overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300'

  if (href) {
    return (
      <Link href={href} className={cn(shell, 'hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)]')}>
        {body}
      </Link>
    )
  }

  return <div className={shell}>{body}</div>
}

/* ------------------------------------------------------------------ status pill */

export type PillTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet'

const PILL: Record<PillTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}

export function StatusPill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: PillTone
  children: ReactNode
  className?: string
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
        PILL[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ empty state */

interface EmptyStateProps {
  icon: IconComponent
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
      <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/* --------------------------------------------------------------- notice banner */

export function NoticeBanner({
  tone = 'warning',
  title,
  children,
}: {
  tone?: 'warning' | 'danger' | 'info'
  title: string
  children: ReactNode
}): ReactElement {
  const styles = {
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-brand-200 bg-brand-50 text-brand-900',
  }[tone]

  return (
    <div role="alert" className={cn('flex gap-3 rounded-xl border px-4 py-3.5', styles)}>
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 text-xs leading-5">
        <p className="text-sm font-bold">{title}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  )
}
