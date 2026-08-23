ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0;