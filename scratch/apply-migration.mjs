// Script to apply migration to Supabase remote DB
// Run: node apply-migration.mjs

const SUPABASE_URL = "https://qmxrfzvvgwhzhqzhmwrf.supabase.co";
// Using the publishable key for RPC calls
const SUPABASE_KEY = "sb_publishable_zsLutER8J1k7E2qpwyE8vw_uVC24oU-";

// The migration SQL we want to apply
const migrationSQL = `
-- Add business_id column to shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS business_id text;

-- Add staff to app_role enum if not exists
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

-- Fix subscription_history INSERT policy for owners
DROP POLICY IF EXISTS "owners insert own subscription_history" ON public.subscription_history;
CREATE POLICY "owners insert own subscription_history" ON public.subscription_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
`;

console.log("Migration SQL to apply in Supabase SQL Editor:");
console.log("=".repeat(60));
console.log(migrationSQL);
console.log("=".repeat(60));
console.log("\nPlease apply this SQL in your Supabase dashboard:");
console.log(`https://supabase.com/dashboard/project/qmxrfzvvgwhzhqzhmwrf/sql/new`);
