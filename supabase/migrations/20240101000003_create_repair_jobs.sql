-- Repair jobs table
-- Implements the full repair lifecycle with status tracking

-- Sequence for job card numbers
CREATE SEQUENCE job_card_number_seq START WITH 1001;

CREATE TABLE repair_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_number TEXT UNIQUE NOT NULL DEFAULT 'EXC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('job_card_number_seq')::text, 4, '0'),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  device_type TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  device_model TEXT,
  serial_number TEXT,
  reported_fault TEXT NOT NULL,
  diagnosis TEXT,
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  status job_status NOT NULL DEFAULT 'received',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  diagnosed_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  repair_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_repair_jobs_status ON repair_jobs(status);
CREATE INDEX idx_repair_jobs_customer ON repair_jobs(customer_id);
CREATE INDEX idx_repair_jobs_technician ON repair_jobs(technician_id);
CREATE INDEX idx_repair_jobs_card_number ON repair_jobs(job_card_number);
CREATE INDEX idx_repair_jobs_created ON repair_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE repair_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "admin_full_access_jobs"
  ON repair_jobs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Technicians: read and update assigned jobs
CREATE POLICY "technicians_read_assigned_jobs"
  ON repair_jobs
  FOR SELECT
  TO authenticated
  USING (public.is_technician() AND technician_id = auth.uid());

CREATE POLICY "technicians_update_assigned_jobs"
  ON repair_jobs
  FOR UPDATE
  TO authenticated
  USING (public.is_technician() AND technician_id = auth.uid())
  WITH CHECK (public.is_technician() AND technician_id = auth.uid());

-- Customers: read own jobs
CREATE POLICY "customers_read_own_jobs"
  ON repair_jobs
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Status transition validation function
CREATE OR REPLACE FUNCTION public.transition_job_status(
  p_job_id UUID,
  p_new_status job_status,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_current_status public.job_status;
  v_valid BOOLEAN := false;
BEGIN
  -- Get current status with lock
  SELECT status INTO v_current_status
  FROM public.repair_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- Validate transition
  v_valid := CASE
    WHEN v_current_status = 'received' AND p_new_status IN ('diagnosed', 'cancelled') THEN true
    WHEN v_current_status = 'diagnosed' AND p_new_status IN ('quoted', 'cancelled') THEN true
    WHEN v_current_status = 'quoted' AND p_new_status IN ('approved', 'cancelled') THEN true
    WHEN v_current_status = 'approved' AND p_new_status IN ('in_repair', 'cancelled') THEN true
    WHEN v_current_status = 'in_repair' AND p_new_status IN ('ready', 'cancelled') THEN true
    WHEN v_current_status = 'ready' AND p_new_status = 'delivered' THEN true
    ELSE false
  END;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', v_current_status, p_new_status;
  END IF;

  -- Perform the update with timestamp
  UPDATE public.repair_jobs
  SET
    status = p_new_status,
    diagnosed_at = CASE WHEN p_new_status = 'diagnosed' THEN now() ELSE diagnosed_at END,
    quoted_at = CASE WHEN p_new_status = 'quoted' THEN now() ELSE quoted_at END,
    approved_at = CASE WHEN p_new_status = 'approved' THEN now() ELSE approved_at END,
    repair_started_at = CASE WHEN p_new_status = 'in_repair' THEN now() ELSE repair_started_at END,
    ready_at = CASE WHEN p_new_status = 'ready' THEN now() ELSE ready_at END,
    delivered_at = CASE WHEN p_new_status = 'delivered' THEN now() ELSE delivered_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
    updated_at = now()
  WHERE id = p_job_id;

  RETURN true;
END;
$$;

-- Updated_at trigger
CREATE TRIGGER update_repair_jobs_updated_at
  BEFORE UPDATE ON repair_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
