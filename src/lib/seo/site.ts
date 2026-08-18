import { BUSINESS } from '@/lib/constants'

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? BUSINESS.website

export const LOCAL_SERVICE_PAGES = [
  {
    slug: 'laptop-screen-replacement-dwarka-mor',
    title: 'Laptop Screen Replacement in Dwarka Mor',
    h1: 'Laptop screen replacement near Dwarka Mor Metro',
    summary:
      'Same-area LCD and LED panel replacement for Dell, HP, Lenovo, Acer, Asus and Apple notebooks. We diagnose flex-cable damage versus panel failure before quoting.',
    area: 'Dwarka Mor, Sewak Park, New Delhi 110059',
  },
  {
    slug: 'dell-battery-repair-delhi-ncr',
    title: 'Dell Battery Repair Delhi NCR',
    h1: 'Dell laptop battery replacement in Delhi NCR',
    summary:
      'Capacity testing and battery replacement for Dell Latitude, Inspiron and XPS machines. We do not quote a final price until the pack and charging circuit are checked.',
    area: 'Delhi NCR — drop-off opposite Dwarka Mor Metro Gate No. 2',
  },
  {
    slug: 'refurbished-business-laptops-dwarka-metro',
    title: 'Refurbished Business Laptops Near Dwarka Metro',
    h1: 'Certified refurbished business laptops near Dwarka Metro',
    summary:
      'Latitude, EliteBook and ThinkPad units tested on-site. Stock on the website is live inventory — sold machines are removed from the catalog.',
    area: 'Opposite Dwarka Mor Metro Station Gate No. 2',
  },
] as const

export function localBusinessJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ComputerStore', 'RepairShop'],
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    description:
      'Hardware repair, component-level laptop repair, display replacement, motherboard chip-level repair, battery and hinge repair, RAM/storage upgrades, and certified refurbished business laptops.',
    url: SITE_URL,
    telephone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? BUSINESS.phone,
    email: BUSINESS.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${BUSINESS.address.street}, ${BUSINESS.address.area}`,
      addressLocality: BUSINESS.address.city,
      addressRegion: BUSINESS.address.state,
      postalCode: BUSINESS.address.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 28.6193,
      longitude: 77.033,
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
    areaServed: ['Dwarka Mor', 'Dwarka', 'Uttam Nagar', 'Najafgarh', 'Delhi NCR'],
  }
}
