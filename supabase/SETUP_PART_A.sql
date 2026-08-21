-- ============================================================
-- EXELLER PLATFORM — SETUP PART A  (enum extensions)
-- ============================================================
-- RUN THIS FIRST, AS ITS OWN QUERY, THEN RUN PART B SEPARATELY.
--
-- Why separate: PostgreSQL does not allow a value added by
-- ALTER TYPE ... ADD VALUE to be *referenced* in the same
-- transaction. Part B's functions reference these new statuses,
-- so the two must be committed independently.
--
-- Safe to re-run (IF NOT EXISTS on every value).
-- ============================================================

-- Richer repair lifecycle from the operational workflow:
-- intake -> diagnosing -> awaiting approval -> awaiting parts
--        -> in repair -> QC -> ready -> delivered
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'awaiting_parts';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'qc_check';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'on_hold';

-- Staff roles from the RBAC matrix. Kept as a coarse bucket;
-- fine-grained access is handled by the permissions tables in Part B.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'store_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'counter_staff';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'field_engineer';

-- Confirm
SELECT 'Part A complete. Now run Part B.' AS status;
