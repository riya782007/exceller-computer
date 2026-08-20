# Technical Specification: GST Invoicing Engine

## Feature Overview

Production-grade GST invoicing engine for Exceller Computer that calculates taxes, generates professional PDF invoices, uploads them to Supabase Storage, and integrates with the Admin ERP.

---

## Existing Infrastructure (DO NOT DUPLICATE)

| Component | Location | Status |
|-----------|----------|--------|
| Tax Engine | `src/lib/utils/tax-engine.ts` | ✅ Complete, tested |
| DB Schema (invoices, invoice_items) | `supabase/migrations/20240101000005` | ✅ Complete with RLS |
| Invoice Number Generator | `generate_invoice_number()` SQL function | ✅ Complete |
| Zod Schemas | `src/lib/validations/schemas.ts` | ✅ Complete |
| Types | `src/types/database.ts`, `src/types/index.ts` | ✅ Complete |
| Auth/Roles | `src/lib/auth/require-role.ts` | ✅ Complete |
| Admin Invoice List | `src/app/admin/invoices/page.tsx` | ✅ Read-only listing |
| Business Constants | `src/lib/constants/index.ts` | ✅ Address, name |

---

## Implementation Plan

### 1. Supabase Storage Bucket (Migration)

**File:** `supabase/migrations/20240101000007_create_invoices_bucket.sql`

Create a `invoices` storage bucket with:
- Authenticated access for admin (upload/read)
- Read access for customers (own invoices only via signed URLs)

### 2. Invoice Creation Server Action

**File:** `src/lib/actions/invoices.ts`

```
createInvoice(formData) → ActionResult<{ invoiceId, invoiceNumber, pdfUrl }>
```

Flow:
1. `requireRole('admin')` — only admins can create invoices
2. Validate input with `createInvoiceSchema`
3. Verify customer exists
4. Verify job exists (if provided)
5. Calculate line item amounts via `calculateLineAmount()`
6. Calculate subtotal via `calculateSubtotal()`
7. Calculate taxes via `calculateTax(subtotal, taxType)`
8. Insert invoice record (DB generates invoice_number)
9. Insert invoice_items records
10. Generate PDF via `generateInvoicePdf()`
11. Upload PDF to Supabase Storage
12. Update invoice record with `pdf_url`
13. Return result

**Error Handling:**
- If PDF generation fails → invoice record still exists but `pdf_url` is null, return warning
- If storage upload fails → same behavior, surface error
- If DB insert fails → return error, no partial state
- Wrap invoice insert + items insert in a transaction-like pattern

### 3. PDF Generation

**File:** `src/lib/invoices/pdf-template.tsx`

Professional GST invoice PDF using `@react-pdf/renderer`:
- Header: Company logo area, Exceller Infosolutions LLP, address, GSTIN, phone, email
- Invoice metadata: Invoice number, date, job card reference
- Customer: Name, address, phone
- Items table: S.No, Description, HSN/SAC, Qty, Unit Price, Amount
- Tax breakdown: Subtotal, CGST @9%, SGST @9% (or IGST @18%), Total
- Footer: Terms, payment info, authorized signatory area
- Payment status badge

**File:** `src/lib/invoices/generate-pdf.ts`

Server-side PDF generation:
- Renders the React PDF template to a Buffer
- Returns the buffer for upload

### 4. Storage Upload

**File:** `src/lib/invoices/upload-pdf.ts`

- Uses admin Supabase client (bypasses RLS for storage)
- Uploads to `invoices/{year}/{invoice_number}.pdf`
- Returns public URL or signed URL
- Handles upload failures gracefully

### 5. Payment Status Update Server Action

**File:** `src/lib/actions/invoices.ts` (same file)

```
updateInvoicePaymentStatus(data) → ActionResult<void>
```

### 6. Admin ERP Pages

