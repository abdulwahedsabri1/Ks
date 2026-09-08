-- ============================================================
-- AUTH SYSTEM UPGRADE MIGRATION
-- Adds business fields to profiles, updates trigger, adds
-- onboarding table, and supports staff roles.
-- ============================================================

-- 1. Extend profiles table with new fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS google_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS remember_me boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Update handle_new_user trigger to populate new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _provider text;
  _is_google boolean;
BEGIN
  _provider := COALESCE(NEW.raw_app_meta_data->>'provider', '');
  _is_google := (_provider = 'google');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    business_name,
    business_category,
    avatar_url,
    google_user,
    subscription_plan,
    payment_status,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_category', NEW.raw_user_meta_data->>'niche', 'Restaurant'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    _is_google,
    'trial',
    'unpaid',
    'owner'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    google_user = EXCLUDED.google_user OR public.profiles.google_user,
    updated_at = now();

  -- Assign default 'owner' role (use existing enum)
  INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Create onboarding_data table for post-signup flow
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url text,
  google_review_link text,
  instagram_url text,
  facebook_url text,
  twitter_url text,
  website_url text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.onboarding_data TO authenticated;
GRANT ALL ON public.onboarding_data TO service_role;
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own onboarding read" ON public.onboarding_data
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own onboarding insert" ON public.onboarding_data
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own onboarding update" ON public.onboarding_data
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. Trigger to auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION public.set_profile_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profile_updated_at();

-- 5. Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = _user_id LIMIT 1
$$;
