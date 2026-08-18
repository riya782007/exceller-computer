# Database Standards — Exceller Computer Platform

## General

- PostgreSQL via Supabase
- All tables use UUID primary keys: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- All tables include: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`
- Use `updated_at` trigger function for automatic timestamp updates
- Enable RLS on every table immediately after creation

## Schema Design

### profiles
- Links to `auth.users` via `id` (same UUID)
- Roles: `admin`, `technician`, `customer`
- Fields: full_name, phone, email, role, address, is_active

### inventory_items
- CHECK constraint: `quantity >= 0` (NEVER negative)
- Categories: `part`, `refurbished_laptop`, `accessory`
- Required: sku (UNIQUE), name, category, quantity, cost_price, selling_price
- Optional: brand, model, hsn_sac, specifications (JSONB)

### repair_jobs
- Status enum: `received`, `diagnosed`, `quoted`, `approved`, `in_repair`, `ready`, `delivered`, `cancelled`
- Valid transitions enforced by PostgreSQL function
- Fields: job_card_number (UNIQUE sequential), customer_id, technician_id, device_type, device_brand, device_model, serial_number, reported_fault, diagnosis, estimated_cost, final_cost, status, timestamps per status change

### job_parts_allocated
- Links repair_jobs ↔ inventory_items
- Allocation via atomic PostgreSQL function (validate stock → allocate → deduct)
- Fields: job_id, item_id, quantity, unit_price, allocated_at, allocated_by

### invoices
- Invoice number: sequential, formatted (EXC-YYYY-NNNN)
- Tax type: `intra_state` (CGST+SGST) or `inter_state` (IGST)
- Fields: invoice_number, customer_id, job_id, subtotal, cgst, sgst, igst, total, payment_status, pdf_url, notes
- Line items stored in `invoice_items` table

### chat_sessions
- States: `active`, `paused`, `escalated`
- Fields: phone_number, customer_id (nullable), bot_state, last_message_at, escalated_at, escalation_reason

## Indexes

Create indexes on:
- `repair_jobs.status`
- `repair_jobs.customer_id`
- `repair_jobs.technician_id`
- `repair_jobs.job_card_number`
- `inventory_items.sku`
- `inventory_items.category`
- `invoices.customer_id`
- `invoices.job_id`
- `chat_sessions.phone_number`

## Functions

### allocate_part_to_job(job_id, item_id, quantity, allocated_by)
- Validates stock available
- Creates allocation record
- Deducts inventory
- All in single transaction

### transition_job_status(job_id, new_status, user_id)
- Validates current → new status is allowed
- Updates status
- Records timestamp
- Returns success/error

### generate_invoice_number()
- Returns next sequential invoice number in format EXC-YYYY-NNNN

## RLS Policies

- **admin**: Full access to all tables
- **technician**: Read own profile, read/update assigned jobs, read inventory, create allocations
- **customer**: Read own profile, read own jobs, read own invoices
- **anonymous**: Read public inventory (refurbished laptops marked as public)

## Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql`

Example: `20240101000000_create_profiles_table.sql`
