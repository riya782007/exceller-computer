import type { MetadataRoute } from 'next'
import { SERVICES } from '@/lib/catalog/services'
import { SERVICE_ZONES } from '@/lib/catalog/zones'
import { siteUrl } from '@/lib/constants'

/**
 * Sitemap covering every indexable route.
 *
 * Priorities reflect commercial intent rather than being uniform: the estimator
 * and individual service pages are where search traffic converts, so they rank
 * above the informational pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${base}/estimator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${base}/locations`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Indexable and linked from the footer, so it belongs here rather than
    // being an orphaned page crawlers find only via the chat widget.
    {
      url: `${base}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  const serviceRoutes: MetadataRoute.Sitemap = SERVICES.filter(
    (service) => service.slug !== ''
  ).map((service) => ({
    url: `${base}/services/${service.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    // Featured services carry the strongest commercial intent
    priority: service.featured ? 0.9 : 0.8,
  }))

  const zoneRoutes: MetadataRoute.Sitemap = SERVICE_ZONES.map((zone) => ({
    url: `${base}/locations/${zone.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...serviceRoutes, ...zoneRoutes]
}
