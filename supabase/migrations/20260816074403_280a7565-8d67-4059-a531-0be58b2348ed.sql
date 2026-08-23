CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their shop staff" ON public.staff FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = staff.shop_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = staff.shop_id AND s.owner_id = auth.uid()));

CREATE POLICY "Admins manage all staff" ON public.staff FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX staff_shop_id_idx ON public.staff(shop_id);