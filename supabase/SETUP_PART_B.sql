-- ============================================================
-- EXELLER PLATFORM — SETUP PART B  (full platform schema)
-- ============================================================
-- RUN PART A FIRST. Then run this.
-- Safe to re-run (idempotent throughout).
--
-- Assumes the base schema (profiles, inventory_items, repair_jobs,
-- job_parts_allocated, invoices, invoice_items, chat_sessions) and the
-- is_admin()/is_technician() helpers already exist. If they do not,
-- run the earlier base setup script first.
-- ============================================================


-- ============================================================
-- SECTION 1 — NEW ENUM TYPES
-- ============================================================
DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','converted','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE service_mode AS ENUM ('walk_in','doorstep','pickup_drop','remote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE job_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE serial_status AS ENUM ('in_stock','reserved','installed','rma_sent','rma_returned','scrapped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE rma_status AS ENUM ('open','sent_to_vendor','replaced','credited','rejected','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE po_status AS ENUM ('draft','sent','partial','received','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE amc_status AS ENUM ('draft','active','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_method AS ENUM ('cash','upi','card','netbanking','cheque','credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE msg_channel AS ENUM ('whatsapp','sms','email','in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE msg_direction AS ENUM ('inbound','outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ai_role AS ENUM ('system','user','assistant','tool');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ai_surface AS ENUM ('public_diagnostic','whatsapp_agent','admin_copilot');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE stock_reason AS ENUM ('purchase','job_allocation','job_return','adjustment','rma_out','rma_in','sale','opening');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- SECTION 2 — RBAC (roles, permissions, grants)
-- ============================================================
-- The permission matrix has partial grants (e.g. counter staff may approve
-- quotes only under a value ceiling). An enum cannot express that, so roles
-- and capabilities are data.

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rank INTEGER NOT NULL DEFAULT 100,   -- lower = more privileged
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,            -- e.g. 'tickets.update_any'
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  constraint_value NUMERIC(12,2),      -- e.g. quote approval ceiling in INR
  PRIMARY KEY (role_id, permission_id)
);

-- Link profiles to a role row (legacy `role` enum column is retained)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2);
CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

-- Seed roles
INSERT INTO roles (key, name, description, rank) VALUES
  ('super_admin',      'Super Admin / Owner', 'Unrestricted access',                      0),
  ('store_manager',    'Store Manager',       'Operations, approvals, inventory',        10),
  ('counter_staff',    'Counter Intake Desk', 'Intake, customers, limited approvals',    20),
  ('bench_technician', 'Bench Technician',    'Assigned repairs, parts requests',        30),
  ('field_engineer',   'Field Engineer',      'Doorstep jobs assigned to them',          30),
  ('customer',         'Customer',            'Own jobs and invoices only',             100)
ON CONFLICT (key) DO NOTHING;

-- Seed permissions
INSERT INTO permissions (key, resource, action, description) VALUES
  ('tickets.create',            'tickets',   'create',        'Create work orders'),
  ('tickets.view_all',          'tickets',   'view_all',      'View every ticket'),
  ('tickets.view_assigned',     'tickets',   'view_assigned', 'View own assigned tickets'),
  ('tickets.update_any',        'tickets',   'update_any',    'Edit any ticket'),
  ('tickets.update_assigned',   'tickets',   'update_assigned','Edit own assigned tickets'),
  ('tickets.delete',            'tickets',   'delete',        'Delete tickets'),
  ('customers.view_full',       'customers', 'view_full',     'Full customer contact details'),
  ('customers.view_masked',     'customers', 'view_masked',   'Masked contact details'),
  ('customers.manage',          'customers', 'manage',        'Create/edit customers'),
  ('quotes.approve_any',        'quotes',    'approve_any',   'Approve any estimate'),
  ('quotes.approve_limited',    'quotes',    'approve_limited','Approve estimates under a ceiling'),
  ('inventory.view',            'inventory', 'view',          'View stock'),
  ('inventory.adjust',          'inventory', 'adjust',        'Adjust stock quantities'),
  ('inventory.request',         'inventory', 'request',       'Request parts'),
  ('inventory.purchase',        'inventory', 'purchase',      'Raise purchase orders'),
  ('billing.create',            'billing',   'create',        'Create invoices'),
  ('billing.override_discount', 'billing',   'override',      'Override pricing/discounts'),
  ('billing.refund',            'billing',   'refund',        'Issue refunds'),
  ('reports.view_financial',    'reports',   'view_financial','Financial reports'),
  ('reports.view_operational',  'reports',   'view_operational','Operational reports'),
  ('team.manage',               'team',      'manage',        'Manage staff and roles'),
  ('attendance.manage_all',     'attendance','manage_all',    'Manage all attendance'),
  ('attendance.self',           'attendance','self',          'Own clock in/out'),
  ('conversations.view',        'conversations','view',       'View customer conversations'),
  ('conversations.takeover',    'conversations','takeover',   'Take over from the AI agent'),
  ('agent.admin_copilot',       'agent',     'admin_copilot', 'Use the admin AI copilot'),
  ('settings.manage',           'settings',  'manage',        'Change business settings')
ON CONFLICT (key) DO NOTHING;

-- Grant matrix
-- Super admin: everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'super_admin'
ON CONFLICT DO NOTHING;

-- Store manager: everything except team/settings management and refunds
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'store_manager'
  AND p.key IN ('tickets.create','tickets.view_all','tickets.update_any',
                'customers.view_full','customers.manage',
                'quotes.approve_any','inventory.view','inventory.adjust',
                'inventory.purchase','billing.create','billing.override_discount',
                'reports.view_financial','reports.view_operational',
                'attendance.manage_all','attendance.self',
                'conversations.view','conversations.takeover','agent.admin_copilot')
ON CONFLICT DO NOTHING;

-- Counter staff: intake and customers; quote approval capped at ₹5,000
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'counter_staff'
  AND p.key IN ('tickets.create','tickets.view_all','tickets.update_any',
                'customers.view_full','customers.manage','inventory.view',
                'billing.create','attendance.self',
                'conversations.view','conversations.takeover')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, constraint_value)
SELECT r.id, p.id, 5000.00 FROM roles r CROSS JOIN permissions p
WHERE r.key = 'counter_staff' AND p.key = 'quotes.approve_limited'
ON CONFLICT DO NOTHING;

-- Bench technician: assigned work, masked contacts, may request parts
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'bench_technician'
  AND p.key IN ('tickets.view_assigned','tickets.update_assigned',
                'customers.view_masked','inventory.view','inventory.request',
                'attendance.self')
ON CONFLICT DO NOTHING;

-- Field engineer: same, plus full contact (needs to reach the customer)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.key = 'field_engineer'
  AND p.key IN ('tickets.view_assigned','tickets.update_assigned',
                'customers.view_full','inventory.view','inventory.request',
                'attendance.self')
ON CONFLICT DO NOTHING;

-- Backfill role_id from the legacy enum column
UPDATE profiles p SET role_id = r.id
FROM roles r
WHERE p.role_id IS NULL
  AND r.key = CASE p.role
                WHEN 'admin'      THEN 'super_admin'
                WHEN 'technician' THEN 'bench_technician'
                ELSE 'customer'
              END;

-- Permission check used by RLS. SECURITY DEFINER to avoid recursive policy
-- evaluation when reading profiles/roles from inside a policy.
CREATE OR REPLACE FUNCTION public.has_permission(p_key TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    JOIN public.role_permissions rp ON rp.role_id = pr.role_id
    JOIN public.permissions pm      ON pm.id = rp.permission_id
    WHERE pr.id = auth.uid() AND pr.is_active AND pm.key = p_key
  );
$$;

-- Returns the ceiling attached to a capped permission (NULL if uncapped/absent)
CREATE OR REPLACE FUNCTION public.permission_limit(p_key TEXT)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT rp.constraint_value
  FROM public.profiles pr
  JOIN public.role_permissions rp ON rp.role_id = pr.role_id
  JOIN public.permissions pm      ON pm.id = rp.permission_id
  WHERE pr.id = auth.uid() AND pr.is_active AND pm.key = p_key
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.permission_limit(TEXT) TO authenticated;

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_roles"        ON roles;
DROP POLICY IF EXISTS "staff_read_permissions"  ON permissions;
DROP POLICY IF EXISTS "staff_read_grants"       ON role_permissions;
DROP POLICY IF EXISTS "admin_manage_roles"      ON roles;
DROP POLICY IF EXISTS "admin_manage_grants"     ON role_permissions;

CREATE POLICY "staff_read_roles"       ON roles            FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_read_permissions" ON permissions      FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_read_grants"      ON role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_roles"     ON roles            FOR ALL TO authenticated
  USING (public.has_permission('team.manage')) WITH CHECK (public.has_permission('team.manage'));
CREATE POLICY "admin_manage_grants"    ON role_permissions FOR ALL TO authenticated
  USING (public.has_permission('team.manage')) WITH CHECK (public.has_permission('team.manage'));


-- ============================================================
-- SECTION 3 — CRM (customers decoupled from auth, devices, leads)
-- ============================================================
-- A walk-in customer must be creatable without provisioning a login, so this
-- table does NOT reference auth.users. profile_id links the minority who
-- register on the website.

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_phone TEXT,
  email TEXT,
  address_line TEXT,
  locality TEXT,
  city TEXT DEFAULT 'New Delhi',
  pincode TEXT,
  gstin TEXT,
  company_name TEXT,
  is_business BOOLEAN NOT NULL DEFAULT false,
  source TEXT,                          -- walk_in | website | whatsapp | referral | justdial
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_phone   ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_wa      ON customers(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_customers_name    ON customers(lower(full_name));
CREATE INDEX IF NOT EXISTS idx_customers_profile ON customers(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique ON customers(phone);

CREATE SEQUENCE IF NOT EXISTS customer_code_seq START WITH 1001;
ALTER TABLE customers ALTER COLUMN customer_code
  SET DEFAULT 'EXC-C-' || lpad(nextval('customer_code_seq')::text, 5, '0');

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL DEFAULT 'laptop',   -- laptop | desktop | aio | printer | custom_pc
  brand TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  service_tag TEXT,
  purchase_date DATE,
  oem_warranty_expiry DATE,
  passcode_hint TEXT,
  specifications JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devices_customer ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_serial   ON devices(serial_number);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT,
  locality TEXT,
  device_type TEXT,
  brand TEXT,
  issue_summary TEXT,
  service_interest TEXT,
  estimated_value NUMERIC(10,2),
  source TEXT,                          -- website_estimator | ai_diagnostic | whatsapp | call
  channel msg_channel,
  status lead_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  converted_job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone   ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

CREATE TABLE IF NOT EXISTS customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  channel msg_channel NOT NULL,
  direction msg_direction NOT NULL,
  summary TEXT NOT NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id, created_at DESC);

ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_customers"    ON customers;
DROP POLICY IF EXISTS "staff_manage_customers"  ON customers;
DROP POLICY IF EXISTS "self_view_customer"      ON customers;
DROP POLICY IF EXISTS "staff_view_devices"      ON devices;
DROP POLICY IF EXISTS "staff_manage_devices"    ON devices;
DROP POLICY IF EXISTS "staff_view_leads"        ON leads;
DROP POLICY IF EXISTS "staff_manage_leads"      ON leads;
DROP POLICY IF EXISTS "staff_view_interactions" ON customer_interactions;
DROP POLICY IF EXISTS "staff_add_interactions"  ON customer_interactions;

CREATE POLICY "staff_view_customers" ON customers FOR SELECT TO authenticated
  USING (public.has_permission('customers.view_full')
      OR public.has_permission('customers.view_masked'));
CREATE POLICY "staff_manage_customers" ON customers FOR ALL TO authenticated
  USING (public.has_permission('customers.manage'))
  WITH CHECK (public.has_permission('customers.manage'));
CREATE POLICY "self_view_customer" ON customers FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "staff_view_devices" ON devices FOR SELECT TO authenticated
  USING (public.has_permission('tickets.view_all')
      OR public.has_permission('tickets.view_assigned'));
CREATE POLICY "staff_manage_devices" ON devices FOR ALL TO authenticated
  USING (public.has_permission('customers.manage'))
  WITH CHECK (public.has_permission('customers.manage'));

CREATE POLICY "staff_view_leads"   ON leads FOR SELECT TO authenticated
  USING (public.has_permission('customers.view_full'));
CREATE POLICY "staff_manage_leads" ON leads FOR ALL TO authenticated
  USING (public.has_permission('customers.manage'))
  WITH CHECK (public.has_permission('customers.manage'));

CREATE POLICY "staff_view_interactions" ON customer_interactions FOR SELECT TO authenticated
  USING (public.has_permission('conversations.view'));
CREATE POLICY "staff_add_interactions"  ON customer_interactions FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('conversations.view'));


-- ============================================================
-- SECTION 4 — SERVICE CATALOG
-- ============================================================
-- Single source of truth for what Exeller sells and at what price.
-- Powers the public estimator AND grounds the AI agent, so the agent can
-- never invent a price.

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT,
  long_description TEXT,
  device_types TEXT[] NOT NULL DEFAULT ARRAY['laptop'],
  brands TEXT[],
  price_min NUMERIC(10,2) NOT NULL CHECK (price_min >= 0),
  price_max NUMERIC(10,2) NOT NULL CHECK (price_max >= 0),
  labour_hours NUMERIC(5,2),
  turnaround_hours INTEGER,
  warranty_months INTEGER,
  hsn_sac TEXT,
  margin_hint NUMERIC(5,2),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT price_range_valid CHECK (price_max >= price_min)
);
CREATE INDEX IF NOT EXISTS idx_catalog_slug     ON service_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_catalog_active   ON service_catalog(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_catalog_category ON service_catalog(category_id);

INSERT INTO service_categories (key, name, description, icon, sort_order) VALUES
  ('display',      'Display & Screen',      'LCD/LED panel repair and replacement',     'monitor',  1),
  ('power',        'Power & Battery',        'Battery, charging port, adapter faults',   'battery',  2),
  ('input',        'Keyboard & Input',       'Keyboard, trackpad, hinge repair',         'keyboard', 3),
  ('mainboard',    'Motherboard & Chip',     'Chip-level and board-level repair',        'cpu',      4),
  ('upgrade',      'Performance Upgrades',   'SSD and RAM upgrades',                     'gauge',    5),
  ('software',     'Software & Data',        'OS install, virus removal, data recovery',  'shield',   6),
  ('enterprise',   'Business & AMC',         'Corporate IT contracts and networking',     'building', 7)
ON CONFLICT (key) DO NOTHING;

-- Pricing bands drawn from the operational service matrix
INSERT INTO service_catalog
  (category_id, key, name, slug, short_description, device_types, brands,
   price_min, price_max, turnaround_hours, warranty_months, hsn_sac, is_featured, sort_order)
SELECT c.id, v.key, v.name, v.slug, v.descr,
       v.device_types, v.brands, v.pmin, v.pmax, v.tat, v.warranty, v.hsn, v.featured, v.sort
FROM (VALUES
  ('display',   'screen_replacement',  'Laptop Screen Replacement',   'laptop-screen-replacement',
   'FHD, HD and high-refresh panel replacement with OEM or grade-A compatible displays.',
   ARRAY['laptop'], ARRAY['Dell','HP','Lenovo','Acer','Asus','Apple','MSI'], 2500, 8000, 24, 12, '85285900', true, 1),

  ('power',     'battery_replacement', 'Laptop Battery Replacement',  'laptop-battery-replacement',
   'Internal and external lithium-ion battery replacement, OEM and high-grade compatible.',
   ARRAY['laptop'], ARRAY['Dell','HP','Lenovo','Acer','Asus','Apple'], 1200, 5000, 6, 6, '85076000', true, 2),

  ('power',     'charging_port',       'Charging Port Repair',        'laptop-charging-port-repair',
   'DC jack replacement and power delivery rail repair.',
   ARRAY['laptop'], ARRAY['Dell','HP','Lenovo','Acer','Asus','Apple'], 1200, 3500, 24, 3, '85369090', false, 3),

  ('input',     'keyboard_replacement','Laptop Keyboard Replacement', 'laptop-keyboard-replacement',
   'Frame-mounted, backlit and standard membrane keyboard replacement.',
   ARRAY['laptop'], ARRAY['Dell','HP','Lenovo','Acer','Asus','Apple'], 800, 3000, 6, 6, '84716060', false, 4),

  ('input',     'hinge_repair',        'Hinge Repair & Reinforcement','laptop-hinge-repair',
   'Structural chassis reinforcement, screw-post rebuilding and full hinge replacement.',
   ARRAY['laptop'], ARRAY['Dell','HP','Lenovo','Acer','Asus'], 800, 5000, 48, 3, '84733099', false, 5),

  ('mainboard', 'motherboard_repair',  'Motherboard Chip-Level Repair','laptop-motherboard-repair',
   'IC replacement, power rail repair, short-circuit tracing and liquid damage recovery.',
   ARRAY['laptop','desktop'], ARRAY['Dell','HP','Lenovo','Acer','Asus','Apple'], 1000, 8000, 48, 3, '84733030', true, 6),

  ('upgrade',   'ssd_upgrade',         'SSD Upgrade',                 'ssd-upgrade',
   'SATA, NVMe and M.2 installation with OS cloning and data migration.',
   ARRAY['laptop','desktop'], NULL, 1500, 4500, 4, 12, '84717020', true, 7),

  ('upgrade',   'ram_upgrade',         'RAM Upgrade',                 'ram-upgrade',
   'DDR3, DDR4 and DDR5 memory expansion from 4GB to 32GB.',
   ARRAY['laptop','desktop'], NULL, 1000, 5000, 2, 12, '84733020', false, 8),

  ('software',  'os_cleanup',          'OS Install & Virus Removal',  'os-install-virus-removal',
   'Malware purging, registry repair, OS installation and system optimisation.',
   ARRAY['laptop','desktop'], NULL, 300, 700, 4, 0, '998313', false, 9),

  ('software',  'data_recovery',       'Data Recovery',               'data-recovery',
   'Recovery from failed drives, corrupted partitions and accidental deletion.',
   ARRAY['laptop','desktop'], NULL, 1500, 12000, 72, 0, '998313', false, 10),

  ('enterprise','amc_contract',        'Corporate IT AMC',            'corporate-it-amc',
   'Annual maintenance contracts covering hardware upkeep, networking and preventive service.',
   ARRAY['laptop','desktop'], NULL, 15000, 250000, 0, 12, '998313', true, 11),

  ('enterprise','custom_pc',           'Custom PC Build',             'custom-pc-build',
   'Gaming and workstation builds assembled and stress-tested to spec.',
   ARRAY['custom_pc'], NULL, 25000, 350000, 72, 12, '84713010', false, 12)
) AS v(cat_key, key, name, slug, descr, device_types, brands, pmin, pmax, tat, warranty, hsn, featured, sort)
JOIN service_categories c ON c.key = v.cat_key
ON CONFLICT (key) DO NOTHING;

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON service_categories;
DROP POLICY IF EXISTS "public_read_catalog"    ON service_catalog;
DROP POLICY IF EXISTS "admin_manage_catalog"   ON service_catalog;
DROP POLICY IF EXISTS "admin_manage_cats"      ON service_categories;

-- Public: the estimator and service pages are anonymous-readable
CREATE POLICY "public_read_categories" ON service_categories FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY "public_read_catalog"    ON service_catalog    FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY "admin_manage_cats"      ON service_categories FOR ALL TO authenticated
  USING (public.has_permission('settings.manage')) WITH CHECK (public.has_permission('settings.manage'));
CREATE POLICY "admin_manage_catalog"   ON service_catalog    FOR ALL TO authenticated
  USING (public.has_permission('settings.manage')) WITH CHECK (public.has_permission('settings.manage'));


-- ============================================================
-- SECTION 5 — SERVICE DESK EXPANSION
-- ============================================================
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS customer_ref UUID REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS device_id    UUID REFERENCES devices(id) ON DELETE SET NULL;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS priority     job_priority NOT NULL DEFAULT 'normal';
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS mode         service_mode NOT NULL DEFAULT 'walk_in';
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS zone         TEXT;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_paid >= 0);
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS promised_at  TIMESTAMPTZ;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS qc_by        UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS qc_at        TIMESTAMPTZ;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS qc_notes     TEXT;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS accessories  TEXT[];
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS cosmetic_notes TEXT;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS awaiting_parts_since TIMESTAMPTZ;
ALTER TABLE repair_jobs ADD COLUMN IF NOT EXISTS rework_of    UUID REFERENCES repair_jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_customer_ref ON repair_jobs(customer_ref);
CREATE INDEX IF NOT EXISTS idx_jobs_device       ON repair_jobs(device_id);
CREATE INDEX IF NOT EXISTS idx_jobs_priority     ON repair_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_jobs_zone         ON repair_jobs(zone);

