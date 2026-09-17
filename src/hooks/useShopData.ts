import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  PLANS,
  parsePriceNumber,
  sanitizePlanItemFeatures,
  type Category,
  type MenuItem,
  type Shop,
  type PlanItem,
} from "@/lib/shop";
import { supabase } from "@/integrations/supabase/client";

export function triggerCrossTabSync(shopId?: string, ownerId?: string | null) {
  if (typeof window !== "undefined") {
    try {
      const bc = new BroadcastChannel("mylink_realtime_sync");
      bc.postMessage({ type: "SHOP_UPDATED", shopId, ownerId });
      bc.close();
    } catch {}
    localStorage.setItem("mylink_last_shop_update", Date.now().toString());
    window.dispatchEvent(new Event("storage"));
  }
}

export function useMyShop(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["my-shop", userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<Shop | null> => {
      // 1. Primary: Find shop by owner_id
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at")
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        return data[0] as Shop;
      }

      // 2. Fallback: try to locate shop by email prefix (for legacy accounts with orphaned shops)
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userEmail = authData.user?.email;

        if (userEmail) {
          const slugPrefix = userEmail.split("@")[0]!.toLowerCase().trim();

          const { data: matchedShops } = await supabase
            .from("shops")
            .select("*")
            .or(`slug.eq.${slugPrefix},slug.ilike.${slugPrefix}`)
            .limit(1);

          if (matchedShops && matchedShops.length > 0) {
            const foundShop = matchedShops[0] as Shop;
            await supabase.from("shops").update({ owner_id: userId! }).eq("id", foundShop.id);
            return { ...foundShop, owner_id: userId! };
          }
        }
      } catch (err) {
        console.error("Shop fallback search error:", err);
      }

      return null;
    },
  });

  // Multi-tier real-time synchronization for shops table
  useEffect(() => {
    if (!userId) return;

    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-shops"] });
    };

    // 1. BroadcastChannel (0ms instant cross-tab sync)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("mylink_realtime_sync");
      bc.onmessage = () => handleSync();
    } catch {}

    // 2. Storage event listener (fallback cross-tab sync)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mylink_last_shop_update" || !e.key) {
        handleSync();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Supabase Realtime channel listener (cross-device database push)
    const topic = `realtime-my-shop-${userId}-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shops",
          },
          (payload) => {
            handleSync();
            if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
              const newShop = payload.new as Shop;
              if (newShop.owner_id === userId) {
                queryClient.setQueryData(["my-shop", userId], newShop);
              }
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime shops subscription error:", err);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, queryClient]);

  return query;
}

export function useIsAdmin(userId?: string) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!)
        .eq("role", "admin");
      return (data?.length ?? 0) > 0;
    },
  });
}

export function useCategories(shopId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", shopId],
    enabled: !!shopId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("shop_id", shopId!)
        .order("position");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  // Real-time synchronization for categories table
  useEffect(() => {
    if (!shopId) return;

    const topic = `realtime-categories-${shopId}-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "categories",
            filter: `shop_id=eq.${shopId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime categories subscription error:", err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [shopId, queryClient]);

  return query;
}

export function useMenuItems(shopId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["menu-items", shopId],
    enabled: !!shopId,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MenuItem[]> => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("shop_id", shopId!)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((i: any) => ({
        ...i,
        price: Number(i.price),
        discount_price: i.discount_price === null ? null : Number(i.discount_price),
      })) as MenuItem[];
    },
  });

  // Real-time synchronization for menu_items table
  useEffect(() => {
    if (!shopId) return;

    const topic = `realtime-menu-items-${shopId}-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "menu_items",
            filter: `shop_id=eq.${shopId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items", shopId] });
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime menu items subscription error:", err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [shopId, queryClient]);

  return query;
}

export type AnalyticsRow = {
  id: string;
  shop_id: string;
  item_id: string | null;
  event_type: string;
  device: string | null;
  created_at: string;
};

export function useAnalytics(shopId?: string, days = 30, resetAt?: string | null) {
  return useQuery({
    queryKey: ["analytics", shopId, days, resetAt],
    enabled: !!shopId,
    queryFn: async (): Promise<AnalyticsRow[]> => {
      const thirtyDaysAgo = new Date(Date.now() - days * 86400000).toISOString();
      const since =
        resetAt &&
        !isNaN(new Date(resetAt).getTime()) &&
        new Date(resetAt).getTime() > new Date(thirtyDaysAgo).getTime()
          ? new Date(resetAt).toISOString()
          : thirtyDaysAgo;

      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("shop_id", shopId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as AnalyticsRow[];
    },
  });
}

export async function uploadShopMedia(file: File, shopId: string): Promise<string> {
  const fileToDataUrl = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });

  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("shop-media")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data: publicData } = supabase.storage.from("shop-media").getPublicUrl(path);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
      const { data: signedData } = await supabase.storage
        .from("shop-media")
        .createSignedUrl(path, 60 * 60 * 24 * 3650);
      if (signedData?.signedUrl) {
        return signedData.signedUrl;
      }
    }
  } catch (err) {
    console.warn("Storage upload failed, falling back to base64 data URL:", err);
  }

  return await fileToDataUrl(file);
}

export type StaffRow = {
  id: string;
  shop_id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
};

export function useStaff(shopId?: string) {
  return useQuery({
    queryKey: ["staff", shopId],
    enabled: !!shopId,
    queryFn: async (): Promise<StaffRow[]> => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });
}

export function useAllStaff(enabled: boolean) {
  return useQuery({
    queryKey: ["all-staff"],
    enabled,
    queryFn: async (): Promise<(StaffRow & { shops: { name: string } | null })[]> => {
      const { data, error } = await supabase
        .from("staff")
        .select("*, shops(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (StaffRow & { shops: { name: string } | null })[];
    },
  });
}

export type SubscriptionHistoryRow = {
  id: string;
  shop_id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
};

export function useSubscriptionHistory(shopId?: string) {
  return useQuery({
    queryKey: ["subscription-history", shopId],
    enabled: !!shopId,
    queryFn: async (): Promise<SubscriptionHistoryRow[]> => {
      const { data, error } = await supabase
        .from("subscription_history")
        .select("*")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as SubscriptionHistoryRow[];
    },
  });
}

export type PaymentHistoryRow = {
  id: string;
  shop_id: string;
  invoice_id: string;
  amount: number;
  plan: string;
  billing_cycle: string;
  payment_status: string;
  payment_method: string | null;
  transaction_id: string | null;
  payment_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
};

export function usePaymentHistory(shopId?: string) {
  return useQuery({
    queryKey: ["payment-history", shopId],
    enabled: !!shopId,
    queryFn: async (): Promise<PaymentHistoryRow[]> => {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PaymentHistoryRow[];
    },
  });
}

export function useCustomPlans() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["custom-plans"],
    queryFn: async (): Promise<PlanItem[]> => {
      // 1. Try reading from platform-settings-internal system shop row in Supabase
      try {
        const { data } = await supabase
          .from("shops")
          .select("features")
          .eq("slug", "platform-settings-internal")
          .maybeSingle();

        if (data?.features && (data.features as any).custom_plans) {
          const customPlans = (data.features as any).custom_plans;
          if (Array.isArray(customPlans) && customPlans.length > 0) {
            return sanitizePlanItemFeatures(customPlans as PlanItem[]);
          }
        }
      } catch (err) {
        console.error("Custom plans Supabase fetch error:", err);
      }

      // 2. Fallback: try subscription_history log table
      try {
        const { data } = await supabase
          .from("subscription_history")
          .select("notes")
          .eq("action", "platform_plans")
          .order("created_at", { ascending: false })
          .limit(1);

        if (data && data.length > 0 && data[0]?.notes) {
          const parsed = JSON.parse(data[0].notes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sanitizePlanItemFeatures(parsed as PlanItem[]);
          }
        }
      } catch (err) {
        console.error("Custom plans subscription history fetch error:", err);
      }

      // 3. Fallback: localStorage
      try {
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("mylink_custom_plans");
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return sanitizePlanItemFeatures(parsed as PlanItem[]);
          }
        }
      } catch {}

      return sanitizePlanItemFeatures(PLANS);
    },
  });

  // Multi-tier real-time sync for platform plans across windows & tabs
  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: ["custom-plans"] });
    };

    // 1. BroadcastChannel (0ms instant cross-tab sync)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("mylink_realtime_sync");
      bc.onmessage = () => handleSync();
    } catch {}

    // 2. Storage event listener
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mylink_last_shop_update" || e.key === "mylink_custom_plans" || !e.key) {
        handleSync();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Supabase Realtime channel listener for platform-settings-internal
    const topic = `realtime-custom-plans-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shops",
            filter: "slug=eq.platform-settings-internal",
          },
          () => {
            handleSync();
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime custom plans subscription error:", err);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  return query;
}

