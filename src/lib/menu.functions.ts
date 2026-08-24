import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicShop = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: shop } = await db
      .from("shops")
      .select(
        "id, owner_id, slug, name, niche, tagline, description, logo_url, cover_url, whatsapp, phone, address, currency, theme_color, plan, status, created_at, plan_started_at, plan_expires_at, features",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();

    if (!shop) return null;
    if (shop.plan_expires_at && new Date(shop.plan_expires_at).getTime() < Date.now()) return null;

    const [{ data: categories }, { data: items }] = await Promise.all([
      db
        .from("categories")
        .select("id, shop_id, name, position")
        .eq("shop_id", shop.id)
        .order("position"),
      db
        .from("menu_items")
        .select(
          "id, shop_id, category_id, name, description, image_url, price, discount_price, is_veg, is_available, is_bestseller, position",
        )
        .eq("shop_id", shop.id)
        .order("position"),
    ]);

    return {
      shop,
      categories: categories ?? [],
      items: (items ?? []).map((i) => ({
        ...i,
        price: Number(i.price),
        discount_price: i.discount_price === null ? null : Number(i.discount_price),
      })),
    };
  });
