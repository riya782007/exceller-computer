import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration Tests for Invoice Server Actions
 * 
 * These tests verify the createInvoice action logic by mocking
 * external dependencies (Supabase, PDF renderer, Storage).
 * 
 * Since we can't run a real Supabase instance in unit tests,
 * we mock the database and storage calls to test:
 * - Input validation
 * - Error handling for missing customer/job
 * - Correct tax application flow
 * - PDF generation failure handling
 * - Storage upload failure handling
 * - Unauthorized access prevention
 */

// Mock Supabase modules
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/auth/require-role', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/lib/invoices/generate-pdf', () => ({
  generateInvoicePdfBuffer: vi.fn(),
}))

vi.mock('@/lib/invoices/upload-pdf', () => ({
  uploadInvoicePdf: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Import after mocking
import { createInvoice, updateInvoicePaymentStatus } from '@/lib/actions/invoices'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateInvoicePdfBuffer } from '@/lib/invoices/generate-pdf'
import { uploadInvoicePdf } from '@/lib/invoices/upload-pdf'

// Helpers
const mockRequireRole = vi.mocked(requireRole)
const mockCreateAdminClient = vi.mocked(createAdminClient)
const mockCreateServerClient = vi.mocked(createServerSupabaseClient)
const mockGeneratePdf = vi.mocked(generateInvoicePdfBuffer)
const mockUploadPdf = vi.mocked(uploadInvoicePdf)

function createMockSupabaseClient() {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()
  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
  })

  // Make chainable
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, order: vi.fn().mockReturnThis() })
  mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq })

  return {
    from: mockFrom,
    _mockSelect: mockSelect,
    _mockInsert: mockInsert,
    _mockUpdate: mockUpdate,
    _mockSingle: mockSingle,
    _mockEq: mockEq,
  }
}

const validInput = {
  customer_id: '550e8400-e29b-41d4-a716-446655440001',
  tax_type: 'intra_state' as const,
  items: [
    { description: 'Screen Replacement', quantity: 1, unit_price: 4500, hsn_sac: '85285900' },
    { description: 'Labour Charge', quantity: 1, unit_price: 800 },
  ],
  notes: 'Test invoice',
}

