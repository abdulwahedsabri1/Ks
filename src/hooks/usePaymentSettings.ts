import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentSettings {
  razorpay_enabled: boolean;
  upi_id: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  razorpay_enabled: true,
  upi_id: "9392318135-2@axl",
};

export function usePaymentSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payment_settings"],
    queryFn: async (): Promise<PaymentSettings> => {
      const { data, error } = await supabase
        .from("shops")
        .select("features")
        .eq("slug", "platform-settings-internal")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error; // Ignore no rows

      if (data && data.features && (data.features as any).payment_settings) {
        return {
          ...DEFAULT_SETTINGS,
          ...((data.features as any).payment_settings as Partial<PaymentSettings>),
        };
      }

      return DEFAULT_SETTINGS;
    },
  });

  useEffect(() => {
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`app-settings-payment-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shops",
          // Note: filter on slug might not work if slug is not replica identity, so we filter in JS
        },
        (payload: any) => {
          if (payload.new && payload.new.slug === "platform-settings-internal") {
            queryClient.invalidateQueries({ queryKey: ["payment_settings"] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
