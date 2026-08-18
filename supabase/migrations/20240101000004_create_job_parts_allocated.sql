-- Job parts allocation table
-- Links repair jobs to inventory items consumed during repair
-- Allocation is performed atomically via PostgreSQL function

CREATE TABLE job_parts_allocated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES repair_jobs(id) ON DELETE RESTRICT,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  allocated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_job_parts_job ON job_parts_allocated(job_id);
CREATE INDEX idx_job_parts_item ON job_parts_allocated(item_id);

-- Enable RLS
ALTER TABLE job_parts_allocated ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "admin_full_access_allocations"
  ON job_parts_allocated
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Technicians: read and create allocations for their jobs
CREATE POLICY "technicians_read_allocations"
  ON job_parts_allocated
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'technician'
    )
    AND EXISTS (
      SELECT 1 FROM repair_jobs j WHERE j.id = job_id AND j.technician_id = auth.uid()
    )
  );

CREATE POLICY "technicians_create_allocations"
  ON job_parts_allocated
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'technician'
    )
    AND allocated_by = auth.uid()
  );

-- Atomic part allocation function
-- This ensures stock check + allocation + deduction happen in one transaction
CREATE OR REPLACE FUNCTION public.allocate_part_to_job(
  p_job_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_allocated_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_available INTEGER;
  v_unit_price NUMERIC(10,2);
  v_allocation_id UUID;
  v_job_status public.job_status;
BEGIN
  -- Verify job exists and is in a valid state for allocation
  SELECT status INTO v_job_status
  FROM public.repair_jobs
  WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF v_job_status NOT IN ('approved', 'in_repair') THEN
    RAISE EXCEPTION 'Cannot allocate parts to job in status: %', v_job_status;
  END IF;

  -- Lock the inventory item row and check available quantity
  SELECT quantity, selling_price INTO v_available, v_unit_price
  FROM public.inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found: %', p_item_id;
  END IF;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_available, p_quantity;
  END IF;

  -- Deduct inventory
  UPDATE public.inventory_items
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE id = p_item_id;

  -- Create allocation record
  INSERT INTO public.job_parts_allocated (job_id, item_id, quantity, unit_price, allocated_by)
  VALUES (p_job_id, p_item_id, p_quantity, v_unit_price, p_allocated_by)
  RETURNING id INTO v_allocation_id;

  RETURN v_allocation_id;
END;
$$;
