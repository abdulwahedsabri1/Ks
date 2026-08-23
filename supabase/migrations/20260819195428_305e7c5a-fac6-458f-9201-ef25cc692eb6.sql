ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.shop_is_active(_shop_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.shops
    WHERE id = _shop_id
      AND status = 'active'
      AND (plan_expires_at IS NULL OR plan_expires_at > now())
  )
$function$;