-- Inventory items table
-- Supports: parts, refurbished laptops, accessories
-- CRITICAL: quantity >= 0 enforced by CHECK constraint

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category inventory_category NOT NULL,
  brand TEXT,
  model TEXT,
  cost_price NUMERIC(10,2) NOT NULL CHECK (cost_price >= 0),
  selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  hsn_sac TEXT,
  specifications JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  condition TEXT,
  warranty_months INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_brand ON inventory_items(brand);
CREATE INDEX idx_inventory_public ON inventory_items(is_public) WHERE is_public = true;
CREATE INDEX idx_inventory_quantity ON inventory_items(quantity) WHERE quantity > 0;

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "admin_full_access_inventory"
  ON inventory_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Technicians: read access
CREATE POLICY "technicians_read_inventory"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (public.is_technician());

-- Public: read items marked as public with stock > 0
CREATE POLICY "public_read_inventory"
  ON inventory_items
  FOR SELECT
  TO anon
  USING (is_public = true AND quantity > 0);

-- Authenticated users can also see public items
CREATE POLICY "authenticated_read_public_inventory"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (is_public = true AND quantity > 0);

-- Updated_at trigger
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
