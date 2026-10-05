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

    // 1. Authorization: Fetch target shop to verify ownership or admin role
    const { data: targetShop, error: fetchErr } = await supabaseAdmin
      .from("shops")
      .select("id, owner_id, slug, features")
      .eq("id", data.shop_id)
      .maybeSingle();

    if (fetchErr || !targetShop) {
      throw new Error("Shop not found or access denied.");
    }

    // Top-level PostgreSQL columns for the `shops` table
    const TOP_LEVEL_COLUMNS = new Set([
      "name",
      "slug",
      "niche",
      "tagline",
      "description",
      "logo_url",
      "cover_url",
      "whatsapp",
      "phone",
      "address",
      "currency",
      "theme_color",
      "owner_id",
      "updated_at",
    ]);

    const topLevelUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Check if user is owner or admin
    let isAuthorized = targetShop.owner_id === context.userId;
    if (!isAuthorized && (!targetShop.owner_id || targetShop.owner_id === "")) {
      // Unassigned or legacy shop record - set current user as owner
      isAuthorized = true;
      topLevelUpdates["owner_id"] = context.userId;
    }

    if (!isAuthorized) {
      const { data: adminRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();

      if (adminRole) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error("You don't have permission to update settings for this shop.");
    }

    const currentFeatures = (targetShop.features as Record<string, unknown>) || {};
    const featureUpdates: Record<string, unknown> = { ...currentFeatures };

    if (data.updates && typeof data.updates === "object") {
      for (const [key, val] of Object.entries(data.updates)) {
        if (val === undefined) continue;

        if (TOP_LEVEL_COLUMNS.has(key)) {
          topLevelUpdates[key] = val;
        } else if (key === "features" && typeof val === "object" && val !== null) {
          Object.assign(featureUpdates, val);
        } else {
          featureUpdates[key] = val;
        }
      }
    }

    // Ensure aliases match helper functions in shop.ts
    if ("cart_enabled" in featureUpdates) {
      featureUpdates["ordering_enabled"] = featureUpdates["cart_enabled"];
    }
    if ("takeaway" in featureUpdates) {
      featureUpdates["take_away"] = featureUpdates["takeaway"];
    }
    if ("instagram_url" in featureUpdates) {
      featureUpdates["social_link"] = featureUpdates["instagram_url"];
    }
    if ("whatsapp_group_url" in featureUpdates) {
      featureUpdates["whatsapp_group"] = featureUpdates["whatsapp_group_url"];
    }

    // 3. Slug Uniqueness Check if slug is being modified
    if (typeof topLevelUpdates["slug"] === "string" && topLevelUpdates["slug"].trim()) {
      const newSlug = (topLevelUpdates["slug"] as string).trim().toLowerCase();
      if (newSlug !== targetShop.slug) {
        const { data: existingSlug } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", data.shop_id)
          .maybeSingle();

        if (existingSlug) {
          throw new Error(`The handle / URL slug "${newSlug}" is already in use by another shop.`);
        }
        topLevelUpdates["slug"] = newSlug;
      }
    }

    // Combine top-level columns and JSONB features column
    const finalDatabasePayload: Record<string, unknown> = {
      ...topLevelUpdates,
      features: featureUpdates,
    };

    // 4. Atomic Database Update
    const { data: updated, error } = await supabaseAdmin
      .from("shops")
      .update(finalDatabasePayload as any)
      .eq("id", data.shop_id)
      .select();

    if (error) {
      throw new Error(`Failed to update shop settings: ${error.message}`);
    }

    if (!updated || updated.length === 0) {
      throw new Error("Database update returned no data. Verification failed.");
    }

    return { success: true, shop: updated[0] };
  });
