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

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.shops ADD CONSTRAINT shops_owner_id_key UNIQUE (owner_id);
