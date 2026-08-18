import { z } from 'zod'

// ============================================
// Profile Schemas
// ============================================

export const createProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'technician', 'customer']).default('customer'),
  address: z.string().max(500).optional().or(z.literal('')),
})

export const updateProfileSchema = createProfileSchema.partial()

// ============================================
// Inventory Schemas
// ============================================

export const inventoryItemSchema = z.object({
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(50)
    .regex(/^[A-Za-z0-9-]+$/, 'SKU can only contain letters, numbers, and hyphens'),
  name: z.string().min(2, 'Name is required').max(200),
  category: z.enum(['part', 'refurbished_laptop', 'accessory']),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(200).optional().or(z.literal('')),
  cost_price: z.coerce.number().min(0, 'Cost price must be non-negative'),
  selling_price: z.coerce.number().min(0, 'Selling price must be non-negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be non-negative').default(0),
  hsn_sac: z.string().max(20).optional().or(z.literal('')),
  specifications: z.record(z.unknown()).optional(),
  is_public: z.boolean().default(false),
  condition: z.string().max(50).optional().or(z.literal('')),
  warranty_months: z.coerce.number().int().min(0).optional(),
  low_stock_threshold: z.coerce.number().int().min(0).optional(),
})

export const updateInventorySchema = inventoryItemSchema.partial().omit({ sku: true })

// ============================================
// Repair Job Schemas
// ============================================

export const createRepairJobSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  technician_id: z.string().uuid('Invalid technician ID').optional(),
  device_type: z.string().min(2, 'Device type is required').max(100),
  device_brand: z.string().min(1, 'Device brand is required').max(100),
  device_model: z.string().max(200).optional().or(z.literal('')),
  serial_number: z.string().max(100).optional().or(z.literal('')),
  reported_fault: z.string().min(5, 'Please describe the fault').max(2000),
  estimated_cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

export const updateRepairJobSchema = z.object({
  technician_id: z.string().uuid().optional().nullable(),
  diagnosis: z.string().max(5000).optional(),
  estimated_cost: z.coerce.number().min(0).optional(),
  final_cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
})

export const transitionJobStatusSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  new_status: z.enum([
    'received',
    'diagnosed',
    'quoted',
    'approved',
    'in_repair',
    'ready',
    'delivered',
    'cancelled',
  ]),
})

// ============================================
// Part Allocation Schema
// ============================================

export const allocatePartSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  item_id: z.string().uuid('Invalid item ID'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
})

// ============================================
// Invoice Schemas
// ============================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Price must be non-negative'),
  hsn_sac: z.string().max(20).optional().or(z.literal('')),
})

export const createInvoiceSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  job_id: z.string().uuid('Invalid job ID').optional(),
  tax_type: z.enum(['intra_state', 'inter_state']).default('intra_state'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

export const updatePaymentStatusSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
  payment_status: z.enum(['pending', 'paid', 'partial', 'cancelled', 'refunded']),
})

// ============================================
// WhatsApp / Chat Schemas
// ============================================

export const webhookPayloadSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.object({
    key: z.object({
      remoteJid: z.string(),
      fromMe: z.boolean(),
      id: z.string(),
    }),
    message: z.record(z.unknown()).optional(),
    messageType: z.string().optional(),
    pushName: z.string().optional(),
  }),
})

export const chatSessionUpdateSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  bot_state: z.enum(['active', 'paused', 'escalated']),
  escalation_reason: z.string().max(500).optional(),
})

// ============================================
// Repair Estimator Schema
// ============================================

export const estimatorSchema = z.object({
  brand: z.enum(['Dell', 'HP', 'Lenovo', 'Acer', 'Asus', 'Apple']),
  model: z.string().min(1, 'Model is required').max(200),
  issue: z.string().min(1, 'Issue is required').max(500),
})

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
})
