/**
 * Canonical service catalog.
 *
 * This mirrors the `service_catalog` / `service_categories` seed in
 * supabase/SETUP_PART_B.sql exactly — same keys, slugs, price bands, HSN/SAC
 * codes and warranty terms.
 *
 * Why constants rather than a database read, for now:
 *   - src/types/database.ts is hand-written and does not yet contain
 *     service_catalog, so a typed query against it would not compile
 *   - the tables may not exist until Part B has been run
 *   - fully static pages are the fastest path to the <1.8s LCP target and
 *     cannot fail at request time
 *
 * Phase 1b: once Part B is applied and `npm run gen:types` has been run, these
 * become the fallback and the database becomes authoritative, so prices are
 * editable from the admin console. Keep the two in sync until then — the SQL
 * seed and this file are the same data.
 */

export type ServiceCategoryKey =
  | 'display'
  | 'power'
  | 'input'
  | 'mainboard'
  | 'upgrade'
  | 'software'
  | 'enterprise'

export type DeviceType = 'laptop' | 'desktop' | 'aio' | 'custom_pc'

export interface ServiceFaq {
  question: string
  answer: string
}

export interface ServiceItem {
  key: string
  slug: string
  name: string
  category: ServiceCategoryKey
  /** One-line summary used on cards and meta descriptions */
  shortDescription: string
  /** Full body copy for the service landing page */
  longDescription: string
  priceMin: number
  priceMax: number
  turnaroundHours: number
  warrantyMonths: number
  hsnSac: string
  deviceTypes: DeviceType[]
  brands: string[] | null
  featured: boolean
  /** Customer-recognisable symptoms — drives estimator matching and SEO copy */
  symptoms: string[]
  /** What the quoted price covers */
  included: string[]
  faqs: ServiceFaq[]
  /** Genuine-vs-compatible guidance, where the choice is meaningful */
  partsNote?: string
}

export interface ServiceCategory {
  key: ServiceCategoryKey
  name: string
  description: string
  icon: string
  sortOrder: number
}

export const SUPPORTED_BRANDS = [
  'Dell',
  'HP',
  'Lenovo',
  'Acer',
  'Asus',
  'Apple',
  'MSI',
] as const

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  laptop: 'Laptop',
  desktop: 'Desktop',
  aio: 'All-in-One',
  custom_pc: 'Custom PC',
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'display',
    name: 'Display & Screen',
    description: 'LCD and LED panel repair and replacement.',
    icon: '🖥️',
    sortOrder: 1,
  },
  {
    key: 'power',
    name: 'Power & Battery',
    description: 'Battery, charging port and adapter faults.',
    icon: '🔋',
    sortOrder: 2,
  },
  {
    key: 'input',
    name: 'Keyboard & Body',
    description: 'Keyboard, trackpad and hinge repair.',
    icon: '⌨️',
    sortOrder: 3,
  },
  {
    key: 'mainboard',
    name: 'Motherboard & Chip',
    description: 'Chip-level and board-level repair.',
    icon: '⚡',
    sortOrder: 4,
  },
  {
    key: 'upgrade',
    name: 'Performance Upgrades',
    description: 'SSD and RAM upgrades that make an older machine usable again.',
    icon: '🚀',
    sortOrder: 5,
  },
  {
    key: 'software',
    name: 'Software & Data',
    description: 'Operating system, virus removal and data recovery.',
    icon: '🛡️',
    sortOrder: 6,
  },
  {
    key: 'enterprise',
    name: 'Business & AMC',
    description: 'Corporate IT contracts, networking and custom builds.',
    icon: '🏢',
    sortOrder: 7,
  },
]