**New Files:**
- `src/app/admin/invoices/new/page.tsx` — Invoice creation form
- `src/app/admin/invoices/new/invoice-form.tsx` — Client component for form
- `src/app/admin/invoices/[id]/page.tsx` — Invoice detail view with PDF download

### 7. Regenerate PDF Action

```
regenerateInvoicePdf(invoiceId) → ActionResult<{ pdfUrl }>
```

For cases where initial PDF generation failed.

---

## Data Flow Diagram

```
Admin fills form
       │
       ▼
┌─────────────────────┐
│ createInvoice()     │ ← Server Action
│  1. requireRole()   │
│  2. Zod validation  │
│  3. calculateTax()  │ ← Uses existing tax engine
│  4. DB insert       │ ← Uses generate_invoice_number()
│  5. Generate PDF    │ ← @react-pdf/renderer
│  6. Upload Storage  │ ← Supabase Storage (admin client)
│  7. Update pdf_url  │
└─────────────────────┘
       │
       ▼
ActionResult<{ invoiceId, invoiceNumber, pdfUrl }>
```

---

## Error Handling Matrix

| Failure Point | Behavior | User Impact |
|--------------|----------|-------------|
| Auth failure | Throw, return error | "Unauthorized" |
| Validation failure | Return error with details | Form shows errors |
| Customer not found | Return error | "Customer not found" |
| Job not found | Return error | "Job not found" |
| DB insert failure | Return error, no partial state | "Failed to create invoice" |
| Duplicate invoice # | Retry once (race condition), else error | Transparent |
| PDF generation fails | Invoice created, pdf_url=null, return warning | "Invoice saved, PDF failed" |
| Storage upload fails | Invoice created, pdf_url=null, return warning | "Invoice saved, upload failed" |
| pdf_url update fails | Log error, invoice exists without PDF | Admin can regenerate |

---

## Security Considerations

1. **Server Action only** — No client-side invoice creation
2. **requireRole('admin')** — Only admins create invoices
3. **RLS** — Customers can only read their own invoices
4. **Admin client for storage** — Bypasses RLS for upload (server-only)
5. **Signed URLs** — Customer PDF access via time-limited signed URLs
6. **Input validation** — All fields validated via Zod before any DB operation
7. **No financial data in logs** — Amounts not logged

---

## Testing Strategy

### Unit Tests (new file: `tests/unit/invoice-creation.test.ts`)
- Invoice subtotal calculation from line items
- Tax application (intra-state and inter-state)
- Total calculation accuracy
- Zero amount handling
- Rounding edge cases
- Invalid input rejection

### Integration Tests (new file: `tests/integration/invoice-actions.test.ts`)
- Full invoice creation flow (mocked Supabase)
- PDF generation produces valid buffer
- Error handling for missing customer
- Error handling for failed storage
- Payment status update validation

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/actions/invoices.ts` | Server Actions (create, update status, regenerate PDF) |
| `src/lib/invoices/pdf-template.tsx` | @react-pdf/renderer invoice template |
| `src/lib/invoices/generate-pdf.ts` | PDF buffer generation |
| `src/lib/invoices/upload-pdf.ts` | Supabase Storage upload |
| `src/app/admin/invoices/new/page.tsx` | Create invoice page |
| `src/app/admin/invoices/new/invoice-form.tsx` | Invoice form (client component) |
| `src/app/admin/invoices/[id]/page.tsx` | Invoice detail page |
| `supabase/migrations/20240101000007_create_invoices_bucket.sql` | Storage bucket |
| `tests/unit/invoice-creation.test.ts` | Unit tests |
| `tests/integration/invoice-actions.test.ts` | Integration tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/admin/invoices/page.tsx` | Minor: add download link, improve status actions |

---

## Dependencies

All already declared in `package.json`:
- `@react-pdf/renderer` — PDF generation
- `@supabase/supabase-js` — Storage upload (admin client)
- `zod` — Validation

No new dependencies required.
