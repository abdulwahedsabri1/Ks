import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Shop } from "@/lib/shop";

export type ActiveShopItem = {
  id: string;
  name: string;
  slug: string;
  niche: string;
  tagline: string | null;
  logo_url: string | null;
  status: string;
  theme_color?: string | null;
  created_at?: string;
  rank?: number;
  features?: Record<string, any> | null;
};

export function useRealtimeActiveShops() {
  const [shops, setShops] = useState<ActiveShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveShops = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select(
          "id, name, slug, niche, tagline, logo_url, status, theme_color, created_at, features",
        );

      if (!error && data) {
        // Map rank and keep all valid shops (active and suspended)
        const mapped = (data as (ActiveShopItem & { features?: Record<string, any> | null })[])
          .filter((s) => s.slug)
          .map((s) => {
            const rawRank = s.features?.["rank"];
            const rankNum =
              typeof rawRank === "number"
                ? rawRank
                : typeof rawRank === "string"
                  ? parseInt(rawRank, 10)
                  : 9999;
            return {
              ...s,
              rank: isNaN(rankNum) ? 9999 : rankNum,
            };
          });

        // Sort by Admin Rank ASC, then by active status first, then by name ASC
        mapped.sort((a, b) => {
          const rankA = a.rank ?? 9999;
          const rankB = b.rank ?? 9999;
          if (rankA !== rankB) return rankA - rankB;
          if (a.status === "active" && b.status !== "active") return -1;
          if (a.status !== "active" && b.status === "active") return 1;
          return a.name.localeCompare(b.name);
        });

        setShops(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveShops();

    const channelName = `active-shops-${Math.random().toString(36).substring(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase.channel(channelName).on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shops",
        },
        () => {
          fetchActiveShops();
        },
      );

      channel.subscribe();
    } catch (err) {
      console.warn("Failed to subscribe to realtime active shops:", err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { shops, loading, refetch: fetchActiveShops };
}
