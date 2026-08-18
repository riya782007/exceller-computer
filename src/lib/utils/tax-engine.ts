import { DEFAULT_TAX_CONFIG, type TaxConfig, type TaxType } from '@/types'

export interface TaxCalculation {
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  taxType: TaxType
}

/**
 * Centralized GST Tax Engine
 * 
 * Single source of truth for all tax calculations.
 * DO NOT duplicate this logic elsewhere.
 * 
 * Delhi intra-state: 9% CGST + 9% SGST = 18% total
 * Inter-state: 18% IGST
 */
export function calculateTax(
  subtotal: number,
  taxType: TaxType,
  config: TaxConfig = DEFAULT_TAX_CONFIG
): TaxCalculation {
  if (subtotal < 0) {
    throw new Error('Subtotal cannot be negative')
  }

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (taxType === 'intra_state') {
    // Delhi intra-state: CGST + SGST
    cgst = roundToTwo((subtotal * config.cgstRate) / 100)
    sgst = roundToTwo((subtotal * config.sgstRate) / 100)
  } else {
    // Inter-state: IGST
    igst = roundToTwo((subtotal * config.igstRate) / 100)
  }

  const total = roundToTwo(subtotal + cgst + sgst + igst)

  return {
    subtotal: roundToTwo(subtotal),
    cgst,
    sgst,
    igst,
    total,
    taxType,
  }
}

/**
 * Calculate line item amount
 */
export function calculateLineAmount(quantity: number, unitPrice: number): number {
  return roundToTwo(quantity * unitPrice)
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(
  items: Array<{ quantity: number; unit_price: number }>
): number {
  return roundToTwo(
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  )
}

/**
 * Round to two decimal places (standard for currency)
 */
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}
