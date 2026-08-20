import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Exceller Computer — Laptop & Computer Repair | Dwarka Mor, Delhi',
  description:
    'Expert laptop and computer repair services near Dwarka Mor Metro Station, New Delhi. Component-level motherboard repair, screen replacement, refurbished business laptops. Same-day service.',
}

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 to-blue-100 py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Expert Laptop &amp; Computer
            <span className="block text-brand-600">Repair Services</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Component-level repair by certified technicians. Serving Delhi NCR from our location
            opposite Dwarka Mor Metro Station Gate No. 2.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/estimator"
              className="inline-flex items-center rounded-lg bg-brand-600 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Get Repair Estimate
            </Link>
            <a
              href="https://wa.me/919999999999?text=Hi%2C%20I%20need%20help%20with%20my%20laptop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-whatsapp px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-whatsapp-dark transition-colors"
            >
              Book on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            From simple fixes to complex motherboard-level repairs — we handle it all.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <span className="text-2xl">{service.icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-gray-900">Why Choose Exceller?</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Visit Our Store</h2>
              <div className="mt-6 space-y-4 text-gray-600">
                <p className="flex items-start gap-3">
                  <span className="text-xl">📍</span>
                  <span>
                    Opp. Dwarka Mor Metro Station Gate No. 2,<br />
                    Sewak Park, New Delhi – 110059
                  </span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-xl">🕐</span>
                  <span>Mon – Sat: 10:00 AM – 8:00 PM<br />Sunday: Closed</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-xl">📞</span>
                  <span>
                    <a href="tel:+919999999999" className="hover:text-brand-600">+91 99999 99999</a>
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-gray-100 p-8">
              <p className="text-center text-gray-500">
                [Google Maps embed will be added here]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['LocalBusiness', 'ComputerStore'],
            name: 'Exceller Computer',
            alternateName: 'Exceller Infosolutions LLP',
            description:
              'Expert laptop and computer repair services. Component-level repair, refurbished business laptops, spare parts and accessories.',
            url: 'https://excellercomputer.in',
            telephone: '+919999999999',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Opp. Dwarka Mor Metro Station Gate No. 2, Sewak Park',
              addressLocality: 'New Delhi',
              addressRegion: 'Delhi',
              postalCode: '110059',
              addressCountry: 'IN',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: '28.6139',
              longitude: '77.0329',
            },
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                opens: '10:00',
                closes: '20:00',
              },
            ],
            priceRange: '₹₹',
            image: 'https://excellercomputer.in/og-image.jpg',
            sameAs: [],
          }),
        }}
      />
    </div>
  )
}

const services = [
  {
    icon: '🖥️',
    title: 'Laptop Repair',
    description:
      'Expert diagnosis and repair for all laptop brands. Component-level motherboard repair, chip-level fixes.',
  },
  {
    icon: '🖱️',
    title: 'Screen Replacement',
    description:
      'LCD/LED screen replacement for all sizes and brands. Genuine and compatible panels available.',
  },
  {
    icon: '⚡',
    title: 'Motherboard Repair',
    description:
      'Advanced chip-level motherboard repair. BGA rework, power IC replacement, short circuit repair.',
  },
  {
    icon: '💾',
    title: 'Storage & RAM Upgrade',
    description:
      'SSD upgrades, HDD replacement, RAM upgrades. Speed up your laptop with modern components.',
  },
  {
    icon: '🔋',
    title: 'Battery & Charging',
    description:
      'Battery replacement, charging port repair, adapter issues. Original and compatible batteries.',
  },
  {
    icon: '💻',
    title: 'Refurbished Laptops',
    description:
      'Quality-tested refurbished business laptops from Dell, HP, Lenovo. Warranty included.',
  },
]

const features = [
  {
    icon: '🔧',
    title: 'Expert Technicians',
    description: 'Certified technicians with years of component-level repair experience.',
  },
  {
    icon: '⚡',
    title: 'Quick Turnaround',
    description: 'Most repairs completed same-day. Complex repairs within 24-48 hours.',
  },
  {
    icon: '✅',
    title: 'Warranty on Repairs',
    description: 'All repairs backed by service warranty. Peace of mind guaranteed.',
  },
  {
    icon: '📍',
    title: 'Convenient Location',
    description: 'Right opposite Dwarka Mor Metro Station. Easy access by metro.',
  },
]