export async function savePlatformPlans(updatedPlans: PlanItem[], userId?: string) {
  const sanitizedPlans = sanitizePlanItemFeatures(updatedPlans);
  if (typeof window !== "undefined") {
    localStorage.setItem("mylink_custom_plans", JSON.stringify(sanitizedPlans));
  }

  try {
    // 1. Upsert into platform-settings-internal system shop
    const { data: targetShop } = await supabase
      .from("shops")
      .select("id, features")
      .eq("slug", "platform-settings-internal")
      .maybeSingle();

    const existingFeatures = (targetShop?.features as Record<string, any>) || {};
    const updatedFeatures = {
      ...existingFeatures,
      custom_plans: sanitizedPlans,
    };

    if (targetShop?.id) {
      await supabase
        .from("shops")
        .update({ features: updatedFeatures })
        .eq("id", targetShop.id);
    } else {
      await supabase.from("shops").insert({
        slug: "platform-settings-internal",
        name: "Platform Settings Internal",
        niche: "System",
        plan: "premium",
        status: "system",
        owner_id: userId ?? "00000000-0000-0000-0000-000000000000",
        features: updatedFeatures,
      });
    }

    // 2. Also log to subscription_history for auditing
    const { data: shops } = await supabase.from("shops").select("id").limit(1);
    const shopId = shops?.[0]?.id;

    if (shopId) {
      await supabase.from("subscription_history").insert({
        shop_id: shopId,
        action: "platform_plans",
        previous_value: "custom_plans_update",
        new_value: "updated",
        performed_by: userId ?? null,
        notes: JSON.stringify(sanitizedPlans),
      });
    }
  } catch (err) {
    console.error("Failed to sync platform plans to Supabase:", err);
  } finally {
    triggerCrossTabSync();
  }
}
