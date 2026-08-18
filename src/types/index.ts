// Re-export database types for convenience
export type {
  Database,
  UserRole,
  JobStatus,
  InventoryCategory,
  BotState,
  TaxType,
  PaymentStatus,
  Json,
} from './database'

// Application-level types

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Job status transition map
export const VALID_JOB_TRANSITIONS: Record<string, string[]> = {
  received: ['diagnosed', 'cancelled'],
  diagnosed: ['quoted', 'cancelled'],
  quoted: ['approved', 'cancelled'],
  approved: ['in_repair', 'cancelled'],
  in_repair: ['ready', 'cancelled'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

// Tax configuration
export interface TaxConfig {
  cgstRate: number
  sgstRate: number
  igstRate: number
}

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  cgstRate: 9, // 9% CGST for intra-state
  sgstRate: 9, // 9% SGST for intra-state
  igstRate: 18, // 18% IGST for inter-state
}

// Business constants
export const SUPPORTED_BRANDS = [
  'Dell',
  'HP',
  'Lenovo',
  'Acer',
  'Asus',
  'Apple',
] as const

export const REPAIR_ISSUES = [
  'Screen Replacement',
  'Battery Replacement',
  'Hinge Repair',
  'RAM Upgrade',
  'Storage Upgrade',
  'Boot/Performance Issues',
  'Motherboard Repair',
  'Keyboard Replacement',
  'Charging Port Repair',
  'Water Damage',
  'Virus Removal',
  'OS Installation',
] as const

export type SupportedBrand = typeof SUPPORTED_BRANDS[number]
export type RepairIssue = typeof REPAIR_ISSUES[number]
