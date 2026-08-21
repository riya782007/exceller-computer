import { describe, it, expect } from 'vitest'
import {
  calculateTax,
  calculateLineAmount,
  calculateSubtotal,
} from '@/lib/utils/tax-engine'

/**
 * Invoice Creation Unit Tests
 * 
 * Tests the core financial calculations that power invoice creation.
 * These functions are the single source of truth for all tax/amount logic.
 * The Server Action (createInvoice) consumes these directly.
 */

describe('Invoice Creation — Financial Calculations', () => {
  // ============================================
  // Subtotal from line items
  // ============================================
  describe('calculateSubtotal (line items → subtotal)', () => {
    it('calculates correctly for a typical repair invoice', () => {
      const items = [
        { quantity: 1, unit_price: 4500 },  // Screen replacement
        { quantity: 1, unit_price: 500 },   // Labour
        { quantity: 2, unit_price: 200 },   // Screws/misc
      ]
      expect(calculateSubtotal(items)).toBe(5400)
    })

    it('handles single high-value item', () => {
      const items = [{ quantity: 1, unit_price: 25000 }]
      expect(calculateSubtotal(items)).toBe(25000)
    })

    it('handles multiple quantities', () => {
      const items = [
        { quantity: 4, unit_price: 1800 }, // 4x RAM sticks
      ]
      expect(calculateSubtotal(items)).toBe(7200)
    })

    it('handles decimal unit prices', () => {
      const items = [
        { quantity: 3, unit_price: 333.33 },
      ]
      // 3 × 333.33 = 999.99
      expect(calculateSubtotal(items)).toBe(999.99)
    })

    it('returns 0 for empty items array', () => {
      expect(calculateSubtotal([])).toBe(0)
    })

    it('handles zero unit price items (free services)', () => {
      const items = [
        { quantity: 1, unit_price: 5000 },
        { quantity: 1, unit_price: 0 },  // Free diagnostic
      ]
      expect(calculateSubtotal(items)).toBe(5000)
    })
  })

  // ============================================
  // Line amount calculation
  // ============================================
  describe('calculateLineAmount (qty × price)', () => {
    it('calculates simple line amount', () => {
      expect(calculateLineAmount(1, 4500)).toBe(4500)
    })

    it('calculates with quantity > 1', () => {
      expect(calculateLineAmount(3, 1500)).toBe(4500)
    })

    it('handles fractional prices', () => {
      expect(calculateLineAmount(2, 1499.75)).toBe(2999.50)
    })

    it('returns 0 for zero quantity', () => {
      expect(calculateLineAmount(0, 5000)).toBe(0)
    })

    it('returns 0 for zero price', () => {
      expect(calculateLineAmount(5, 0)).toBe(0)
    })
  })

  // ============================================
  // Delhi Intra-State GST (CGST + SGST)
  // ============================================
  describe('calculateTax — Delhi intra-state (CGST 9% + SGST 9%)', () => {
    it('calculates standard repair invoice tax', () => {
      const result = calculateTax(5000, 'intra_state')

      expect(result.subtotal).toBe(5000)
      expect(result.cgst).toBe(450)      // 9% of 5000
      expect(result.sgst).toBe(450)      // 9% of 5000
      expect(result.igst).toBe(0)        // No IGST for intra-state
      expect(result.total).toBe(5900)    // 5000 + 450 + 450
      expect(result.taxType).toBe('intra_state')
    })

    it('handles a large motherboard repair invoice', () => {
      const result = calculateTax(15000, 'intra_state')

      expect(result.cgst).toBe(1350)
      expect(result.sgst).toBe(1350)
      expect(result.total).toBe(17700)
    })

    it('handles small repair amounts', () => {
      const result = calculateTax(500, 'intra_state')

      expect(result.cgst).toBe(45)
      expect(result.sgst).toBe(45)
      expect(result.total).toBe(590)
    })

    it('verifies CGST equals SGST (symmetry requirement)', () => {
      const amounts = [1000, 2500.50, 7777, 12345.67, 99999]
      
      for (const amount of amounts) {
        const result = calculateTax(amount, 'intra_state')
        expect(result.cgst).toBe(result.sgst)
      }
    })

    it('verifies total = subtotal + cgst + sgst for intra-state', () => {
      const amounts = [100, 1000, 5000, 12500.75, 50000]
      
      for (const amount of amounts) {
        const result = calculateTax(amount, 'intra_state')
        const expectedTotal = result.subtotal + result.cgst + result.sgst
        // Account for floating point: difference should be less than 1 paisa
        expect(Math.abs(result.total - expectedTotal)).toBeLessThan(0.01)
      }
    })

    it('handles decimal amounts with proper rounding', () => {
      // 9% of 1111.11 = 99.9999 → should round to 100.00
      const result = calculateTax(1111.11, 'intra_state')
      expect(result.cgst).toBe(100)
      expect(result.sgst).toBe(100)
      expect(result.total).toBe(1311.11)
    })

    it('handles amount that causes .5 rounding (banker rounding edge)', () => {
      // 9% of 1250 = 112.5 → rounds to 112.5
      const result = calculateTax(1250, 'intra_state')
      expect(result.cgst).toBe(112.5)
      expect(result.sgst).toBe(112.5)
      expect(result.total).toBe(1475)
    })
  })

  // ============================================
  // Inter-State GST (IGST)
  // ============================================
  describe('calculateTax — inter-state (IGST 18%)', () => {
    it('calculates IGST for out-of-state customer', () => {
      const result = calculateTax(5000, 'inter_state')

      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.igst).toBe(900)      // 18% of 5000
      expect(result.total).toBe(5900)    // Same total as intra-state (18% = 9+9)
      expect(result.taxType).toBe('inter_state')
    })

    it('total matches intra-state total (18% either way)', () => {
      const amount = 10000
      const intra = calculateTax(amount, 'intra_state')
      const inter = calculateTax(amount, 'inter_state')

      // Both should produce same total: amount + 18%
      expect(intra.total).toBe(inter.total)
      expect(intra.total).toBe(11800)
    })

    it('handles decimal amounts', () => {
      const result = calculateTax(3750.50, 'inter_state')

      // 18% of 3750.50 = 675.09
      expect(result.igst).toBe(675.09)
      expect(result.total).toBe(4425.59)
    })

    it('verifies no CGST/SGST for inter-state', () => {
      const result = calculateTax(99999, 'inter_state')
      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.igst).toBeGreaterThan(0)
    })

    it('verifies total = subtotal + igst for inter-state', () => {
      const amounts = [100, 2500, 8750.25, 45000]
      
      for (const amount of amounts) {
        const result = calculateTax(amount, 'inter_state')
        const expectedTotal = result.subtotal + result.igst
        expect(Math.abs(result.total - expectedTotal)).toBeLessThan(0.01)
      }
    })
  })

  // ============================================
  // Zero and edge case amounts
  // ============================================
  describe('calculateTax — zero and edge cases', () => {
    it('handles zero subtotal', () => {
      const result = calculateTax(0, 'intra_state')
      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles very small amounts (1 rupee)', () => {
      const result = calculateTax(1, 'intra_state')
      expect(result.cgst).toBe(0.09)
      expect(result.sgst).toBe(0.09)
      expect(result.total).toBe(1.18)
    })

    it('throws for negative subtotal', () => {
      expect(() => calculateTax(-1, 'intra_state')).toThrow('Subtotal cannot be negative')
      expect(() => calculateTax(-100, 'inter_state')).toThrow('Subtotal cannot be negative')
    })

    it('handles very large amounts', () => {
      const result = calculateTax(999999.99, 'intra_state')
      expect(result.cgst).toBe(90000)
      expect(result.sgst).toBe(90000)
      expect(result.total).toBe(1179999.99)
    })
  })

  // ============================================
  // Tax rounding accuracy
  // ============================================
  describe('Tax rounding accuracy', () => {
    it('rounds to exactly 2 decimal places', () => {
      // 9% of 33.33 = 2.9997 → 3.00
      const result = calculateTax(33.33, 'intra_state')
      expect(result.cgst.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
      expect(result.sgst.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
      expect(result.total.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2)
    })

    it('never produces amounts with more than 2 decimal places', () => {
      const testAmounts = [
        0.01, 0.99, 1.23, 10.01, 100.99, 333.33, 666.67,
        1111.11, 2222.22, 9999.99,
      ]

      for (const amount of testAmounts) {
        const intra = calculateTax(amount, 'intra_state')
        const inter = calculateTax(amount, 'inter_state')

        const checkDecimals = (val: number) => {
          const parts = val.toString().split('.')
          return (parts[1]?.length ?? 0) <= 2
        }

        expect(checkDecimals(intra.cgst)).toBe(true)
        expect(checkDecimals(intra.sgst)).toBe(true)
        expect(checkDecimals(intra.total)).toBe(true)
        expect(checkDecimals(inter.igst)).toBe(true)
        expect(checkDecimals(inter.total)).toBe(true)
      }
    })

    it('rounding does not cause total mismatch beyond 1 paisa', () => {
      // Edge case: rounding on individual components vs total
      const result = calculateTax(1111.11, 'intra_state')
      const manualTotal = result.subtotal + result.cgst + result.sgst
      expect(Math.abs(result.total - manualTotal)).toBeLessThanOrEqual(0.01)
    })
  })

  // ============================================
  // Full invoice calculation flow
  // ============================================
  describe('End-to-end invoice calculation', () => {
    it('simulates a complete invoice: items → subtotal → tax → total', () => {
      // Typical repair invoice
      const lineItems = [
        { quantity: 1, unit_price: 4500 },  // Screen panel
        { quantity: 1, unit_price: 800 },   // Labour
        { quantity: 2, unit_price: 50 },    // Screws
      ]

      // Step 1: Calculate each line amount
      const amounts = lineItems.map((i) => calculateLineAmount(i.quantity, i.unit_price))
      expect(amounts).toEqual([4500, 800, 100])

      // Step 2: Calculate subtotal
      const subtotal = calculateSubtotal(lineItems)
      expect(subtotal).toBe(5400)

      // Step 3: Apply Delhi intra-state tax
      const tax = calculateTax(subtotal, 'intra_state')
      expect(tax.subtotal).toBe(5400)
      expect(tax.cgst).toBe(486)      // 9% of 5400
      expect(tax.sgst).toBe(486)      // 9% of 5400
      expect(tax.total).toBe(6372)    // 5400 + 486 + 486
    })

    it('simulates inter-state laptop sale', () => {
      const lineItems = [
        { quantity: 1, unit_price: 28000 },  // Refurbished laptop
        { quantity: 1, unit_price: 500 },    // Laptop bag
      ]

      const subtotal = calculateSubtotal(lineItems)
      expect(subtotal).toBe(28500)

      const tax = calculateTax(subtotal, 'inter_state')
      expect(tax.igst).toBe(5130)    // 18% of 28500
      expect(tax.total).toBe(33630)  // 28500 + 5130
    })
  })
})
