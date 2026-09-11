-- Clean up duplicate shops, keeping only the oldest one per owner_id
DELETE FROM public.shops
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, row_number() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
    FROM public.shops
  ) t
  WHERE t.rn > 1
);

-- Add unique constraint to prevent future duplicates on shops.owner_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shops_owner_id_key'
  ) THEN
    ALTER TABLE public.shops ADD CONSTRAINT shops_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;

-- Add index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS shops_owner_id_idx ON public.shops (owner_id);

-- Add index on slug for fast public QR lookups
CREATE INDEX IF NOT EXISTS shops_slug_idx ON public.shops (slug);

-- Ensure profiles user_id has proper unique indexing
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles (id);

-- Ensure categories shop_id index exists for cross-table performance
CREATE INDEX IF NOT EXISTS categories_shop_id_idx ON public.categories (shop_id);

-- Ensure menu_items shop_id index exists
CREATE INDEX IF NOT EXISTS menu_items_shop_id_idx ON public.menu_items (shop_id);
