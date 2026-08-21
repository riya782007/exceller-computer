import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Exeller Computer — Laptop & Computer Repair | Dwarka Mor, Delhi',
    template: '%s | Exeller Computer',
  },
  description:
    'Expert laptop and computer repair services near Dwarka Mor Metro Station, New Delhi. Component-level repair, refurbished laptops, spare parts & accessories. Same-day service available.',
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
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://exellercomputer.com',
    siteName: 'Exeller Computer',
    title: 'Exeller Computer — Laptop & Computer Repair Services',
    description:
      'Expert laptop and computer repair near Dwarka Mor Metro. Component-level repair, refurbished business laptops, spare parts.',
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
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
