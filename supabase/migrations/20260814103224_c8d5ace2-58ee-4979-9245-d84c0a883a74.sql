CREATE TYPE public.app_role AS ENUM ('admin', 'owner');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  niche text NOT NULL DEFAULT 'Restaurant',
  tagline text,
  description text,
  logo_url text,
  cover_url text,
  whatsapp text,
  phone text,
  address text,
  currency text NOT NULL DEFAULT '₹',
  theme_color text NOT NULL DEFAULT 'emerald',
  plan text NOT NULL DEFAULT 'basic',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can view active shops" ON public.shops FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "owners view own shops" ON public.shops FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners create own shops" ON public.shops FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners update own shops" ON public.shops FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owners delete own shops" ON public.shops FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.owns_shop(_shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = _shop_id AND owner_id = auth.uid())
     OR public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.shop_is_active(_shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.shops WHERE id = _shop_id AND status = 'active')
$$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view categories" ON public.categories FOR SELECT TO anon, authenticated USING (public.shop_is_active(shop_id));
CREATE POLICY "owner view categories" ON public.categories FOR SELECT TO authenticated USING (public.owns_shop(shop_id));
CREATE POLICY "owner categories ins" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.owns_shop(shop_id));
CREATE POLICY "owner categories upd" ON public.categories FOR UPDATE TO authenticated USING (public.owns_shop(shop_id)) WITH CHECK (public.owns_shop(shop_id));
CREATE POLICY "owner categories del" ON public.categories FOR DELETE TO authenticated USING (public.owns_shop(shop_id));

CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  discount_price numeric(10,2),
  is_veg boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  is_bestseller boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view items" ON public.menu_items FOR SELECT TO anon, authenticated USING (public.shop_is_active(shop_id));
CREATE POLICY "owner view items" ON public.menu_items FOR SELECT TO authenticated USING (public.owns_shop(shop_id));
CREATE POLICY "owner items ins" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (public.owns_shop(shop_id));
CREATE POLICY "owner items upd" ON public.menu_items FOR UPDATE TO authenticated USING (public.owns_shop(shop_id)) WITH CHECK (public.owns_shop(shop_id));
CREATE POLICY "owner items del" ON public.menu_items FOR DELETE TO authenticated USING (public.owns_shop(shop_id));

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'view',
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_shop_created_idx ON public.analytics_events (shop_id, created_at DESC);
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can log events" ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (public.shop_is_active(shop_id));
CREATE POLICY "owner reads analytics" ON public.analytics_events FOR SELECT TO authenticated USING (public.owns_shop(shop_id));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "public read shop media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'shop-media');
CREATE POLICY "auth upload shop media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-media');
CREATE POLICY "auth update shop media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'shop-media');
CREATE POLICY "auth delete shop media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-media');