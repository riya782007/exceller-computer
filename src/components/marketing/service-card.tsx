import type { ReactElement } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  formatPriceBand,
  formatTurnaround,
  type ServiceItem,
} from '@/lib/catalog/services'
import { IconArrowRight } from './icons'

interface ServiceCardProps {
  service: ServiceItem
}

export function ServiceCard({ service }: ServiceCardProps): ReactElement {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-brand-700">
          {service.name}
        </h3>
        {service.featured ? <Badge variant="brand">Popular</Badge> : null}
      </div>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
        {service.shortDescription}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
        <div>
          <dt className="text-xs text-gray-500">Starts from</dt>
          <dd className="mt-0.5 text-sm font-semibold text-gray-900">
            {formatPriceBand(service.priceMin, service.priceMax)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Turnaround</dt>
          <dd className="mt-0.5 text-sm font-semibold text-gray-900">
            {formatTurnaround(service.turnaroundHours)}
          </dd>
        </div>
      </dl>

      <span className="mt-4 text-sm font-medium text-brand-600 group-hover:text-brand-700">
        View details and pricing <IconArrowRight className="ml-1.5 inline h-3.5 w-3.5 align-[-2px]" />
      </span>
    </Link>
  )
}