-- Audit trail: every status change, who made it and when.
-- Required to compute TAT and First-Time-Fix Rate.
CREATE TABLE IF NOT EXISTS ticket_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
  old_status job_status,
  new_status job_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_log_job ON ticket_status_log(job_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ticket_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'qc',        -- intake | diagnostic | qc
  item TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  checked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_checklist_job ON ticket_checklists(job_id);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,               -- repair_job | customer | rma | invoice
  entity_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  kind TEXT,                               -- intake_photo | diagnostic | qc | signature | document
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

ALTER TABLE ticket_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_status_log"   ON ticket_status_log;
DROP POLICY IF EXISTS "staff_write_status_log"  ON ticket_status_log;
DROP POLICY IF EXISTS "staff_rw_checklists"     ON ticket_checklists;
DROP POLICY IF EXISTS "staff_rw_attachments"    ON attachments;

CREATE POLICY "staff_read_status_log"  ON ticket_status_log FOR SELECT TO authenticated
  USING (public.has_permission('tickets.view_all') OR public.has_permission('tickets.view_assigned'));
CREATE POLICY "staff_write_status_log" ON ticket_status_log FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('tickets.update_any') OR public.has_permission('tickets.update_assigned'));
CREATE POLICY "staff_rw_checklists"    ON ticket_checklists FOR ALL TO authenticated
  USING (public.has_permission('tickets.view_all') OR public.has_permission('tickets.view_assigned'))
  WITH CHECK (public.has_permission('tickets.update_any') OR public.has_permission('tickets.update_assigned'));
