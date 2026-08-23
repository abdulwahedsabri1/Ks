-- ============================================================
-- Subscription Management System Migration
-- ============================================================

-- 1. Add new subscription columns to shops
ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS grace_period_days int NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true;

-- 2. Subscription activity log
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_value text,
  new_value text,
  performed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_history TO authenticated;
GRANT ALL ON public.subscription_history TO service_role;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage subscription_history" ON public.subscription_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "owners read own subscription_history" ON public.subscription_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS subscription_history_shop_id_idx ON public.subscription_history(shop_id, created_at DESC);

-- 3. Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  invoice_id text NOT NULL DEFAULT ('INV-' || substr(gen_random_uuid()::text, 1, 8)),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  plan text NOT NULL DEFAULT 'basic',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  transaction_id text,
  payment_date timestamptz,
  due_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage payment_history" ON public.payment_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "owners read own payment_history" ON public.payment_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE INDEX IF NOT EXISTS payment_history_shop_id_idx ON public.payment_history(shop_id, created_at DESC);
