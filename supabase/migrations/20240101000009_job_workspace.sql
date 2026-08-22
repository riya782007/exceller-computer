-- Repair-job workspace lifecycle guard.
-- Requires 20240101000000 through 20240101000008 to have been applied first.

CREATE OR REPLACE FUNCTION public.transition_job_status(
  p_job_id UUID,
  p_new_status public.job_status,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_status public.job_status;
  v_valid BOOLEAN := false;
BEGIN
  SELECT status
  INTO v_current_status
  FROM public.repair_jobs
  WHERE id = p_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
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

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transition_job_status(UUID, public.job_status, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_job_status(UUID, public.job_status, UUID) TO authenticated;

SELECT 'Repair-job workspace lifecycle function installed.' AS status;
