import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses?: number | null;
  used_count?: number;
  expires_at?: string | null;
  is_active: boolean;
  notes?: string;
}

export interface PaymentSettings {
  razorpay_enabled: boolean;
  upi_id: string;
  coupons?: Coupon[];
}

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "cpn-welcome50",
    code: "WELCOME50",
    discount_type: "percent",
    discount_value: 50,
    max_uses: 500,
    used_count: 14,
    is_active: true,
    notes: "50% OFF welcome launch offer",
  },
  {
    id: "cpn-off100",
    code: "OFF100",
    discount_type: "fixed",
    discount_value: 100,
    max_uses: 1000,
    used_count: 42,
    is_active: true,
    notes: "Flat ₹100 instant savings",
  },
  {
    id: "cpn-freepro",
    code: "FREEPRO",
    discount_type: "percent",
    discount_value: 100,
    max_uses: 50,
    used_count: 5,
    is_active: true,
    notes: "100% OFF complimentary access",
  },
];

const DEFAULT_SETTINGS: PaymentSettings = {
  razorpay_enabled: true,
  upi_id: "9392318135-2@axl",
  coupons: DEFAULT_COUPONS,
};

export function usePaymentSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payment_settings"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<PaymentSettings> => {
      let settings: Partial<PaymentSettings> = {};

      // 1. Try reading from platform-settings-internal in Supabase
      try {
        const { data, error } = await supabase
          .from("shops")
          .select("features")
          .eq("slug", "platform-settings-internal")
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;

        if (data && data.features && (data.features as any).payment_settings) {
          const remoteSettings = (data.features as any).payment_settings;
          if (typeof window !== "undefined") {
            localStorage.setItem("mylink_payment_settings", JSON.stringify(remoteSettings));
          }
          settings = remoteSettings;
        }
      } catch (err) {
        console.error("Payment settings Supabase fetch error:", err);
      }

      // 2. Fallback: try reading from localStorage if remote is empty
      if (!settings.upi_id && typeof window !== "undefined") {
        try {
          const local = localStorage.getItem("mylink_payment_settings");
          if (local) {
            settings = JSON.parse(local);
          }
        } catch {}
      }

      return {
        ...DEFAULT_SETTINGS,
        ...settings,
        coupons: settings.coupons && Array.isArray(settings.coupons) ? settings.coupons : DEFAULT_COUPONS,
      };
    },
  });

  useEffect(() => {
    // Realtime sync listener for payment settings
    const topic = `realtime-payment-settings-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shops", filter: "slug=eq.platform-settings-internal" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["payment_settings"] });
          },
        )
        .subscribe();
    } catch {}

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export async function savePaymentSettings(updatedSettings: Partial<PaymentSettings>, userId?: string) {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("mylink_payment_settings");
    const parsed = existing ? JSON.parse(existing) : {};
    const merged = { ...parsed, ...updatedSettings };
    localStorage.setItem("mylink_payment_settings", JSON.stringify(merged));
    window.dispatchEvent(new Event("storage"));
  }

  try {
    const { data: targetShop } = await supabase
      .from("shops")
      .select("id, features")
      .eq("slug", "platform-settings-internal")
      .maybeSingle();

    const existingFeatures = (targetShop?.features as Record<string, any>) || {};
    const existingPaymentSettings = existingFeatures["payment_settings"] || {};
    const updatedFeatures = {
      ...existingFeatures,
      payment_settings: {
        ...existingPaymentSettings,
        ...updatedSettings,
      },
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
  } catch (err) {
    console.error("Failed to sync payment settings to Supabase:", err);
  }
}

export async function recordCouponUsage(couponCode: string) {
  if (!couponCode) return;
  try {
    const { data: targetShop } = await supabase
      .from("shops")
      .select("id, features")
      .eq("slug", "platform-settings-internal")
      .maybeSingle();

    if (!targetShop?.features) return;
    const existingFeatures = targetShop.features as Record<string, any>;
    const paymentSettings = existingFeatures["payment_settings"] || {};
    const coupons: Coupon[] = paymentSettings.coupons || DEFAULT_COUPONS;

    const updatedCoupons = coupons.map((c) => {
      if (c.code.toUpperCase() === couponCode.toUpperCase()) {
        return {
          ...c,
          used_count: (c.used_count || 0) + 1,
        };
      }
      return c;
    });

    await savePaymentSettings({ coupons: updatedCoupons });
  } catch (err) {
    console.error("Failed to record coupon usage:", err);
  }
}

