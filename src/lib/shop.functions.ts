import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const updateShopSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { shop_id: string; updates: Record<string, unknown> }) => {
    return {
      shop_id: data.shop_id,
      updates: data.updates,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload = {
      ...data.updates,
      owner_id: context.userId,
    };

    const { data: updated, error } = await supabaseAdmin
      .from("shops")
      .update(payload)
      .eq("id", data.shop_id)
      .select();

    if (error) {
      throw new Error(`Failed to update shop settings: ${error.message}`);
    }

    return { success: true, shop: updated?.[0] };
  });
