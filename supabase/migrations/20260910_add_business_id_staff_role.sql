-- ============================================================
-- Add business_id column to shops & extend app_role enum
-- ============================================================

-- 1. Add business_id column to shops (used for referencing shops by a human-readable ID)
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS business_id text;

-- 2. Extend app_role enum to include 'staff' (previously only had admin & owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.app_role'::regtype
      AND enumlabel = 'staff'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'staff';
  END IF;
END
$$;

-- 3. Grant owners permission to insert into subscription_history (needed for platform plan saves)
-- (owners already have SELECT, adding INSERT for their own shops)
DROP POLICY IF EXISTS "owners insert own subscription_history" ON public.subscription_history;
CREATE POLICY "owners insert own subscription_history" ON public.subscription_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Add realtime publication for shops, categories, menu_items tables
-- (ensures Supabase Realtime works correctly)
DO $$
BEGIN
  -- Add shops to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'shops'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
  END IF;

  -- Add categories to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  -- Add menu_items to realtime if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END
$$;
