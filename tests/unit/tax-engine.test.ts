import { describe, it, expect } from 'vitest'
import {
  calculateTax,
  calculateLineAmount,
  calculateSubtotal,
} from '@/lib/utils/tax-engine'

describe('Tax Engine', () => {
  describe('calculateTax — intra-state (Delhi)', () => {
    it('calculates CGST + SGST correctly for intra-state', () => {
      const result = calculateTax(1000, 'intra_state')

      expect(result.cgst).toBe(90) // 9% of 1000
      expect(result.sgst).toBe(90) // 9% of 1000
      expect(result.igst).toBe(0)
      expect(result.total).toBe(1180) // 1000 + 90 + 90
      expect(result.taxType).toBe('intra_state')
    })

    it('handles decimal subtotals', () => {
      const result = calculateTax(1499.50, 'intra_state')

      expect(result.cgst).toBe(134.96) // 9% of 1499.50 = 134.955 → 134.96
      expect(result.sgst).toBe(134.96)
      expect(result.igst).toBe(0)
      expect(result.total).toBe(1769.42)
    })

    it('handles zero subtotal', () => {
      const result = calculateTax(0, 'intra_state')

      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.total).toBe(0)
    })
  })

  describe('calculateTax — inter-state', () => {
    it('calculates IGST correctly for inter-state', () => {
      const result = calculateTax(1000, 'inter_state')

      expect(result.cgst).toBe(0)
      expect(result.sgst).toBe(0)
      expect(result.igst).toBe(180) // 18% of 1000
      expect(result.total).toBe(1180)
      expect(result.taxType).toBe('inter_state')
    })

    it('handles decimal subtotals for inter-state', () => {
      const result = calculateTax(2500.75, 'inter_state')

      expect(result.igst).toBe(450.14) // 18% of 2500.75 = 450.135 → 450.14
      expect(result.total).toBe(2950.89)
    })
  })

  describe('calculateTax — custom config', () => {
    it('respects custom tax rates', () => {
      const result = calculateTax(1000, 'intra_state', {
        cgstRate: 6,
        sgstRate: 6,
        igstRate: 12,
      })

      expect(result.cgst).toBe(60)
      expect(result.sgst).toBe(60)
      expect(result.total).toBe(1120)
    })
  })

  describe('calculateTax — error handling', () => {
    it('throws for negative subtotal', () => {
      expect(() => calculateTax(-100, 'intra_state')).toThrow('Subtotal cannot be negative')
    })
  })

  describe('calculateLineAmount', () => {
    it('calculates quantity × unit price', () => {
      expect(calculateLineAmount(3, 500)).toBe(1500)
      expect(calculateLineAmount(2, 1499.50)).toBe(2999)
    })
  })

  describe('calculateSubtotal', () => {
    it('sums all line items', () => {
      const items = [
        { quantity: 2, unit_price: 500 },
        { quantity: 1, unit_price: 3000 },
        { quantity: 3, unit_price: 200 },
      ]
      expect(calculateSubtotal(items)).toBe(4600) // 1000 + 3000 + 600
    })

    it('returns 0 for empty array', () => {
      expect(calculateSubtotal([])).toBe(0)
    })
  })
})
