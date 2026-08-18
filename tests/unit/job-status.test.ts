import { describe, it, expect } from 'vitest'
import {
  isValidTransition,
  getNextStatuses,
  isTerminalStatus,
  canAllocateParts,
  getStatusLabel,
  getStatusColor,
} from '@/lib/utils/job-status'

describe('Job Status Transitions', () => {
  describe('isValidTransition', () => {
    it('allows received → diagnosed', () => {
      expect(isValidTransition('received', 'diagnosed')).toBe(true)
    })

    it('allows received → cancelled', () => {
      expect(isValidTransition('received', 'cancelled')).toBe(true)
    })

    it('allows diagnosed → quoted', () => {
      expect(isValidTransition('diagnosed', 'quoted')).toBe(true)
    })

    it('allows quoted → approved', () => {
      expect(isValidTransition('quoted', 'approved')).toBe(true)
    })

    it('allows approved → in_repair', () => {
      expect(isValidTransition('approved', 'in_repair')).toBe(true)
    })

    it('allows in_repair → ready', () => {
      expect(isValidTransition('in_repair', 'ready')).toBe(true)
    })

    it('allows ready → delivered', () => {
      expect(isValidTransition('ready', 'delivered')).toBe(true)
    })

    // Invalid transitions
    it('rejects received → approved (skipping steps)', () => {
      expect(isValidTransition('received', 'approved')).toBe(false)
    })

    it('rejects delivered → anything (terminal)', () => {
      expect(isValidTransition('delivered', 'received')).toBe(false)
      expect(isValidTransition('delivered', 'cancelled')).toBe(false)
    })

    it('rejects cancelled → anything (terminal)', () => {
      expect(isValidTransition('cancelled', 'received')).toBe(false)
      expect(isValidTransition('cancelled', 'in_repair')).toBe(false)
    })

    it('rejects backwards transitions', () => {
      expect(isValidTransition('in_repair', 'diagnosed')).toBe(false)
      expect(isValidTransition('ready', 'in_repair')).toBe(false)
    })

    // Cancellation from most states
    it('allows cancellation from diagnosed', () => {
      expect(isValidTransition('diagnosed', 'cancelled')).toBe(true)
    })

    it('allows cancellation from in_repair', () => {
      expect(isValidTransition('in_repair', 'cancelled')).toBe(true)
    })

    it('does not allow cancellation from ready', () => {
      expect(isValidTransition('ready', 'cancelled')).toBe(false)
    })
  })

  describe('getNextStatuses', () => {
    it('returns valid next statuses for received', () => {
      expect(getNextStatuses('received')).toEqual(['diagnosed', 'cancelled'])
    })

    it('returns empty for delivered', () => {
      expect(getNextStatuses('delivered')).toEqual([])
    })

    it('returns empty for cancelled', () => {
      expect(getNextStatuses('cancelled')).toEqual([])
    })
  })

  describe('isTerminalStatus', () => {
    it('delivered is terminal', () => {
      expect(isTerminalStatus('delivered')).toBe(true)
    })

    it('cancelled is terminal', () => {
      expect(isTerminalStatus('cancelled')).toBe(true)
    })

    it('in_repair is not terminal', () => {
      expect(isTerminalStatus('in_repair')).toBe(false)
    })
  })

  describe('canAllocateParts', () => {
    it('can allocate in approved status', () => {
      expect(canAllocateParts('approved')).toBe(true)
    })

    it('can allocate in in_repair status', () => {
      expect(canAllocateParts('in_repair')).toBe(true)
    })

    it('cannot allocate in received status', () => {
      expect(canAllocateParts('received')).toBe(false)
    })

    it('cannot allocate in delivered status', () => {
      expect(canAllocateParts('delivered')).toBe(false)
    })
  })

  describe('getStatusLabel', () => {
    it('returns human-readable labels', () => {
      expect(getStatusLabel('in_repair')).toBe('In Repair')
      expect(getStatusLabel('ready')).toBe('Ready for Pickup')
    })
  })

  describe('getStatusColor', () => {
    it('returns CSS classes for each status', () => {
      expect(getStatusColor('received')).toContain('bg-gray')
      expect(getStatusColor('in_repair')).toContain('bg-yellow')
      expect(getStatusColor('cancelled')).toContain('bg-red')
    })
  })
})
