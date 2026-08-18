-- Chat sessions table for WhatsApp bot state management
-- Tracks whether the bot should respond or a human has taken over

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bot_state bot_state NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_sessions_phone ON chat_sessions(phone_number);
CREATE INDEX idx_chat_sessions_customer ON chat_sessions(customer_id);
CREATE INDEX idx_chat_sessions_bot_state ON chat_sessions(bot_state);
CREATE UNIQUE INDEX idx_chat_sessions_phone_unique ON chat_sessions(phone_number);

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin: full access
CREATE POLICY "admin_full_access_chat_sessions"
  ON chat_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Technicians: read access (for viewing escalated messages)
CREATE POLICY "technicians_read_chat_sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'technician'
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
