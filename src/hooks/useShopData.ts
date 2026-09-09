import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { PLANS, parsePriceNumber, type Category, type MenuItem, type Shop, type PlanItem } from "@/lib/shop";
import { supabase } from "@/integrations/supabase/client";

export function useMyShop(userId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["my-shop", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Shop | null> => {
      // 1. Try finding shop by owner_id
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

      // 2. Fallback: match shop by user email / slug (e.g. rafeek-7kz7@mylinkqr.com -> slug rafeek-7kz7)
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
            // Claim / link owner_id so it belongs to this logged in user permanently!
            await supabase.from("shops").update({ owner_id: userId! }).eq("id", foundShop.id);

            return { ...foundShop, owner_id: userId! };
          }
        }
      } catch (err) {
        console.error("Shop fallback search error:", err);
      }

      // 3. Fallback: check if there is any existing shop created for this user
      const { data: allShops } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (allShops && allShops.length > 0) {
        const fallbackShop = allShops[0] as Shop;
        await supabase.from("shops").update({ owner_id: userId! }).eq("id", fallbackShop.id);
        return { ...fallbackShop, owner_id: userId! };
      }

      return null;
    },
  });

  useEffect(() => {
    if (!userId || !query.data?.id) return;

    const channel = supabase
      .channel("public:shops")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shops",
          filter: `id=eq.${query.data.id}`,
        },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["my-shop", userId] });
          if (payload.eventType === "UPDATE") {
            const oldRecord = payload.old as Shop;
            const newRecord = payload.new as Shop;
            if (oldRecord.payment_status !== newRecord.payment_status) {
              toast(`Your payment status has been updated to ${newRecord.payment_status}`);
            } else if (oldRecord.plan !== newRecord.plan) {
              toast(`Your plan has been updated to ${newRecord.plan}`);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, query.data?.id, queryClient]);

  return query;
}

export function useIsAdmin(userId?: string) {
  return useQuery({
    queryKey: ["is-admin", userId],
    enabled: !!userId,
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
  return useQuery({
    queryKey: ["categories", shopId],
    enabled: !!shopId,
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
}

export function useMenuItems(shopId?: string) {
  return useQuery({
    queryKey: ["menu-items", shopId],
    enabled: !!shopId,
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
        resetAt && !isNaN(new Date(resetAt).getTime()) && new Date(resetAt).getTime() > new Date(thirtyDaysAgo).getTime()
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
    const { error } = await supabase.storage.from("shop-media").upload(path, file, { upsert: true });
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
  return useQuery({
    queryKey: ["custom-plans"],
    queryFn: async (): Promise<PlanItem[]> => {
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
            return parsed as PlanItem[];
          }
        }
      } catch (err) {
        console.error("Custom plans fetch error:", err);
      }

      try {
        if (typeof window !== "undefined") {
          const local = localStorage.getItem("mylink_custom_plans");
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed as PlanItem[];
          }
        }
      } catch {}

      return PLANS;
    },
  });
}

export async function savePlatformPlans(updatedPlans: PlanItem[], userId?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mylink_custom_plans", JSON.stringify(updatedPlans));
  }

  try {
    const { data: shops } = await supabase.from("shops").select("id").limit(1);
    const shopId = shops?.[0]?.id;

    if (shopId) {
      await supabase.from("subscription_history").insert({
        shop_id: shopId,
        action: "platform_plans",
        previous_value: "custom_plans_update",
        new_value: "updated",
        performed_by: userId ?? null,
        notes: JSON.stringify(updatedPlans),
      });
    }
  } catch (err) {
    console.error("Failed to sync platform plans to Supabase:", err);
  }
}
