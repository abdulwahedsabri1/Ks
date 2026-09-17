import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

let _clientInstance: ReturnType<typeof createClient> | null = null;

function getSharedPublicClient() {
  if (_clientInstance) return _clientInstance;

  const key =
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable_zsLutER8J1k7E2qpwyE8vw_uVC24oU-";
  const url =
    process.env["VITE_SUPABASE_URL"] ||
    process.env["SUPABASE_URL"] ||
    "https://qmxrfzvvgwhzhqzhmwrf.supabase.co";

  _clientInstance = createClient(url, key, {
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

  return _clientInstance;
}

// In-memory server cache for ultra-fast response times (TTL: 20 seconds)
type CachedShopResult = {
  data: any;
  timestamp: number;
};
const publicShopCache = new Map<string, CachedShopResult>();
const CACHE_TTL_MS = 20_000;

export function invalidatePublicShopCache(slug?: string) {
  if (slug) {
    publicShopCache.delete(slug.toLowerCase());
  } else {
    publicShopCache.clear();
  }
}

export const getPublicShop = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const slugKey = data.slug.toLowerCase();
    const cached = publicShopCache.get(slugKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const db = getSharedPublicClient();
    const { data: shop } = await db
      .from("shops")
      .select(
        "id, owner_id, slug, name, niche, tagline, description, logo_url, cover_url, whatsapp, phone, address, currency, theme_color, plan, status, created_at, plan_started_at, plan_expires_at, features",
      )
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();

    if (!shop) {
      publicShopCache.set(slugKey, { data: null, timestamp: now });
      return null;
    }

    const s = shop as any;
    if (s?.plan_expires_at && new Date(s.plan_expires_at).getTime() < now) {
      publicShopCache.set(slugKey, { data: null, timestamp: now });
      return null;
    }

    const [{ data: rawCategories }, { data: rawItems }] = await Promise.all([
      db
        .from("categories")
        .select("id, shop_id, name, position")
        .eq("shop_id", s.id)
        .order("position"),
      db
        .from("menu_items")
        .select(
          "id, shop_id, category_id, name, description, image_url, price, discount_price, is_veg, is_available, is_bestseller, position",
        )
        .eq("shop_id", s.id)
        .order("position"),
    ]);

    const categories = (rawCategories ?? []) as any[];
    const items = (rawItems ?? []) as any[];

    const result = {
      shop: s,
      categories,
      items: items.map((i) => ({
        ...i,
        price: Number(i.price),
        discount_price: i.discount_price === null ? null : Number(i.discount_price),
      })),
    };

    // Cache cleanup if map grows too large
    if (publicShopCache.size > 200) {
      publicShopCache.clear();
    }
    publicShopCache.set(slugKey, { data: result, timestamp: now });

    return result;
  });

