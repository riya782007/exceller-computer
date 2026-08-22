-- Public visitor-agent offers, revocable owner-curated imagery, and a shared
-- public-chat quota. Run this only after migrations 00000 through 00009.
-- Customer/job images and the private `business-assets` bucket remain private.

CREATE TABLE IF NOT EXISTS public.public_agent_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 2 AND 500),
  price_note TEXT CHECK (price_note IS NULL OR char_length(price_note) <= 160),
  image_url TEXT CHECK (image_url IS NULL OR image_url ~ '^https://'),
  image_path TEXT,
  payment_url TEXT CHECK (payment_url IS NULL OR payment_url ~ '^https://'),
  service_slug TEXT CHECK (service_slug IS NULL OR char_length(service_slug) <= 120),
  cta_label TEXT NOT NULL DEFAULT 'View details' CHECK (char_length(cta_label) BETWEEN 2 AND 50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 100 CHECK (sort_order BETWEEN 0 AND 10000),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safe if an early draft of this migration was applied before `image_path` was
-- introduced. It lets the application remove old public objects on replacement.
ALTER TABLE public.public_agent_offers ADD COLUMN IF NOT EXISTS image_path TEXT;

CREATE INDEX IF NOT EXISTS idx_public_agent_offers_active_sort
  ON public.public_agent_offers (is_active, sort_order, created_at DESC);

ALTER TABLE public.public_agent_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active visitor offers" ON public.public_agent_offers;
CREATE POLICY "Public can read active visitor offers"
  ON public.public_agent_offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage visitor offers" ON public.public_agent_offers;
CREATE POLICY "Admins manage visitor offers"
  ON public.public_agent_offers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- A distinct public bucket is intentional: only owner-approved marketing and
-- offer images may go here. The existing `business-assets` bucket stays private.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-agent-media',
  'public-agent-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view public agent images" ON storage.objects;
CREATE POLICY "Public can view public agent images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'public-agent-media');

DROP POLICY IF EXISTS "Admins manage public agent images" ON storage.objects;
CREATE POLICY "Admins manage public agent images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'public-agent-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'public-agent-media' AND public.is_admin());

-- Distributed, atomic quota enforcement for the paid anonymous AI endpoint.
-- The application stores only a salted SHA-256 digest of the source address.
CREATE TABLE IF NOT EXISTS public.public_agent_rate_limits (
  key_hash TEXT PRIMARY KEY CHECK (char_length(key_hash) = 64),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_agent_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.public_agent_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_public_agent_rate_limit(
  p_key_hash TEXT,
  p_max_requests INTEGER DEFAULT 12
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed BOOLEAN;
BEGIN
  -- Keeps only a salted anonymous quota digest for a short operational window.
  DELETE FROM public.public_agent_rate_limits
  WHERE updated_at < now() - interval '1 day';

  IF char_length(p_key_hash) <> 64 OR p_max_requests < 1 OR p_max_requests > 60 THEN
    RAISE EXCEPTION 'Invalid public chat rate-limit request';
  END IF;

  INSERT INTO public.public_agent_rate_limits (key_hash, window_started_at, request_count, updated_at)
  VALUES (p_key_hash, now(), 1, now())
  ON CONFLICT (key_hash) DO UPDATE
  SET window_started_at = CASE
        WHEN public.public_agent_rate_limits.window_started_at <= now() - interval '1 minute' THEN now()
        ELSE public.public_agent_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN public.public_agent_rate_limits.window_started_at <= now() - interval '1 minute' THEN 1
        ELSE public.public_agent_rate_limits.request_count + 1
      END,
      updated_at = now()
  RETURNING request_count <= p_max_requests INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_public_agent_rate_limit(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_public_agent_rate_limit(TEXT, INTEGER) TO service_role;