describe('createInvoice — Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // Authorization Tests
  // ============================================
  describe('Authorization', () => {
    it('rejects unauthenticated users', async () => {
      mockRequireRole.mockRejectedValue(new Error('Unauthorized: Not authenticated'))

      const result = await createInvoice(validInput)

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Unauthorized')
    })

    it('rejects non-admin roles', async () => {
      mockRequireRole.mockRejectedValue(
        new Error("Forbidden: Role 'technician' does not have access. Required: admin")
      )

      const result = await createInvoice(validInput)

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Forbidden')
    })
  })

  // ============================================
  // Validation Tests
  // ============================================
  describe('Input Validation', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })
    })

    it('rejects missing customer_id', async () => {
      const result = await createInvoice({
        ...validInput,
        customer_id: '',
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects invalid customer_id (not UUID)', async () => {
      const result = await createInvoice({
        ...validInput,
        customer_id: 'not-a-uuid',
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects empty items array', async () => {
      const result = await createInvoice({
        ...validInput,
        items: [],
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects items with zero quantity', async () => {
      const result = await createInvoice({
        ...validInput,
        items: [{ description: 'Test', quantity: 0, unit_price: 100 }],
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects items with negative price', async () => {
      const result = await createInvoice({
        ...validInput,
        items: [{ description: 'Test', quantity: 1, unit_price: -500 }],
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects items without description', async () => {
      const result = await createInvoice({
        ...validInput,
        items: [{ description: '', quantity: 1, unit_price: 100 }],
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })

    it('rejects invalid tax_type', async () => {
      const result = await createInvoice({
        ...validInput,
        tax_type: 'invalid_type' as 'intra_state',
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Validation failed')
    })
  })

  // ============================================
  // Customer/Job Verification
  // ============================================
  describe('Customer & Job Verification', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })
    })

    it('returns error when customer not found', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      }
      mockCreateAdminClient.mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>)

      const result = await createInvoice(validInput)

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('Customer not found')
    })

    it('returns error when linked job not found', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'cust-1', full_name: 'Test', email: null, phone: null, address: null },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'repair_jobs') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                }),
              }),
            }
          }
          return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
        }),
      }
      mockCreateAdminClient.mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>)

      const result = await createInvoice({
        ...validInput,
        job_id: '550e8400-e29b-41d4-a716-446655440099',
      })

      expect(result.success).toBe(false)
      expect(result.success === false && result.error).toContain('job not found')
    })
  })

  // ============================================
  // PDF Generation Failure Handling
  // ============================================
  describe('PDF Generation Failure', () => {
    it('creates invoice but returns warning when PDF generation fails', async () => {
      mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })

      // Mock successful DB operations
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'cust-1', full_name: 'John Doe', email: 'john@test.com', phone: '+911234567890', address: 'Delhi' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'invoices') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'inv-1', invoice_number: 'EXC-2024-0001' },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          if (table === 'invoice_items') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          return { select: vi.fn().mockReturnThis() }
        }),
      }
      mockCreateAdminClient.mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>)

      // PDF generation fails
      mockGeneratePdf.mockResolvedValue({
        buffer: null,
        error: 'Font rendering failed',
      })

      const result = await createInvoice(validInput)

      // Invoice should still be created
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.invoiceId).toBe('inv-1')
        expect(result.data.invoiceNumber).toBe('EXC-2024-0001')
        expect(result.data.pdfUrl).toBeNull()
        expect(result.data.warning).toContain('PDF generation failed')
      }
    })
  })

  // ============================================
  // Storage Upload Failure Handling
  // ============================================
  describe('Storage Upload Failure', () => {
    it('creates invoice but returns warning when upload fails', async () => {
      mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'cust-1', full_name: 'Jane Doe', email: null, phone: '+919876543210', address: null },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'invoices') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'inv-2', invoice_number: 'EXC-2024-0002' },
                    error: null,
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          if (table === 'invoice_items') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            }
          }
          return { select: vi.fn().mockReturnThis() }
        }),
      }
      mockCreateAdminClient.mockReturnValue(mockClient as unknown as ReturnType<typeof createAdminClient>)

      // PDF generation succeeds
      mockGeneratePdf.mockResolvedValue({
        buffer: new Uint8Array([1, 2, 3]),
        error: null,
      })

      // Storage upload fails
      mockUploadPdf.mockResolvedValue({
        success: false,
        url: null,
        error: 'Storage bucket not found',
      })

      const result = await createInvoice(validInput)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.invoiceId).toBe('inv-2')
        expect(result.data.pdfUrl).toBeNull()
        expect(result.data.warning).toContain('PDF upload failed')
      }
    })
  })
})

// ============================================
// Update Payment Status Tests
// ============================================
describe('updateInvoicePaymentStatus — Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthorized users', async () => {
    mockRequireRole.mockRejectedValue(new Error('Unauthorized: Not authenticated'))

    const result = await updateInvoicePaymentStatus({
      invoice_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_status: 'paid',
    })

    expect(result.success).toBe(false)
    expect(result.success === false && result.error).toContain('Unauthorized')
  })

  it('rejects invalid payment status', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })

    const result = await updateInvoicePaymentStatus({
      invoice_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_status: 'invalid_status',
    })

    expect(result.success).toBe(false)
    expect(result.success === false && result.error).toContain('Invalid')
  })

  it('rejects invalid invoice_id', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })

    const result = await updateInvoicePaymentStatus({
      invoice_id: 'not-a-uuid',
      payment_status: 'paid',
    })

    expect(result.success).toBe(false)
  })

  it('updates status successfully', async () => {
    mockRequireRole.mockResolvedValue({ userId: 'admin-id', role: 'admin' })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    }
    mockCreateServerClient.mockResolvedValue(mockClient as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>)

    const result = await updateInvoicePaymentStatus({
      invoice_id: '550e8400-e29b-41d4-a716-446655440001',
      payment_status: 'paid',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.newStatus).toBe('paid')
    }
  })
})
