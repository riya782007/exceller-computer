import type { MetadataRoute } from 'next'
import { LOCAL_SERVICE_PAGES, SITE_URL } from '@/lib/seo/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/services',
    '/estimate',
    '/refurbished-laptops',
    '/about',
    '/contact',
    '/services/laptop-repair',
    '/services/screen-replacement',
    '/services/motherboard-repair',
    '/services/battery-hinge-upgrades',
    ...LOCAL_SERVICE_PAGES.map((page) => `/services/${page.slug}`),
  ]

  return staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.7,
  }))
}
