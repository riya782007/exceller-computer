-- Operational hardening: non-recursive RLS, audited job transitions,
-- low-stock thresholds, chat context, invoice storage, authorized RPCs.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- Role lookup used by RLS. Must NOT query profiles from a profiles policy
-- without going through this SECURITY DEFINER function (avoids recursion).
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Never take role from user-editable JWT metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    'customer'
  );
  RETURN NEW;
END;
$$;

-- Unique phone when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- Replace recursive profiles policies
DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "technicians_read_customers" ON public.profiles;

CREATE POLICY "admin_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "technicians_read_customers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND role = 'customer'
  );

-- Users cannot escalate their own role
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = public.current_user_role()
  );

-- Inventory / jobs / invoices / chat: replace EXISTS(profiles) with helper
DROP POLICY IF EXISTS "admin_full_access_inventory" ON public.inventory_items;
CREATE POLICY "admin_full_access_inventory"
  ON public.inventory_items
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "technicians_read_inventory" ON public.inventory_items;
CREATE POLICY "technicians_read_inventory"
  ON public.inventory_items
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'technician');

DROP POLICY IF EXISTS "admin_full_access_jobs" ON public.repair_jobs;
CREATE POLICY "admin_full_access_jobs"
  ON public.repair_jobs
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "technicians_read_assigned_jobs" ON public.repair_jobs;
DROP POLICY IF EXISTS "technicians_update_assigned_jobs" ON public.repair_jobs;

CREATE POLICY "technicians_read_jobs"
  ON public.repair_jobs
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND technician_id = auth.uid()
  );

CREATE POLICY "technicians_update_assigned_jobs"
  ON public.repair_jobs
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND technician_id = auth.uid()
  )
  WITH CHECK (
    public.current_user_role() = 'technician'
    AND technician_id = auth.uid()
  );

CREATE POLICY "staff_insert_jobs"
  ON public.repair_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'technician'));

DROP POLICY IF EXISTS "admin_full_access_allocations" ON public.job_parts_allocated;
CREATE POLICY "admin_full_access_allocations"
  ON public.job_parts_allocated
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "technicians_read_allocations" ON public.job_parts_allocated;
DROP POLICY IF EXISTS "technicians_create_allocations" ON public.job_parts_allocated;

CREATE POLICY "technicians_read_allocations"
  ON public.job_parts_allocated
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND EXISTS (
      SELECT 1 FROM public.repair_jobs j
      WHERE j.id = job_id AND j.technician_id = auth.uid()
    )
  );

CREATE POLICY "technicians_create_allocations"
  ON public.job_parts_allocated
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() = 'technician'
    AND allocated_by = auth.uid()
  );

DROP POLICY IF EXISTS "admin_full_access_invoices" ON public.invoices;
CREATE POLICY "admin_full_access_invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_full_access_invoice_items" ON public.invoice_items;
CREATE POLICY "admin_full_access_invoice_items"
  ON public.invoice_items
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "technicians_read_job_invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() = 'technician'
    AND job_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.repair_jobs j
      WHERE j.id = invoices.job_id AND j.technician_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "admin_full_access_chat_sessions" ON public.chat_sessions;
CREATE POLICY "admin_full_access_chat_sessions"
  ON public.chat_sessions
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "technicians_read_chat_sessions" ON public.chat_sessions;
CREATE POLICY "technicians_read_chat_sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'technician'));

-- Inventory low-stock threshold (notifications later)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 2
  CHECK (low_stock_threshold >= 0);

-- Chat context for the WhatsApp agent
ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS context_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Payment refunded (spec)
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'refunded';

-- Auditable job transitions
CREATE TABLE IF NOT EXISTS public.job_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.repair_jobs(id) ON DELETE CASCADE,
  from_status public.job_status,
  to_status public.job_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_status_events_job ON public.job_status_events(job_id, created_at DESC);

ALTER TABLE public.job_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_job_events"
  ON public.job_status_events
  FOR ALL
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "staff_read_job_events"
  ON public.job_status_events
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('admin', 'technician')
    AND EXISTS (
      SELECT 1 FROM public.repair_jobs j
      WHERE j.id = job_id
        AND (
          public.current_user_role() = 'admin'
          OR j.technician_id = auth.uid()
        )
    )
  );

CREATE POLICY "customers_read_own_job_events"
  ON public.job_status_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.repair_jobs j
      WHERE j.id = job_id AND j.customer_id = auth.uid()
    )
  );

CREATE POLICY "staff_insert_job_events"
  ON public.job_status_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('admin', 'technician')
    AND changed_by = auth.uid()
  );

CREATE OR REPLACE FUNCTION public.transition_job_status(
  p_job_id UUID,
  p_new_status public.job_status,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status public.job_status;
  v_technician_id UUID;
  v_valid BOOLEAN := false;
  v_role public.user_role;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'User mismatch';
  END IF;

  v_role := public.current_user_role();

  SELECT status, technician_id
    INTO v_current_status, v_technician_id
  FROM public.repair_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF auth.role() <> 'service_role' THEN
    IF v_role = 'admin' THEN
      NULL;
    ELSIF v_role = 'technician' AND v_technician_id = auth.uid() THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Not authorized to transition this job';
    END IF;
  END IF;

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

  INSERT INTO public.job_status_events (job_id, from_status, to_status, changed_by)
  VALUES (p_job_id, v_current_status, p_new_status, p_user_id);

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.allocate_part_to_job(
  p_job_id UUID,
  p_item_id UUID,
  p_quantity INTEGER,
  p_allocated_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_unit_price NUMERIC(10,2);
  v_allocation_id UUID;
  v_job_status public.job_status;
  v_technician_id UUID;
  v_role public.user_role;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;

  IF p_allocated_by IS DISTINCT FROM auth.uid() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'User mismatch';
  END IF;

  v_role := public.current_user_role();

  SELECT status, technician_id INTO v_job_status, v_technician_id
  FROM public.repair_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  IF auth.role() <> 'service_role' THEN
    IF v_role = 'admin' THEN
      NULL;
    ELSIF v_role = 'technician' AND v_technician_id = auth.uid() THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Not authorized to allocate parts to this job';
    END IF;
  END IF;

  IF v_job_status NOT IN ('approved', 'in_repair') THEN
    RAISE EXCEPTION 'Cannot allocate parts to job in status: %', v_job_status;
  END IF;

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

  UPDATE public.inventory_items
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE id = p_item_id;

  INSERT INTO public.job_parts_allocated (job_id, item_id, quantity, unit_price, allocated_by)
  VALUES (p_job_id, p_item_id, p_quantity, v_unit_price, p_allocated_by)
  RETURNING id INTO v_allocation_id;

  RETURN v_allocation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_job_status(UUID, public.job_status, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_part_to_job(UUID, UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated;

-- Private invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "admin_read_invoice_pdfs" ON storage.objects;
CREATE POLICY "admin_read_invoice_pdfs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices'
    AND public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "service_write_invoice_pdfs" ON storage.objects;
-- Uploads go through the service role from Next.js server actions.
