-- =====================================================
-- Google Review & Rating System — reviews table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id       uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  rating        integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_comment    text,
  feedback_comment  text,
  review_type   text        NOT NULL DEFAULT 'negative' CHECK (review_type IN ('positive', 'negative')),
  redirected_to_google boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_shop_id_idx  ON public.reviews (shop_id);
CREATE INDEX IF NOT EXISTS reviews_rating_idx   ON public.reviews (rating);
CREATE INDEX IF NOT EXISTS reviews_created_idx  ON public.reviews (created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL              ON public.reviews TO service_role;

CREATE POLICY "anyone_can_insert_review"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admin_can_read_reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "owner_can_read_own_reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = reviews.shop_id
        AND shops.owner_id = auth.uid()
    )
  );
