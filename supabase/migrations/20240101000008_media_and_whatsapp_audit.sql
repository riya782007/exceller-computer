-- Media library and WhatsApp inbound event audit.
-- This migration keeps customer media private and makes inbound webhooks idempotent.

CREATE TABLE IF NOT EXISTS public.business_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT UNIQUE NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  alt_text TEXT,
  purpose TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_assets_created_at
  ON public.business_assets(created_at DESC);

ALTER TABLE public.business_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_business_assets"
  ON public.business_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "admin_manage_business_assets_storage" ON storage.objects;
CREATE POLICY "admin_manage_business_assets_storage"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'business-assets' AND public.is_admin())
  WITH CHECK (bucket_id = 'business-assets' AND public.is_admin());

-- Each delivery is stored once by provider message ID. The webhook route uses
-- this unique key to accept retries without duplicating a conversation record.
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'evolution',
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  payload JSONB NOT NULL,
  CONSTRAINT webhook_events_provider_event_unique UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  provider_message_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT,
  body TEXT,
  metadata JSONB,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_session_provider_unique UNIQUE (session_id, provider_message_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_received_at
  ON public.chat_messages(session_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
  ON public.webhook_events(received_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_webhook_events"
  ON public.webhook_events
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

CREATE POLICY "staff_read_chat_messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

SELECT 'Media and WhatsApp audit schema installed.' AS status;