CREATE POLICY "staff_rw_attachments"   ON attachments FOR ALL TO authenticated
  USING (public.has_permission('tickets.view_all') OR public.has_permission('tickets.view_assigned'))
  WITH CHECK (public.has_permission('tickets.update_any') OR public.has_permission('tickets.update_assigned'));

-- Replace the transition function to cover the richer lifecycle and to write
-- the audit log in the same transaction as the status change.
CREATE OR REPLACE FUNCTION public.transition_job_status(
  p_job_id UUID, p_new_status job_status, p_user_id UUID, p_note TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_current public.job_status; v_valid BOOLEAN := false;
BEGIN
  SELECT status INTO v_current FROM public.repair_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found: %', p_job_id; END IF;

  IF v_current = p_new_status THEN RETURN true; END IF;

  v_valid := CASE
    WHEN v_current='received'       AND p_new_status IN ('diagnosed','cancelled','on_hold')                THEN true
    WHEN v_current='diagnosed'      AND p_new_status IN ('quoted','cancelled','on_hold')                   THEN true
    WHEN v_current='quoted'         AND p_new_status IN ('approved','cancelled','on_hold')                 THEN true
    WHEN v_current='approved'       AND p_new_status IN ('in_repair','awaiting_parts','cancelled','on_hold')THEN true
    WHEN v_current='awaiting_parts' AND p_new_status IN ('in_repair','cancelled','on_hold')                THEN true
    WHEN v_current='in_repair'      AND p_new_status IN ('qc_check','awaiting_parts','cancelled','on_hold')THEN true
    WHEN v_current='qc_check'       AND p_new_status IN ('ready','in_repair')                              THEN true
    WHEN v_current='ready'          AND p_new_status IN ('delivered')                                      THEN true
    WHEN v_current='on_hold'        AND p_new_status IN ('diagnosed','quoted','approved','in_repair','awaiting_parts','cancelled') THEN true
    ELSE false END;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_current, p_new_status;
  END IF;

  UPDATE public.repair_jobs SET status = p_new_status,
    diagnosed_at         = CASE WHEN p_new_status='diagnosed'      THEN now() ELSE diagnosed_at END,
    quoted_at            = CASE WHEN p_new_status='quoted'         THEN now() ELSE quoted_at END,
    approved_at          = CASE WHEN p_new_status='approved'       THEN now() ELSE approved_at END,
    repair_started_at    = CASE WHEN p_new_status='in_repair'      THEN COALESCE(repair_started_at, now()) ELSE repair_started_at END,
    awaiting_parts_since = CASE WHEN p_new_status='awaiting_parts' THEN now() ELSE awaiting_parts_since END,
    ready_at             = CASE WHEN p_new_status='ready'          THEN now() ELSE ready_at END,
    delivered_at         = CASE WHEN p_new_status='delivered'      THEN now() ELSE delivered_at END,
    cancelled_at         = CASE WHEN p_new_status='cancelled'      THEN now() ELSE cancelled_at END,
    qc_at                = CASE WHEN p_new_status='qc_check'       THEN now() ELSE qc_at END,
    updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO public.ticket_status_log (job_id, old_status, new_status, changed_by, note)
  VALUES (p_job_id, v_current, p_new_status, p_user_id, p_note);

  RETURN true;
END; $$;


-- ============================================================
-- SECTION 6 — INVENTORY EXPANSION
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  payment_terms TEXT,
  rating NUMERIC(2,1),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active) WHERE is_active;

ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS vendor_id     UUID REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 3 CHECK (reorder_level >= 0);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location      TEXT DEFAULT 'main_workshop';
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_serialized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS compatible_brands TEXT[];
CREATE INDEX IF NOT EXISTS idx_inventory_vendor  ON inventory_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder ON inventory_items(quantity, reorder_level);

