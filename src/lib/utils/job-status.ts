import { VALID_JOB_TRANSITIONS, type JobStatus } from '@/types'

/**
 * Check if a status transition is valid.
 * Single source of truth for job status transitions (mirrors the PostgreSQL function).
 */
export function isValidTransition(currentStatus: JobStatus, newStatus: JobStatus): boolean {
  const allowedTransitions = VALID_JOB_TRANSITIONS[currentStatus]
  if (!allowedTransitions) return false
  return allowedTransitions.includes(newStatus)
}

/**
 * Get all valid next statuses from current status.
 */
export function getNextStatuses(currentStatus: JobStatus): JobStatus[] {
  return (VALID_JOB_TRANSITIONS[currentStatus] || []) as JobStatus[]
}

/**
 * Get human-readable status label.
 */
export function getStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    received: 'Received',
    diagnosed: 'Diagnosed',
    quoted: 'Quoted',
    approved: 'Approved',
    in_repair: 'In Repair',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

/**
 * Get status color for UI badges.
 */
export function getStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    received: 'bg-gray-100 text-gray-800',
    diagnosed: 'bg-blue-100 text-blue-800',
    quoted: 'bg-purple-100 text-purple-800',
    approved: 'bg-indigo-100 text-indigo-800',
    in_repair: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status]
}

/**
 * Check if a job is in a terminal state.
 */
export function isTerminalStatus(status: JobStatus): boolean {
  return status === 'delivered' || status === 'cancelled'
}

/**
 * Check if parts can be allocated to a job in this status.
 */
export function canAllocateParts(status: JobStatus): boolean {
  return status === 'approved' || status === 'in_repair'
}
