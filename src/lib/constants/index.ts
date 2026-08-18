/**
 * Business constants for Exceller Computer / Exceller Infosolutions LLP
 */

export const BUSINESS = {
  name: 'Exeller Computer',
  legalName: 'Exeller Infosolutions LLP',
  address: {
    street: 'Opp. Dwarka Mor Metro Station Gate No. 2',
    area: 'Sewak Park',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110059',
    country: 'India',
  },
  phone: '+919999999999', // TODO: Replace with actual phone number
  email: 'info@exellercomputer.in',
  website: 'https://exellercomputer.in',
  hours: {
    weekday: '10:00 AM – 8:00 PM',
    weekend: 'Closed (Sunday)',
  },
  gst: '', // TODO: Add GST number when available
} as const

/**
 * Repair estimator price ranges (in INR)
 * These are estimates — final price determined after diagnosis.
 */
export const REPAIR_PRICE_ESTIMATES: Record<string, Record<string, { min: number; max: number; warranty: string }>> = {
  'Screen Replacement': {
    Dell: { min: 3500, max: 8000, warranty: '3 months' },
    HP: { min: 3500, max: 8500, warranty: '3 months' },
    Lenovo: { min: 3000, max: 7500, warranty: '3 months' },
    Acer: { min: 3000, max: 6500, warranty: '3 months' },
    Asus: { min: 3500, max: 8000, warranty: '3 months' },
    Apple: { min: 12000, max: 25000, warranty: '3 months' },
  },
  'Battery Replacement': {
    Dell: { min: 2500, max: 5000, warranty: '6 months' },
    HP: { min: 2500, max: 5000, warranty: '6 months' },
    Lenovo: { min: 2500, max: 5500, warranty: '6 months' },
    Acer: { min: 2000, max: 4500, warranty: '6 months' },
    Asus: { min: 2500, max: 5000, warranty: '6 months' },
    Apple: { min: 6000, max: 12000, warranty: '6 months' },
  },
  'Hinge Repair': {
    Dell: { min: 1500, max: 3500, warranty: '3 months' },
    HP: { min: 1500, max: 3500, warranty: '3 months' },
    Lenovo: { min: 1500, max: 3000, warranty: '3 months' },
    Acer: { min: 1200, max: 3000, warranty: '3 months' },
    Asus: { min: 1500, max: 3500, warranty: '3 months' },
    Apple: { min: 4000, max: 8000, warranty: '3 months' },
  },
  'RAM Upgrade': {
    Dell: { min: 1500, max: 4000, warranty: 'Lifetime (component)' },
    HP: { min: 1500, max: 4000, warranty: 'Lifetime (component)' },
    Lenovo: { min: 1500, max: 4000, warranty: 'Lifetime (component)' },
    Acer: { min: 1500, max: 4000, warranty: 'Lifetime (component)' },
    Asus: { min: 1500, max: 4000, warranty: 'Lifetime (component)' },
    Apple: { min: 3000, max: 8000, warranty: 'Lifetime (component)' },
  },
  'Storage Upgrade': {
    Dell: { min: 2500, max: 8000, warranty: '1 year' },
    HP: { min: 2500, max: 8000, warranty: '1 year' },
    Lenovo: { min: 2500, max: 8000, warranty: '1 year' },
    Acer: { min: 2500, max: 7500, warranty: '1 year' },
    Asus: { min: 2500, max: 8000, warranty: '1 year' },
    Apple: { min: 5000, max: 15000, warranty: '1 year' },
  },
  'Boot/Performance Issues': {
    Dell: { min: 800, max: 2500, warranty: '1 month' },
    HP: { min: 800, max: 2500, warranty: '1 month' },
    Lenovo: { min: 800, max: 2500, warranty: '1 month' },
    Acer: { min: 800, max: 2500, warranty: '1 month' },
    Asus: { min: 800, max: 2500, warranty: '1 month' },
    Apple: { min: 1500, max: 4000, warranty: '1 month' },
  },
  'Motherboard Repair': {
    Dell: { min: 3000, max: 12000, warranty: '3 months' },
    HP: { min: 3000, max: 12000, warranty: '3 months' },
    Lenovo: { min: 3000, max: 11000, warranty: '3 months' },
    Acer: { min: 2500, max: 10000, warranty: '3 months' },
    Asus: { min: 3000, max: 12000, warranty: '3 months' },
    Apple: { min: 8000, max: 25000, warranty: '3 months' },
  },
  'Keyboard Replacement': {
    Dell: { min: 1200, max: 3000, warranty: '3 months' },
    HP: { min: 1200, max: 3500, warranty: '3 months' },
    Lenovo: { min: 1000, max: 3000, warranty: '3 months' },
    Acer: { min: 1000, max: 2500, warranty: '3 months' },
    Asus: { min: 1200, max: 3000, warranty: '3 months' },
    Apple: { min: 5000, max: 12000, warranty: '3 months' },
  },
  'Charging Port Repair': {
    Dell: { min: 1500, max: 3500, warranty: '3 months' },
    HP: { min: 1500, max: 3500, warranty: '3 months' },
    Lenovo: { min: 1500, max: 3000, warranty: '3 months' },
    Acer: { min: 1200, max: 3000, warranty: '3 months' },
    Asus: { min: 1500, max: 3500, warranty: '3 months' },
    Apple: { min: 3000, max: 7000, warranty: '3 months' },
  },
}

/**
 * Pagination defaults
 */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const
