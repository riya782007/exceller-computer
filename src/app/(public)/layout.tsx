import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-brand-700">Exceller Computer</span>
          </a>
          <nav className="hidden items-center space-x-6 md:flex">
            <a href="/services" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Services
            </a>
            <a href="/estimator" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Price Estimator
            </a>
            <a href="/catalog" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Refurbished Laptops
            </a>
            <a href="/contact" className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors">
              Contact
            </a>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-whatsapp px-4 py-2 text-sm font-medium text-white hover:bg-whatsapp-dark transition-colors"
            >
              WhatsApp Us
            </a>
          </nav>
          {/* Mobile menu button placeholder */}
          <button className="md:hidden p-2" aria-label="Toggle menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exceller Computer</h3>
              <p className="mt-2 text-sm text-gray-600">
                Exceller Infosolutions LLP — Expert laptop & computer repair services in New Delhi.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Services</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li><a href="/services/laptop-repair" className="hover:text-brand-600">Laptop Repair</a></li>
                <li><a href="/services/screen-replacement" className="hover:text-brand-600">Screen Replacement</a></li>
                <li><a href="/services/motherboard-repair" className="hover:text-brand-600">Motherboard Repair</a></li>
                <li><a href="/services/data-recovery" className="hover:text-brand-600">Data Recovery</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Quick Links</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                <li><a href="/estimator" className="hover:text-brand-600">Get Repair Estimate</a></li>
                <li><a href="/catalog" className="hover:text-brand-600">Refurbished Laptops</a></li>
                <li><a href="/about" className="hover:text-brand-600">About Us</a></li>
                <li><a href="/contact" className="hover:text-brand-600">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
              <address className="mt-2 space-y-2 text-sm text-gray-600 not-italic">
                <p>Opp. Dwarka Mor Metro Station Gate No. 2</p>
                <p>Sewak Park, New Delhi – 110059</p>
                <p className="mt-3">
                  <a href="tel:+919999999999" className="hover:text-brand-600">+91 99999 99999</a>
                </p>
                <p>
                  <a href="mailto:info@excellercomputer.in" className="hover:text-brand-600">info@excellercomputer.in</a>
                </p>
              </address>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Exceller Infosolutions LLP. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp shadow-lg hover:bg-whatsapp-dark transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
