import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The staff console and auth routes hold customer and financial data
        // and must never appear in search results.
        disallow: ['/admin', '/admin/', '/login', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