CREATE TABLE IF NOT EXISTS serialized_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  serial_number TEXT NOT NULL,
  status serial_status NOT NULL DEFAULT 'in_stock',
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  cost_price NUMERIC(10,2),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_at TIMESTAMPTZ,
  warranty_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT serial_unique_per_item UNIQUE (item_id, serial_number)
);
CREATE INDEX IF NOT EXISTS idx_serial_status ON serialized_parts(status);
CREATE INDEX IF NOT EXISTS idx_serial_number ON serialized_parts(serial_number);
CREATE INDEX IF NOT EXISTS idx_serial_job    ON serialized_parts(job_id);

-- Immutable ledger of every stock change. Makes shrinkage traceable.
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  delta INTEGER NOT NULL,
  balance_after INTEGER,
  reason stock_reason NOT NULL,
  ref_type TEXT,
  ref_id UUID,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_moves_item ON stock_movements(item_id, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS po_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT UNIQUE NOT NULL
    DEFAULT 'EXC-PO-' || to_char(now(),'YYYY') || '-' || lpad(nextval('po_number_seq')::text,4,'0'),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  status po_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_at DATE,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);

ALTER TABLE vendors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE serialized_parts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_vendors"    ON vendors;
DROP POLICY IF EXISTS "mgr_manage_vendors"    ON vendors;
DROP POLICY IF EXISTS "staff_view_serials"    ON serialized_parts;
DROP POLICY IF EXISTS "mgr_manage_serials"    ON serialized_parts;
DROP POLICY IF EXISTS "staff_view_moves"      ON stock_movements;
DROP POLICY IF EXISTS "mgr_manage_po"         ON purchase_orders;
DROP POLICY IF EXISTS "mgr_manage_po_items"   ON purchase_order_items;

