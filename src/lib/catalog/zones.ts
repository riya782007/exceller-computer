/**
 * Service zones across Delhi NCR.
 *
 * Mirrors the `service_zones` seed in supabase/SETUP_PART_B.sql — same slugs,
 * cities and pincodes.
 *
 * These drive the hyper-local landing pages. Each page must carry genuinely
 * zone-specific content — landmarks, travel time, real pincodes — because
 * near-duplicate pages that differ only by a swapped place name are treated as
 * doorway pages and can suppress the whole domain in search results.
 */

export interface ServiceZone {
  slug: string
  name: string
  city: string
  state: string
  pincodes: string[]
  /** Doorstep service availability in this zone */
  doorstepAvailable: boolean
  /** Travel fee in INR; 0 where free */
  travelFee: number
  /** Typical travel time from the Dwarka Mor workshop */
  travelTime: string
  /** Recognisable local landmarks, used in copy to make pages genuinely local */
  landmarks: string[]
  /** Nearest metro access, which is how most customers reach us */
  metro: string
  /** One-paragraph, zone-specific introduction */
  intro: string
  sortOrder: number
}

export const SERVICE_ZONES: ServiceZone[] = [
  {
    slug: 'dwarka-mor',
    name: 'Dwarka Mor',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110059', '110045'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: 'Walk-in — we are here',
    landmarks: ['Dwarka Mor Metro Station', 'Sewak Park', 'Nawada', 'Bindapur'],
    metro: 'Dwarka Mor (Blue Line) — Gate No. 2, directly opposite',
    intro:
      'Our workshop is in Dwarka Mor, directly opposite Gate No. 2 of the metro station in Sewak Park. If you are local you can walk in without an appointment and, for most common faults, wait while the repair is done rather than leaving the machine overnight.',
    sortOrder: 1,
  },
  {
    slug: 'dwarka',
    name: 'Dwarka',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110075', '110077', '110078'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '15–25 minutes',
    landmarks: [
      'Dwarka Sector 12 Market',
      'Vegas Mall Sector 14',
      'Dwarka Sector 21 Metro',
      'Ramphal Chowk',
    ],
    metro: 'Blue Line — Dwarka Sector 9, 10, 11, 12, 13 and 14 all connect to Dwarka Mor',
    intro:
      'We cover the full Dwarka sub-city across Sectors 1 to 23. Doorstep collection is free from Dwarka, and residents of the nearer sectors often find it quicker to come to the Dwarka Mor workshop directly on the Blue Line, which is a few stops away.',
    sortOrder: 2,
  },
  {
    slug: 'uttam-nagar',
    name: 'Uttam Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110059'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '10–15 minutes',
    landmarks: [
      'Uttam Nagar East Metro',
      'Uttam Nagar West Metro',
      'Mohan Garden',
      'Vipin Garden',
    ],
    metro: 'Uttam Nagar East / West (Blue Line) — two stops from Dwarka Mor',
    intro:
      'Uttam Nagar is our immediate neighbouring area and one we serve daily. Doorstep pickup is free and usually same-day. Being two metro stops from the workshop, most customers here choose to drop the machine in and collect it the same evening.',
    sortOrder: 3,
  },
  {
    slug: 'janakpuri',
    name: 'Janakpuri',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110058'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '20–30 minutes',
    landmarks: [
      'Janakpuri West Metro',
      'District Centre Janakpuri',
      'Tihar Village',
      'Janak Puri C Block Market',
    ],
    metro: 'Janakpuri West (Blue and Magenta Lines) — direct on the Blue Line',
    intro:
      'We serve all Janakpuri blocks including the District Centre commercial area, where we handle a significant amount of office and small-business work. Free doorstep collection, and AMC contracts are available for the many offices around the District Centre.',
    sortOrder: 4,
  },
  {
    slug: 'najafgarh',
    name: 'Najafgarh',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110043'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '30–40 minutes',
    landmarks: [
      'Najafgarh Main Market',
      'Dhansa Bus Stand Metro',
      'Najafgarh Roshanpura',
      'Chhawla',
    ],
    metro: 'Dhansa Bus Stand / Najafgarh (Grey Line), connecting via Dwarka',
    intro:
      'Najafgarh and the surrounding villages are covered by our doorstep service. Given the distance we recommend booking a collection slot on WhatsApp rather than travelling in, and we will confirm a time window so you are not waiting.',
    sortOrder: 5,
  },
  {
    slug: 'malviya-nagar',
    name: 'Malviya Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincodes: ['110017'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '45–60 minutes',
    landmarks: [
      'Malviya Nagar Metro',
      'Shivalik',
      'Saket District Centre',
      'Hauz Rani',
    ],
    metro: 'Malviya Nagar (Yellow Line)',
    intro:
      'We serve Malviya Nagar, Saket and the surrounding South Delhi localities through doorstep collection and delivery. As this is across the city from the workshop, we schedule a confirmed pickup window and keep you updated on WhatsApp throughout the repair.',
    sortOrder: 6,
  },
  {
    slug: 'gurgaon',
    name: 'Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    pincodes: ['122001', '122002', '122018'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '45–75 minutes',
    landmarks: [
      'Cyber City',
      'MG Road',
      'Sector 14 Market',
      'Udyog Vihar',
      'Golf Course Road',
    ],
    metro: 'Yellow Line to HUDA City Centre; Rapid Metro for Cyber City',
    intro:
      'We cover Gurgaon including Cyber City, Udyog Vihar and the residential sectors. Corporate AMC contracts are a significant part of what we do here, given the concentration of offices — we can survey your setup and quote against machine count and response time.',
    sortOrder: 7,
  },
  {
    slug: 'noida',
    name: 'Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincodes: ['201301', '201304'],
    doorstepAvailable: true,
    travelFee: 0,
    travelTime: '60–90 minutes',
    landmarks: [
      'Sector 18 Market',
      'Sector 62 IT hub',
      'Noida City Centre',
      'Film City',
    ],
    metro: 'Blue Line direct to Noida City Centre and Sector 62',
    intro:
      'Noida is covered by doorstep collection and delivery, with the IT corridor around Sector 62 and Sector 63 a particular focus for business contracts. Because of the distance we always confirm a pickup window in advance and coordinate over WhatsApp.',
    sortOrder: 8,
  },
]

export function getZoneBySlug(slug: string): ServiceZone | undefined {
  return SERVICE_ZONES.find((zone) => zone.slug === slug)
}

export function getZonesByCity(city: string): ServiceZone[] {
  return SERVICE_ZONES.filter((zone) => zone.city === city)
}

/** All zones, ordered for navigation and sitemap output. */
export function getOrderedZones(): ServiceZone[] {
  return [...SERVICE_ZONES].sort((a, b) => a.sortOrder - b.sortOrder)
}
