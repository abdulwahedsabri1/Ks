import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/shop";

function getPublicClient() {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing public Supabase keys");
  }
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (
          SUPABASE_PUBLISHABLE_KEY.startsWith("sb_") &&
          h.get("Authorization") === `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        ) {
          h.delete("Authorization");
        }
        h.set("apikey", SUPABASE_PUBLISHABLE_KEY);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function generateUniqueSlug(baseName: string) {
  const baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { data } = await supabaseAdmin.from("shops").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug; // It's unique
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const registerUser = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string; metadata: any }) => data)
  .handler(async ({ data }) => {
    try {
      const publicClient = getPublicClient();

      // 1. Check global app_settings for require_email_confirmation (ignore errors if table missing)
      const { data: settings, error: settingsError } = await publicClient
        .from("app_settings")
        .select("value")
        .eq("key", "auth_settings")
        .maybeSingle();

      const requireConfirmation =
        !settingsError && settings?.value?.require_email_confirmation !== undefined
          ? settings.value.require_email_confirmation
          : true;

      let user;
      let bypassed = false;

      // 2. Determine which method to use
      if (!requireConfirmation) {
        // Option A: Admin bypass (creates verified user instantly)
        if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is required in .env to bypass email confirmation.",
          );
        }

        const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: data.metadata,
        });

        if (adminError) throw adminError;
        user = adminData.user;
        bypassed = true;
      } else {
        // Option B: Standard public signup (sends confirmation email)
        const { data: publicData, error: publicError } = await publicClient.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: data.metadata },
        });

        if (publicError) throw publicError;
        user = publicData.user;
        bypassed = false;
      }

      if (user) {
        // 3. Auto-provision shop on the server, bypassing RLS completely!

        const { data: existingShop } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (!existingShop || existingShop.length === 0) {
          const shopSlug = await generateUniqueSlug(data.metadata.business_name);
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          const { error: shopError } = await supabaseAdmin.from("shops").insert({
            owner_id: user.id,
            name: data.metadata.business_name,
            slug: shopSlug,
            niche: data.metadata.business_category,
            phone: data.metadata.phone,
            whatsapp: data.metadata.phone,
            status: "active",
            plan: "trial",
            plan_started_at: new Date().toISOString(),
            plan_expires_at: expiresAt.toISOString(),
          });

          if (shopError) {
            console.error("Server-side shop creation failed:", shopError.message);
          }
        }
      }

      return { success: true, bypassed, user };
    } catch (err: any) {
      throw new Error(err.message || "Failed to register user");
    }
  });
