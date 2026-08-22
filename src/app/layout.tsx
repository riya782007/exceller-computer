import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { BUSINESS, siteUrl } from '@/lib/constants'
import '@/styles/globals.css'

/**
 * The design system declares Inter in tailwind.config.ts, but nothing was ever
 * loading it — every visitor silently got system-ui. next/font self-hosts the
 * file, so there is no third-party request and no flash of unstyled text.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  // Required for the relative `alternates.canonical` values used on the public
  // pages to resolve to absolute URLs. Without it Next emits a warning and
  // canonicals resolve against localhost.
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'Exeller Computer — Laptop & Computer Repair | Dwarka Mor, Delhi',
    template: '%s | Exeller Computer',
  },
  description:
    'Expert laptop and computer repair services near Dwarka Mor Metro Station, New Delhi. Component-level repair, refurbished laptops, spare parts & accessories. Same-day service available.',
  applicationName: BUSINESS.name,
  keywords: [
    'laptop repair',
    'computer repair',
    'Dwarka Mor',
    'New Delhi',
    'refurbished laptops',
    'Dell repair',
    'HP repair',
    'Lenovo repair',
    'motherboard repair',
    'screen replacement',
  ],
  // og:image and twitter:image come from src/app/opengraph-image.tsx, which
  // Next wires up automatically with a cache-busting hash.
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    // siteUrl() so preview deployments do not advertise the production domain.
    url: siteUrl(),
    siteName: BUSINESS.name,
    title: 'Exeller Computer — Laptop & Computer Repair Services',
    description:
      'Expert laptop and computer repair near Dwarka Mor Metro. Component-level repair, refurbished business laptops, spare parts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exeller Computer — Laptop & Computer Repair',
    description:
      'Clear diagnosis, approval before any work starts, and repair updates on WhatsApp. Dwarka Mor, New Delhi.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