CREATE POLICY "staff_view_vendors"  ON vendors FOR SELECT TO authenticated
  USING (public.has_permission('inventory.view'));
CREATE POLICY "mgr_manage_vendors"  ON vendors FOR ALL TO authenticated
  USING (public.has_permission('inventory.purchase')) WITH CHECK (public.has_permission('inventory.purchase'));
CREATE POLICY "staff_view_serials"  ON serialized_parts FOR SELECT TO authenticated
  USING (public.has_permission('inventory.view'));
CREATE POLICY "mgr_manage_serials"  ON serialized_parts FOR ALL TO authenticated
  USING (public.has_permission('inventory.adjust')) WITH CHECK (public.has_permission('inventory.adjust'));
CREATE POLICY "staff_view_moves"    ON stock_movements FOR SELECT TO authenticated
  USING (public.has_permission('inventory.view'));
CREATE POLICY "mgr_manage_po"       ON purchase_orders FOR ALL TO authenticated
  USING (public.has_permission('inventory.purchase')) WITH CHECK (public.has_permission('inventory.purchase'));
CREATE POLICY "mgr_manage_po_items" ON purchase_order_items FOR ALL TO authenticated
  USING (public.has_permission('inventory.purchase')) WITH CHECK (public.has_permission('inventory.purchase'));