export const SERVICES: ServiceItem[] = [
  {
    key: 'screen_replacement',
    slug: 'laptop-screen-replacement',
    name: 'Laptop Screen Replacement',
    category: 'display',
    shortDescription:
      'FHD, HD and high-refresh panel replacement using OEM or grade-A compatible displays.',
    longDescription:
      'A cracked, flickering or blank display is the most common laptop fault we see. We stock panels for all mainstream models and match the exact resolution, refresh rate and connector your machine was built with — fitting a lower-specification panel is a common shortcut elsewhere and it permanently degrades the machine. Replacement is usually completed the same day.',
    priceMin: 2500,
    priceMax: 8000,
    turnaroundHours: 24,
    warrantyMonths: 12,
    hsnSac: '85285900',
    deviceTypes: ['laptop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple', 'MSI'],
    featured: true,
    symptoms: [
      'Cracked or shattered screen',
      'Black screen but the laptop powers on',
      'Flickering or dim display',
      'Vertical or horizontal lines',
      'White or coloured patches',
      'Backlight not turning on',
    ],
    included: [
      'Full diagnostic to confirm the panel, and not the cable or GPU, is at fault',
      'Replacement panel matched to original resolution and refresh rate',
      'Bezel removal and refitting without cosmetic damage',
      'Dead-pixel and uniformity test before handover',
      'Up to 12 months warranty on the panel',
    ],
    partsNote:
      'Both OEM and grade-A compatible panels are offered. Compatible panels are typically 30-40% cheaper and, for standard FHD displays, visually identical. For colour-critical or high-refresh gaming panels we recommend OEM.',
    faqs: [
      {
        question: 'How long does a screen replacement take?',
        answer:
          'Most replacements are finished within 2 to 4 hours if the panel is in stock. Less common models may need a day while the part is sourced.',
      },
      {
        question: 'My screen is black but I can hear the laptop running. Is it the screen?',
        answer:
          'Not necessarily. A black screen can be the panel, the display cable, the backlight circuit or the graphics chip. We connect an external monitor as the first diagnostic step, which separates a display fault from a mainboard fault, so you are not paying for the wrong repair.',
      },
      {
        question: 'Will my data be affected?',
        answer:
          'No. A screen replacement does not touch the storage drive. Your files, applications and settings remain exactly as they were.',
      },
    ],
  },
  {
    key: 'battery_replacement',
    slug: 'laptop-battery-replacement',
    name: 'Laptop Battery Replacement',
    category: 'power',
    shortDescription:
      'Internal and external lithium-ion battery replacement, OEM and high-grade compatible.',
    longDescription:
      'Lithium-ion cells lose usable capacity after roughly 400 to 600 charge cycles, which for most users is two to three years. If your laptop shuts down without warning, will not hold charge away from the wall, or reports a swollen battery, replacement is the fix. A swollen battery should be treated as urgent — it can deform the chassis and crack the trackpad or screen.',
    priceMin: 1200,
    priceMax: 5000,
    turnaroundHours: 6,
    warrantyMonths: 6,
    hsnSac: '85076000',
    deviceTypes: ['laptop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple'],
    featured: true,
    symptoms: [
      'Battery drains within minutes',
      'Laptop shuts down when unplugged',
      'Plugged in, not charging',
      'Swollen or bulging battery',
      'Trackpad or keyboard lifting from the chassis',
      'Battery reported as needing service by the operating system',
    ],
    included: [
      'Battery health report showing current versus rated capacity',
      'Genuine or high-grade compatible cell pack',
      'Safe removal and disposal of the old pack',
      'Charge-cycle calibration after fitting',
      '6 months warranty on the new battery',
    ],
    partsNote:
      'We do not fit unbranded cells. Compatible packs we supply are from established manufacturers with protection circuitry, because a cheap pack without it is a genuine fire risk.',
    faqs: [
      {
        question: 'My battery is swollen. Can I keep using the laptop?',
        answer:
          'Please stop using it and bring it in. A swollen pack is expanding because of internal gas build-up. Continued use risks further deformation of the chassis, a cracked trackpad or screen, and in rare cases thermal runaway.',
      },
      {
        question: 'How much battery life should I expect after replacement?',
        answer:
          'A new pack restores close to the original rated backup for your model, typically 4 to 7 hours for a business laptop with mixed use. We show you the health report before and after so the improvement is measurable.',
      },
    ],
  },
  {
    key: 'charging_port',
    slug: 'laptop-charging-port-repair',
    name: 'Charging Port Repair',
    category: 'power',
    shortDescription: 'DC jack replacement and power delivery rail repair.',
    longDescription:
      'A charging port that only works when the cable is held at an angle is a mechanical failure of the DC jack or a cracked solder joint on the board. Left alone it worsens and can short the power rail, turning an inexpensive repair into a mainboard job. We replace the jack and, where the joint has failed, re-solder the board pads properly rather than gluing the connector back into place.',
    priceMin: 1200,
    priceMax: 3500,
    turnaroundHours: 24,
    warrantyMonths: 3,
    hsnSac: '85369090',
    deviceTypes: ['laptop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple'],
    featured: false,
    symptoms: [
      'Charger only works at a certain angle',
      'Port feels loose or wobbly',
      'Charging light flickers',
      'Burning smell or discoloration near the port',
      'No charging at all with a known-good adapter',
    ],
    included: [
      'Adapter and rail testing to confirm the port, not the charger, is at fault',
      'DC jack replacement or board-level re-soldering',
      'Charging verification under load',
      '3 months warranty on the repair',
    ],
    faqs: [
      {
        question: 'Could it just be my charger?',
        answer:
          'Often it is, and that is a much cheaper outcome. We test with a known-good adapter and measure the voltage reaching the board before quoting any port work.',
      },
    ],
  },
  {
    key: 'keyboard_replacement',
    slug: 'laptop-keyboard-replacement',
    name: 'Laptop Keyboard Replacement',
    category: 'input',
    shortDescription:
      'Frame-mounted, backlit and standard membrane keyboard replacement.',
    longDescription:
      'Dead keys, repeating keys or liquid damage to the keyboard are usually resolved by replacing the assembly. On many modern chassis the keyboard is riveted to the top case, which is why some quotes are much higher than others — we tell you upfront which type yours is so the price makes sense.',
    priceMin: 800,
    priceMax: 3000,
    turnaroundHours: 6,
    warrantyMonths: 6,
    hsnSac: '84716060',
    deviceTypes: ['laptop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple'],
    featured: false,
    symptoms: [
      'Some keys not registering',
      'Keys repeating on their own',
      'Liquid spilled on the keyboard',
      'Backlight not working',
      'Keys physically missing or loose',
    ],
    included: [
      'Full key-matrix test to identify every affected key',
      'Replacement keyboard matched to your layout and backlight type',
      'Post-fit test of all keys and function combinations',
      '6 months warranty',
    ],
    faqs: [
      {
        question: 'I spilled water on it. What should I do right now?',
        answer:
          'Shut the laptop down immediately, do not try to power it on to check, unplug the charger and if the battery is removable take it out. Keep it upside down to drain and bring it in the same day. Powering on a wet board is what turns a keyboard replacement into a mainboard repair.',
      },
    ],
  },
  {
    key: 'hinge_repair',
    slug: 'laptop-hinge-repair',
    name: 'Hinge Repair & Reinforcement',
    category: 'input',
    shortDescription:
      'Structural chassis reinforcement, screw-post rebuilding and full hinge replacement.',
    longDescription:
      'Broken hinges are a structural repair, not a cosmetic one. When a hinge seizes it tears the plastic screw posts out of the lid, and continued opening and closing stretches the display cable and can crack the panel. We rebuild the mounting posts, replace the hinge mechanism and reinforce the surrounding chassis so the repair holds rather than failing again in a month.',
    priceMin: 800,
    priceMax: 5000,
    turnaroundHours: 48,
    warrantyMonths: 3,
    hsnSac: '84733099',
    deviceTypes: ['laptop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus'],
    featured: false,
    symptoms: [
      'Lid feels stiff or grinds when opening',
      'Screen does not stay at the set angle',
      'Bezel or body cracked near the hinge',
      'Gap opening between screen and body',
      'Screen flickers when the lid is moved',
    ],
    included: [
      'Hinge mechanism replacement',
      'Rebuilding of torn screw posts and mounting points',
      'Chassis reinforcement around the hinge area',
      'Display cable inspection for stretch damage',
      '3 months warranty on the structural repair',
    ],
    faqs: [
      {
        question: 'Why does hinge repair vary so much in price?',
        answer:
          'It depends on how much secondary damage has occurred. A seized hinge caught early is a straightforward swap. If the screw posts have torn out and the lid or palmrest has cracked, the housing has to be rebuilt or replaced, which is considerably more work.',
      },
    ],
  },
  {
    key: 'motherboard_repair',
    slug: 'laptop-motherboard-repair',
    name: 'Motherboard Chip-Level Repair',
    category: 'mainboard',
    shortDescription:
      'IC replacement, power rail repair, short-circuit tracing and liquid damage recovery.',
    longDescription:
      'Most service centres will only replace an entire motherboard, which is often more expensive than the laptop is worth. We repair at component level: tracing shorted rails, replacing power management ICs, reflowing or reballing BGA packages and recovering liquid-damaged boards. This is the difference between a repair costing a few thousand rupees and being told to buy a new machine.',
    priceMin: 1000,
    priceMax: 8000,
    turnaroundHours: 48,
    warrantyMonths: 3,
    hsnSac: '84733030',
    deviceTypes: ['laptop', 'desktop'],
    brands: ['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple'],
    featured: true,
    symptoms: [
      'No power at all, no lights, no fan',
      'Powers on then shuts down within seconds',
      'Fan spins but nothing appears on screen',
      'Liquid was spilled and the laptop no longer starts',
      'Burning smell after switching on',
      'USB ports and peripherals all dead together',
    ],
    included: [
      'Board-level diagnosis with schematic and boardview reference',
      'Short-circuit tracing and power rail measurement',
      'Component-level IC or MOSFET replacement',
      'Ultrasonic cleaning and corrosion treatment for liquid damage',
      'Extended stability testing before handover',
      '1 to 3 months warranty depending on the fault repaired',
    ],
    partsNote:
      'Chip-level work is diagnostic-led. We quote only after locating the actual fault, because an accurate quote is not possible from the symptom alone.',
    faqs: [
      {
        question: 'Is chip-level repair reliable, or should I just replace the board?',
        answer:
          'For most faults — power management ICs, shorted rails, charging circuitry — component repair is durable and we warranty it. Where a board has extensive corrosion or an unrecoverable CPU or GPU fault, we will tell you plainly that replacement is the better value and not take the job.',
      },
      {
        question: 'My laptop had liquid spilled on it a while ago. Is it too late?',
        answer:
          'It depends on how far corrosion has progressed. Liquid damage is a chemical process that keeps working after the spill dries, so earlier is always better. We open and assess before quoting, and if the board is beyond economic recovery we say so rather than charging for exploratory work.',
      },
      {
        question: 'How is the diagnostic charge handled?',
        answer:
          'The diagnostic fee is credited against the repair if you go ahead. If we cannot fix it, you only pay the diagnostic.',
      },
    ],
  },
  {
    key: 'ssd_upgrade',
    slug: 'ssd-upgrade',
    name: 'SSD Upgrade',
    category: 'upgrade',
    shortDescription:
      'SATA, NVMe and M.2 installation with operating system cloning and data migration.',
    longDescription:
      'If a machine takes minutes to boot and stalls on ordinary tasks, a mechanical hard drive is almost always the bottleneck rather than the processor. Moving to an SSD is the single largest performance improvement available for an older laptop, typically cutting boot time from over a minute to under fifteen seconds. We clone your existing installation, so Windows, your applications and your files transfer exactly as they are — nothing to reinstall.',
    priceMin: 1500,
    priceMax: 4500,
    turnaroundHours: 4,
    warrantyMonths: 12,
    hsnSac: '84717020',
    deviceTypes: ['laptop', 'desktop'],
    brands: null,
    featured: true,
    symptoms: [
      'Very slow startup and shutdown',
      'Programs take a long time to open',
      'Frequent freezing or unresponsiveness',
      'Clicking or grinding noise from the drive',
      'Running out of storage space',
    ],
    included: [
      'Assessment of which drive interface your machine supports',
      'SSD supplied and fitted, from 256GB to 1TB',
      'Full clone of the existing operating system and data',
      'Firmware and alignment check for correct SSD performance',
      'Manufacturer warranty on the drive, typically 1 to 3 years',
    ],
    faqs: [
      {
        question: 'Will I lose my files or have to reinstall Windows?',
        answer:
          'No. We clone the existing drive sector by sector, so your operating system, licences, applications and files arrive on the new drive unchanged. You will simply find everything much faster.',
      },
      {
        question: 'Can I keep my old hard drive as extra storage?',
        answer:
          'Usually yes. Many laptops have a second bay or can take the old drive in an external caddy, which we can supply. That way you keep the capacity and gain the speed.',
      },
    ],
  },
  {
    key: 'ram_upgrade',
    slug: 'ram-upgrade',
    name: 'RAM Upgrade',
    category: 'upgrade',
    shortDescription: 'DDR3, DDR4 and DDR5 memory expansion from 4GB to 32GB.',
    longDescription:
      'If your machine slows down specifically when several applications or many browser tabs are open, it is running out of memory and swapping to disk. Adding RAM fixes that directly. We check your maximum supported capacity, the number of free slots and the correct speed before quoting, because fitting a mismatched module can make a system slower or refuse to boot.',
    priceMin: 1000,
    priceMax: 5000,
    turnaroundHours: 2,
    warrantyMonths: 12,
    hsnSac: '84733020',
    deviceTypes: ['laptop', 'desktop'],
    brands: null,
    featured: false,
    symptoms: [
      'Slows down with several applications open',
      'Browser tabs reload when switched to',
      'High memory usage in Task Manager',
      'Stuttering during video calls',
      'Struggles with editing or design software',
    ],
    included: [
      'Compatibility check for maximum capacity, slots and supported speed',
      'Memory module supplied and fitted',
      'Extended memory test to rule out a faulty module',
      'Manufacturer warranty on the module',
    ],
    faqs: [
      {
        question: 'How much RAM do I actually need?',
        answer:
          '8GB is comfortable for browsing and office work. 16GB suits heavy multitasking, video calls with many tabs, and light creative work. 32GB is worth it for video editing, virtual machines or large datasets. We will recommend based on what you actually run rather than selling the largest module.',
      },
    ],
  },
  {
    key: 'os_cleanup',
    slug: 'os-install-virus-removal',
    name: 'OS Install & Virus Removal',
    category: 'software',
    shortDescription:
      'Malware removal, registry repair, operating system installation and system optimisation.',
    longDescription:
      'Pop-up advertising, a browser homepage you did not choose, or a machine that has become sluggish without a hardware fault are usually software problems. We remove malware, clear startup bloat and repair the installation. Where the system is too compromised to clean reliably we do a fresh install, and we always back your data up first.',
    priceMin: 300,
    priceMax: 700,
    turnaroundHours: 4,
    warrantyMonths: 0,
    hsnSac: '998313',
    deviceTypes: ['laptop', 'desktop'],
    brands: null,
    featured: false,
    symptoms: [
      'Pop-up advertisements and unwanted toolbars',
      'Browser homepage changed by itself',
      'Very slow performance with no hardware fault',
      'Programs launching at startup that you did not install',
      'Ransomware or locked files',
      'Operating system will not boot',
    ],
    included: [
      'Full malware and adware scan and removal',
      'Startup and background service cleanup',
      'Driver and update verification',
      'Data backup before any reinstall',
      'Service guarantee on the work performed',
    ],
    faqs: [
      {
        question: 'Will I lose my files if the operating system is reinstalled?',
        answer:
          'Not if we can read the drive. We back up your documents, pictures and desktop before reinstalling and restore them afterwards. Where the drive itself is failing we tell you first, because that changes the approach.',
      },
    ],
  },
  {
    key: 'data_recovery',
    slug: 'data-recovery',
    name: 'Data Recovery',
    category: 'software',
    shortDescription:
      'Recovery from failed drives, corrupted partitions and accidental deletion.',
    longDescription:
      'Data recovery is assessed case by case, because the price depends entirely on why the data became inaccessible. Accidental deletion or a corrupted partition on a healthy drive is straightforward. A drive with mechanical failure is a different category of work. We assess first and tell you the realistic likelihood of recovery before you commit to anything.',
    priceMin: 1500,
    priceMax: 12000,
    turnaroundHours: 72,
    warrantyMonths: 0,
    hsnSac: '998313',
    deviceTypes: ['laptop', 'desktop'],
    brands: null,
    featured: false,
    symptoms: [
      'Drive not detected by the computer',
      'Files deleted accidentally',
      'Drive asks to be formatted',
      'Clicking or beeping from the drive',
      'Partition missing or showing as raw',
      'Files corrupted after a power failure',
    ],
    included: [
      'Assessment with an honest recovery likelihood before any charge',
      'Read-only imaging so the original drive is never written to',
      'File-by-file recovery listing so you can see what was retrieved',
      'Recovered data supplied on new media',
    ],
    partsNote:
      'If a drive has a mechanical fault requiring a cleanroom, we will tell you and refer it rather than attempting work that would destroy the chance of recovery.',
    faqs: [
      {
        question: 'Should I keep trying to access the drive myself?',
        answer:
          'Please stop. Every additional power-on of a failing drive risks further damage, and recovery software run on a physically failing disk frequently makes the data permanently unrecoverable. Disconnect it and bring it in.',
      },
      {
        question: 'Can you guarantee my data will be recovered?',
        answer:
          'No, and anyone who guarantees it without seeing the drive is not being straight with you. What we can do is assess it and give you an honest probability before you spend anything.',
      },
    ],
  },
  {
    key: 'amc_contract',
    slug: 'corporate-it-amc',
    name: 'Corporate IT AMC',
    category: 'enterprise',
    shortDescription:
      'Annual maintenance contracts covering hardware upkeep, networking and preventive service.',
    longDescription:
      'Annual Maintenance Contracts for offices, institutions and computer labs across Delhi NCR. Rather than paying per incident, an AMC covers scheduled preventive maintenance, priority response and predictable costs. Suited to organisations running 10 or more machines where downtime has a direct cost.',
    priceMin: 15000,
    priceMax: 250000,
    turnaroundHours: 0,
    warrantyMonths: 12,
    hsnSac: '998313',
    deviceTypes: ['laptop', 'desktop'],
    brands: null,
    featured: true,
    symptoms: [
      'Multiple machines needing regular attention',
      'Unpredictable repair costs across a fleet',
      'No formal IT support arrangement',
      'Downtime affecting staff productivity',
      'Network and connectivity issues',
    ],
    included: [
      'Scheduled preventive maintenance visits',
      'Priority response for contract customers',
      'Hardware upkeep and diagnostics across the covered fleet',
      'Network configuration and troubleshooting',
      'Virus protection and system hygiene',
      'Asset register and service history reporting',
    ],
    faqs: [
      {
        question: 'What does an AMC cost?',
        answer:
          'It depends on the number and type of machines, the response time you need and whether parts are included. We survey your setup and quote against it. Contracts typically start around ₹15,000 annually for a small office.',
      },
      {
        question: 'Are replacement parts included?',
        answer:
          'That is your choice. Labour-only contracts cost less and parts are billed as used. Comprehensive contracts include parts and give you a single predictable annual figure. We will price both so you can compare.',
      },
    ],
  },
  {
    key: 'custom_pc',
    slug: 'custom-pc-build',
    name: 'Custom PC Build',
    category: 'enterprise',
    shortDescription:
      'Gaming and workstation builds assembled and stress-tested to specification.',
    longDescription:
      'Custom desktop builds for gaming, content creation and professional workstations. We specify to your actual workload and budget rather than to a parts list, assemble with proper cable management and thermal paste application, and stress-test the finished machine before handover so you are not discovering instability a week later.',
    priceMin: 25000,
    priceMax: 350000,
    turnaroundHours: 72,
    warrantyMonths: 12,
    hsnSac: '84713010',
    deviceTypes: ['custom_pc'],
    brands: null,
    featured: false,
    symptoms: [
      'Need a machine for gaming at a specific resolution',
      'Video editing or 3D rendering workload',
      'Existing desktop no longer adequate',
      'Want to upgrade rather than replace',
    ],
    included: [
      'Specification consultation against your actual workload and budget',
      'Component sourcing with genuine warranty',
      'Assembly with proper cable management and cooling',
      'BIOS configuration and operating system installation',
      'Stress testing and thermal validation before handover',
      'Warranty support on the completed build',
    ],
    faqs: [
      {
        question: 'Can you work to a fixed budget?',
        answer:
          'Yes, and that is the sensible way to approach it. Tell us the budget and what the machine is for, and we will propose the best allocation across processor, graphics, memory and storage for that use rather than overspending on one component.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getServiceBySlug(slug: string): ServiceItem | undefined {
  return SERVICES.find((service) => service.slug === slug)
}

export function getServiceByKey(key: string): ServiceItem | undefined {
  return SERVICES.find((service) => service.key === key)
}

export function getServicesByCategory(category: ServiceCategoryKey): ServiceItem[] {
  return SERVICES.filter((service) => service.category === category)
}

export function getFeaturedServices(): ServiceItem[] {
  return SERVICES.filter((service) => service.featured)
}

export function getCategory(key: ServiceCategoryKey): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((category) => category.key === key)
}

/** Services offered for a given device type — drives the estimator. */
export function getServicesForDevice(deviceType: DeviceType): ServiceItem[] {
  return SERVICES.filter((service) => service.deviceTypes.includes(deviceType))
}

/**
 * Services offered for a device type and brand.
 * A null `brands` list on a service means it is brand-agnostic.
 */
export function getServicesForDeviceAndBrand(
  deviceType: DeviceType,
  brand: string
): ServiceItem[] {
  return SERVICES.filter(
    (service) =>
      service.deviceTypes.includes(deviceType) &&
      (service.brands === null || service.brands.includes(brand))
  )
}

// Formatting helpers live in ./format so client components can import them
// without pulling this entire catalog into the browser bundle.
export {
  formatPriceBand,
  formatTurnaround,
  formatWarranty,
} from './format'
