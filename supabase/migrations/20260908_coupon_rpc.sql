CREATE OR REPLACE FUNCTION increment_coupon_usage(p_shop_id uuid, p_coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_features jsonb;
    v_coupons jsonb;
    v_coupon jsonb;
    v_idx int;
BEGIN
    -- Get current features
    SELECT features INTO v_features
    FROM shops
    WHERE id = p_shop_id;

    IF v_features IS NULL THEN
        RETURN;
    END IF;

    v_coupons := v_features->'coupons';
    IF v_coupons IS NULL OR jsonb_typeof(v_coupons) != 'array' THEN
        RETURN;
    END IF;

    -- Find the coupon index
    v_idx := (
        SELECT idx - 1
        FROM jsonb_array_elements(v_coupons) WITH ORDINALITY arr(elem, idx)
        WHERE elem->>'code' = p_coupon_code
        LIMIT 1
    );

    IF v_idx IS NOT NULL THEN
        v_coupon := v_coupons->v_idx;
        
        -- Increment 'used'
        IF v_coupon ? 'used' THEN
            v_coupon := jsonb_set(v_coupon, '{used}', ((v_coupon->>'used')::int + 1)::text::jsonb);
        ELSE
            v_coupon := jsonb_set(v_coupon, '{used}', '1'::jsonb);
        END IF;

        -- Update the array
        v_coupons := jsonb_set(v_coupons, ARRAY[v_idx::text], v_coupon);

        -- Update features
        v_features := jsonb_set(v_features, '{coupons}', v_coupons);

        -- Save back to DB
        UPDATE shops
        SET features = v_features
        WHERE id = p_shop_id;
    END IF;
END;
$$;
