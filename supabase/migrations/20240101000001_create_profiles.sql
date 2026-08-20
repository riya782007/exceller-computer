-- Profiles table linked to Supabase Auth
-- Every authenticated user has a profile with role-based access

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Role helper functions
-- ============================================================
-- These MUST be SECURITY DEFINER. A policy on `profiles` that itself
-- queries `profiles` causes:
--   ERROR: infinite recursion detected in policy for relation "profiles"
-- SECURITY DEFINER makes the function run as its owner, which bypasses RLS
-- on the inner query and breaks the recursion. They are also markedly faster
-- than an inline EXISTS subquery, since the result is STABLE per statement.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_technician()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'technician' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'technician') AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_technician() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users: read and update own profile (no recursion — direct id comparison)
CREATE POLICY "users_read_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin: full access (via SECURITY DEFINER helper, no recursion)
CREATE POLICY "admin_read_profiles"
  ON profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_insert_profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete_profiles"
  ON profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- Technicians: read customer profiles (for job assignments)
CREATE POLICY "technicians_read_customers"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (public.is_technician() AND role = 'customer');

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    NEW.phone,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