-- Rewritten allocation: still atomic, now also writes the stock ledger and
-- handles serialised parts.
CREATE OR REPLACE FUNCTION public.allocate_part_to_job(
  p_job_id UUID, p_item_id UUID, p_quantity INTEGER, p_allocated_by UUID,
  p_serial_id UUID DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_available INTEGER; v_unit_price NUMERIC(10,2);
        v_allocation_id UUID; v_job_status public.job_status;
        v_is_serialized BOOLEAN; v_new_balance INTEGER;
BEGIN
  SELECT status INTO v_job_status FROM public.repair_jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Job not found: %', p_job_id; END IF;
  IF v_job_status NOT IN ('approved','in_repair','awaiting_parts') THEN
    RAISE EXCEPTION 'Cannot allocate parts to a job with status %', v_job_status;
  END IF;

  SELECT quantity, selling_price, is_serialized
    INTO v_available, v_unit_price, v_is_serialized
  FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventory item not found: %', p_item_id; END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, requested: %', v_available, p_quantity;
  END IF;

  IF v_is_serialized THEN
    IF p_serial_id IS NULL THEN
      RAISE EXCEPTION 'This item is serialised — a specific unit must be selected';
    END IF;
    UPDATE public.serialized_parts
      SET status='installed', job_id=p_job_id, installed_at=now(), updated_at=now()
      WHERE id = p_serial_id AND item_id = p_item_id AND status IN ('in_stock','reserved');
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Serial unit unavailable or does not belong to this item';
    END IF;
  END IF;

  UPDATE public.inventory_items
    SET quantity = quantity - p_quantity, updated_at = now()
    WHERE id = p_item_id
    RETURNING quantity INTO v_new_balance;

  INSERT INTO public.job_parts_allocated (job_id,item_id,quantity,unit_price,allocated_by)
  VALUES (p_job_id,p_item_id,p_quantity,v_unit_price,p_allocated_by)
  RETURNING id INTO v_allocation_id;

  INSERT INTO public.stock_movements (item_id,delta,balance_after,reason,ref_type,ref_id,actor_id)
  VALUES (p_item_id, -p_quantity, v_new_balance, 'job_allocation', 'repair_job', p_job_id, p_allocated_by);

  RETURN v_allocation_id;
END; $$;


-- ============================================================
-- SECTION 7 — BILLING, WARRANTY, RMA, AMC
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_ref     UUID REFERENCES customers(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deposit_applied  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_applied >= 0);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid      NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS place_of_supply  TEXT DEFAULT 'Delhi';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_gstin   TEXT;
CREATE INDEX IF NOT EXISTS idx_invoices_customer_ref ON invoices(customer_ref);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method payment_method NOT NULL,
  reference TEXT,
  is_deposit BOOLEAN NOT NULL DEFAULT false,
  received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_job     ON payments(job_id);

CREATE TABLE IF NOT EXISTS warranty_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  serialized_part_id UUID REFERENCES serialized_parts(id) ON DELETE SET NULL,
  service_key TEXT,
  description TEXT,
  months INTEGER NOT NULL DEFAULT 3,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE NOT NULL,
  is_void BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_warranty_customer ON warranty_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_ends     ON warranty_records(ends_on);

CREATE SEQUENCE IF NOT EXISTS rma_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS rma_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number TEXT UNIQUE NOT NULL
    DEFAULT 'EXC-RMA-' || to_char(now(),'YYYY') || '-' || lpad(nextval('rma_number_seq')::text,4,'0'),
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  serialized_part_id UUID REFERENCES serialized_parts(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  reason TEXT NOT NULL,
  status rma_status NOT NULL DEFAULT 'open',
  credit_amount NUMERIC(10,2),
  resolution TEXT,
  opened_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_rma_status ON rma_tickets(status);

CREATE SEQUENCE IF NOT EXISTS amc_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS amc_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL
    DEFAULT 'EXC-AMC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('amc_number_seq')::text,4,'0'),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  devices_covered INTEGER NOT NULL DEFAULT 1 CHECK (devices_covered > 0),
  scope TEXT,
  contract_value NUMERIC(12,2) NOT NULL CHECK (contract_value >= 0),
  billing_cycle TEXT NOT NULL DEFAULT 'annual',
  visits_included INTEGER NOT NULL DEFAULT 4,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status amc_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT amc_dates_valid CHECK (ends_on > starts_on)
);
CREATE INDEX IF NOT EXISTS idx_amc_customer ON amc_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_amc_status   ON amc_contracts(status);

CREATE TABLE IF NOT EXISTS amc_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES amc_contracts(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amc_visits_contract ON amc_visits(contract_id);

ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rma_tickets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE amc_contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE amc_visits       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_rw_payments"   ON payments;
DROP POLICY IF EXISTS "staff_rw_warranty"   ON warranty_records;
DROP POLICY IF EXISTS "staff_rw_rma"        ON rma_tickets;
DROP POLICY IF EXISTS "staff_rw_amc"        ON amc_contracts;
DROP POLICY IF EXISTS "staff_rw_amc_visits" ON amc_visits;

CREATE POLICY "staff_rw_payments"   ON payments FOR ALL TO authenticated
  USING (public.has_permission('billing.create')) WITH CHECK (public.has_permission('billing.create'));
CREATE POLICY "staff_rw_warranty"   ON warranty_records FOR ALL TO authenticated
  USING (public.has_permission('tickets.view_all')) WITH CHECK (public.has_permission('tickets.update_any'));
CREATE POLICY "staff_rw_rma"        ON rma_tickets FOR ALL TO authenticated
  USING (public.has_permission('inventory.view')) WITH CHECK (public.has_permission('inventory.adjust'));
CREATE POLICY "staff_rw_amc"        ON amc_contracts FOR ALL TO authenticated
  USING (public.has_permission('customers.view_full')) WITH CHECK (public.has_permission('customers.manage'));
CREATE POLICY "staff_rw_amc_visits" ON amc_visits FOR ALL TO authenticated
  USING (public.has_permission('tickets.view_all')) WITH CHECK (public.has_permission('tickets.update_any'));


-- ============================================================
-- SECTION 8 — AI AGENT (grounded, fully audited)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surface ai_surface NOT NULL,
  channel msg_channel,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone TEXT,
  session_state bot_state NOT NULL DEFAULT 'active',
  assigned_staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalation_reason TEXT,
  escalated_at TIMESTAMPTZ,
  language TEXT DEFAULT 'en',
  title TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_conv_phone   ON ai_conversations(phone);
CREATE INDEX IF NOT EXISTS idx_ai_conv_state   ON ai_conversations(session_state);
CREATE INDEX IF NOT EXISTS idx_ai_conv_surface ON ai_conversations(surface);
CREATE INDEX IF NOT EXISTS idx_ai_conv_staff   ON ai_conversations(staff_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role ai_role NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  latency_ms INTEGER,
  was_escalated BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON ai_messages(conversation_id, created_at);

-- Every tool the agent invokes is recorded with its arguments and result, so any
-- answer it gave can be reconstructed and audited. This is what makes the
-- grounding claim verifiable rather than aspirational.
CREATE TABLE IF NOT EXISTS ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES ai_messages(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  arguments JSONB,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_tool_conv ON ai_tool_calls(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_tool_name ON ai_tool_calls(tool_name);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_calls    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_view_conv"      ON ai_conversations;
DROP POLICY IF EXISTS "staff_manage_conv"    ON ai_conversations;
DROP POLICY IF EXISTS "own_copilot_conv"     ON ai_conversations;
DROP POLICY IF EXISTS "staff_view_ai_msgs"   ON ai_messages;
DROP POLICY IF EXISTS "staff_view_tools"     ON ai_tool_calls;

CREATE POLICY "staff_view_conv"   ON ai_conversations FOR SELECT TO authenticated
  USING (public.has_permission('conversations.view'));
CREATE POLICY "staff_manage_conv" ON ai_conversations FOR UPDATE TO authenticated
  USING (public.has_permission('conversations.takeover'))
  WITH CHECK (public.has_permission('conversations.takeover'));
-- A staff member always sees their own admin-copilot threads
CREATE POLICY "own_copilot_conv"  ON ai_conversations FOR ALL TO authenticated
  USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
CREATE POLICY "staff_view_ai_msgs" ON ai_messages FOR SELECT TO authenticated
  USING (public.has_permission('conversations.view')
      OR EXISTS (SELECT 1 FROM ai_conversations c
                 WHERE c.id = conversation_id AND c.staff_id = auth.uid()));
CREATE POLICY "staff_view_tools"   ON ai_tool_calls FOR SELECT TO authenticated
  USING (public.has_permission('conversations.view')
      OR EXISTS (SELECT 1 FROM ai_conversations c
                 WHERE c.id = conversation_id AND c.staff_id = auth.uid()));


-- ============================================================
-- SECTION 9 — COMMS, WORKFORCE, CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  channel msg_channel NOT NULL DEFAULT 'whatsapp',
  language TEXT NOT NULL DEFAULT 'en',
  body TEXT NOT NULL,
  variables TEXT[],
  provider_template_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO message_templates (key, name, channel, body, variables) VALUES
  ('job_received','Job received','whatsapp',
   'Hi {{name}}, we have received your {{brand}} {{device}} at Exeller Computer. Job card: {{job_card}}. Track it here: {{track_url}}',
   ARRAY['name','brand','device','job_card','track_url']),
  ('quote_ready','Estimate ready','whatsapp',
   'Hi {{name}}, the estimate for job {{job_card}} is ready: {{amount}}. Review and approve here: {{quote_url}}',
   ARRAY['name','job_card','amount','quote_url']),
  ('awaiting_parts','Awaiting parts','whatsapp',
   'Hi {{name}}, job {{job_card}} is waiting on a part. Expected by {{eta}}. We will update you as soon as it arrives.',
   ARRAY['name','job_card','eta']),
  ('ready_for_pickup','Ready for pickup','whatsapp',
   'Good news {{name}} — your {{brand}} {{device}} is ready. Job {{job_card}}. Amount due: {{amount}}. Pay here: {{pay_url}}',
   ARRAY['name','brand','device','job_card','amount','pay_url']),
  ('delivered_feedback','Post-delivery feedback','whatsapp',
   'Hi {{name}}, hope your {{device}} is running well. Warranty valid until {{warranty_until}}. Mind leaving us a quick review? {{review_url}}',
   ARRAY['name','device','warranty_until','review_url']),
  ('human_takeover','Human takeover notice','whatsapp',
   'Thanks {{name}} — connecting you with our team now. Someone will reply shortly.',
   ARRAY['name'])
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel msg_channel NOT NULL,
  direction msg_direction NOT NULL,
  to_address TEXT,
  from_address TEXT,
  template_key TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_message_id TEXT,
  error TEXT,
  entity_type TEXT,
  entity_id UUID,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msglog_created ON message_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msglog_entity  ON message_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES repair_jobs(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'shift',    -- shift | break | job_work
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NULL THEN NULL
         ELSE (EXTRACT(EPOCH FROM (ended_at - started_at)) / 60)::INTEGER END
  ) STORED,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_timelogs_staff ON time_logs(staff_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_timelogs_job   ON time_logs(job_id);

CREATE TABLE IF NOT EXISTS service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL DEFAULT 'New Delhi',
  state TEXT NOT NULL DEFAULT 'Delhi',
  pincodes TEXT[],
  is_doorstep_available BOOLEAN NOT NULL DEFAULT true,
  travel_fee NUMERIC(10,2) DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO service_zones (name, slug, city, pincodes, sort_order) VALUES
  ('Dwarka Mor',  'dwarka-mor',  'New Delhi', ARRAY['110059','110045'], 1),
  ('Dwarka',      'dwarka',      'New Delhi', ARRAY['110075','110077','110078'], 2),
  ('Uttam Nagar', 'uttam-nagar', 'New Delhi', ARRAY['110059'], 3),
  ('Janakpuri',   'janakpuri',   'New Delhi', ARRAY['110058'], 4),
  ('Najafgarh',   'najafgarh',   'New Delhi', ARRAY['110043'], 5),
  ('Malviya Nagar','malviya-nagar','New Delhi', ARRAY['110017'], 6),
  ('Gurgaon',     'gurgaon',     'Gurgaon',   ARRAY['122001','122002','122018'], 7),
  ('Noida',       'noida',       'Noida',     ARRAY['201301','201304'], 8)
ON CONFLICT (slug) DO NOTHING;

-- Business configuration. Keeps GST number and tax rates out of source code.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value, description) VALUES
  ('business.legal_name', '"Exeller Infosolutions LLP"'::jsonb, 'Legal name printed on tax invoices — MUST match GST registration'),
  ('business.trade_name', '"Exeller Computer"'::jsonb,          'Customer-facing brand name'),
  ('business.gstin',      '""'::jsonb,                          'GSTIN — required on tax invoices'),
  ('business.phone',      '"+919718828173"'::jsonb,             'Primary business phone'),
  ('business.whatsapp',   '"919718828173"'::jsonb,              'WhatsApp number in wa.me format'),
  ('business.email',      '"info@exellercomputer.com"'::jsonb,  'Primary business email'),
  ('business.address',    '{"street":"Opp. Dwarka Mor Metro Station Gate No. 2","area":"Sewak Park","city":"New Delhi","state":"Delhi","pincode":"110059","country":"India"}'::jsonb, 'Registered address'),
  ('tax.cgst_rate',       '9'::jsonb,   'CGST % for intra-state supply'),
  ('tax.sgst_rate',       '9'::jsonb,   'SGST % for intra-state supply'),
  ('tax.igst_rate',       '18'::jsonb,  'IGST % for inter-state supply'),
  ('tax.home_state',      '"Delhi"'::jsonb, 'Home state — determines intra vs inter-state'),
  ('ops.default_warranty_months', '3'::jsonb, 'Default warranty when a service does not specify one'),
  ('ops.tat_target_hours_modular', '24'::jsonb, 'TAT target for modular repairs'),
  ('ops.tat_target_hours_chiplevel','48'::jsonb,'TAT target for chip-level repairs'),
  ('ai.escalate_on_discount_request', 'true'::jsonb, 'Hand off to a human when a discount is requested'),
  ('ai.min_confidence', '0.6'::jsonb, 'Below this confidence the agent escalates instead of answering')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_zones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_templates"  ON message_templates;
DROP POLICY IF EXISTS "admin_manage_templates"ON message_templates;
DROP POLICY IF EXISTS "staff_read_msglog"     ON message_log;
DROP POLICY IF EXISTS "self_manage_timelogs"  ON time_logs;
DROP POLICY IF EXISTS "mgr_manage_timelogs"   ON time_logs;
DROP POLICY IF EXISTS "public_read_zones"     ON service_zones;
DROP POLICY IF EXISTS "admin_manage_zones"    ON service_zones;
DROP POLICY IF EXISTS "staff_read_settings"   ON app_settings;
DROP POLICY IF EXISTS "admin_manage_settings" ON app_settings;

CREATE POLICY "staff_read_templates"   ON message_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_templates" ON message_templates FOR ALL TO authenticated
  USING (public.has_permission('settings.manage')) WITH CHECK (public.has_permission('settings.manage'));
CREATE POLICY "staff_read_msglog"      ON message_log FOR SELECT TO authenticated
  USING (public.has_permission('conversations.view'));
CREATE POLICY "self_manage_timelogs"   ON time_logs FOR ALL TO authenticated
  USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
CREATE POLICY "mgr_manage_timelogs"    ON time_logs FOR ALL TO authenticated
  USING (public.has_permission('attendance.manage_all'))
  WITH CHECK (public.has_permission('attendance.manage_all'));
-- Public: location landing pages are anonymous-readable
CREATE POLICY "public_read_zones"      ON service_zones FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admin_manage_zones"     ON service_zones FOR ALL TO authenticated
  USING (public.has_permission('settings.manage')) WITH CHECK (public.has_permission('settings.manage'));
CREATE POLICY "staff_read_settings"    ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_settings"  ON app_settings FOR ALL TO authenticated
  USING (public.has_permission('settings.manage')) WITH CHECK (public.has_permission('settings.manage'));


-- ============================================================
-- SECTION 10 — updated_at TRIGGERS ON NEW TABLES
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','devices','leads','service_catalog','vendors','serialized_parts',
    'purchase_orders','amc_contracts','ai_conversations','message_templates'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; '
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
  END LOOP;
END $$;


-- ============================================================
-- SECTION 11 — OPERATIONAL REPORTING VIEWS
-- ============================================================
-- security_invoker so these respect the querying user's RLS.

CREATE OR REPLACE VIEW v_low_stock WITH (security_invoker = true) AS
SELECT i.id, i.sku, i.name, i.category, i.brand, i.quantity, i.reorder_level,
       i.selling_price, v.name AS vendor_name, v.phone AS vendor_phone
FROM inventory_items i
LEFT JOIN vendors v ON v.id = i.vendor_id
WHERE i.quantity <= i.reorder_level;

CREATE OR REPLACE VIEW v_job_turnaround WITH (security_invoker = true) AS
SELECT j.id, j.job_card_number, j.status, j.priority, j.mode,
       j.received_at, j.ready_at, j.delivered_at,
       ROUND(EXTRACT(EPOCH FROM (COALESCE(j.ready_at, now()) - j.received_at)) / 3600.0, 1)
         AS hours_to_ready,
       (j.ready_at IS NULL AND j.status NOT IN ('delivered','cancelled')) AS is_open,
       j.promised_at,
       (j.promised_at IS NOT NULL AND j.ready_at IS NULL AND now() > j.promised_at) AS is_overdue
FROM repair_jobs j;

CREATE OR REPLACE VIEW v_job_profitability WITH (security_invoker = true) AS
SELECT j.id, j.job_card_number, j.final_cost,
       COALESCE(SUM(a.quantity * i.cost_price), 0) AS parts_cost,
       j.final_cost - COALESCE(SUM(a.quantity * i.cost_price), 0) AS gross_profit,
       CASE WHEN COALESCE(j.final_cost,0) > 0
            THEN ROUND(((j.final_cost - COALESCE(SUM(a.quantity * i.cost_price),0))
                        / j.final_cost * 100)::numeric, 1)
            ELSE NULL END AS margin_pct
FROM repair_jobs j
LEFT JOIN job_parts_allocated a ON a.job_id = j.id
LEFT JOIN inventory_items i     ON i.id = a.item_id
GROUP BY j.id, j.job_card_number, j.final_cost;


SELECT 'Part B complete. Platform schema installed.' AS status;
