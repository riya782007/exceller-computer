-- Owner access-code console support.
-- Run this after migrations 00000 through 00010.
--
-- The owner signs in to the console with a single access code instead of a
-- provisioned Supabase account, so server-side writes have no `profiles.id` to
-- attribute. These columns therefore record "who" only when a real staff
-- account exists, and stay NULL for owner-console actions.

ALTER TABLE public.business_assets
  ALTER COLUMN created_by DROP NOT NULL;

-- job_parts_allocated.allocated_by has the same constraint for the same reason.
ALTER TABLE public.job_parts_allocated
  ALTER COLUMN allocated_by DROP NOT NULL;

SELECT 'Owner access-code attribution columns relaxed.' AS status;
