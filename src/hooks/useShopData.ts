import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, MenuItem, Shop } from "@/lib/shop";

export function useMyShop(userId?: string) {
  return useQuery({
    queryKey: ["my-shop", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Shop | null> => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", userId!)
        .order("created_at")
        .limit(1);
      if (error) throw error;
      return (data?.[0] as Shop) ?? null;
    },
  });
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
      return (data ?? []).map((i) => ({
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

export function useAnalytics(shopId?: string, days = 30) {
  return useQuery({
    queryKey: ["analytics", shopId, days],
    enabled: !!shopId,
    queryFn: async (): Promise<AnalyticsRow[]> => {
      const since = new Date(Date.now() - days * 86400000).toISOString();
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

export async function uploadShopMedia(file: File, shopId: string) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("shop-media").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from("shop-media")
    .createSignedUrl(path, 60 * 60 * 24 * 3650);
  if (signErr) throw signErr;
  return data.signedUrl;
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
