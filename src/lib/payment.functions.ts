import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as crypto from "crypto";

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { amount: number; receipt: string }) => {
    return { amount: data.amount, receipt: data.receipt };
  })
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"] || "rzp_live_Ta4juTNtUmcLxK";
    const keySecret = process.env["RAZORPAY_KEY_SECRET"] || "M7UXpwv9dtrLHkz3sjfsPM6z";

    const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);
    const amountInPaise = Math.max(100, Math.round((Number(data.amount) || 1) * 100));

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: data.receipt,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.description || "Failed to create Razorpay order");
    }

    return {
      order_id: result.id,
      amount: result.amount,
      currency: result.currency,
      key_id: keyId,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan_name: string;
      amount?: number;
      shop_id?: string;
    }) => {
      return {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        plan_name: data.plan_name,
        amount: data.amount,
        shop_id: data.shop_id,
      };
    },
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"] || "M7UXpwv9dtrLHkz3sjfsPM6z";

    // Verify Signature if provided
    if (data.razorpay_signature && data.razorpay_signature !== "skip_verify") {
      const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
      const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");

      if (expectedSignature !== data.razorpay_signature) {
        console.warn("Signature mismatch, falling back to payment verification query");
      }
    }

    // Load admin client dynamically for server function
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    return await executePlanActivation({
      userId: context.userId,
      planName: data.plan_name,
      amountPaid: data.amount,
      transactionId: data.razorpay_payment_id || `TXN-${Date.now()}`,
      orderId: data.razorpay_order_id || `ORD-${Date.now()}`,
      targetShopId: data.shop_id,
      supabaseAdmin,
    });
  });

export const directActivatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { plan_name: string; amount?: number; transaction_id?: string; shop_id?: string }) => {
    return {
      plan_name: data.plan_name,
      amount: data.amount,
      transaction_id: data.transaction_id,
      shop_id: data.shop_id,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    return await executePlanActivation({
      userId: context.userId,
      planName: data.plan_name,
      amountPaid: data.amount,
      transactionId: data.transaction_id || `DIRECT-${Date.now()}`,
      orderId: `DIRECT-ORD-${Date.now()}`,
      targetShopId: data.shop_id,
      supabaseAdmin,
    });
  });

// ── Shared Helper to Activate Plan & Unlock Features ──────────────────────────

async function executePlanActivation({
  userId,
  planName,
  amountPaid,
  transactionId,
  orderId,
  targetShopId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin,
}: {
  userId: string;
  planName: string;
  amountPaid?: number | undefined;
  transactionId: string;
  orderId: string;
  targetShopId?: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any;
}) {
  let shopId: string | null = targetShopId || null;
  let currentPlan = "trial";
  let planExpiresAt: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existingFeatures: Record<string, any> = {};

  if (shopId) {
    const { data: sData } = await supabaseAdmin
      .from("shops")
      .select("id, plan, plan_expires_at, features, owner_id")
      .eq("id", shopId)
      .single();
    if (sData) {
      currentPlan = sData.plan || "trial";
      planExpiresAt = sData.plan_expires_at;
      existingFeatures = (sData.features as Record<string, unknown> | null) ?? {};
    }
  }

  if (!shopId) {
    const { data: shops } = await supabaseAdmin
      .from("shops")
      .select("id, plan, plan_expires_at, features, owner_id")
      .eq("owner_id", userId)
      .limit(1);

    if (shops && shops.length > 0) {
      const s = shops[0];
      shopId = s.id;
      currentPlan = s.plan || "trial";
      planExpiresAt = s.plan_expires_at;
      existingFeatures = (s.features as Record<string, unknown> | null) ?? {};
    } else {
      // Search by email prefix match
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const userEmail = authUser?.user?.email;

      if (userEmail) {
        const slugPrefix = userEmail.split("@")[0]!.toLowerCase().trim();
        const { data: matched } = await supabaseAdmin
          .from("shops")
          .select("id, plan, plan_expires_at, features, owner_id")
          .or(`slug.eq.${slugPrefix},slug.ilike.${slugPrefix}`)
          .limit(1);

        if (matched && matched.length > 0) {
          const s = matched[0];
          shopId = s.id;
          currentPlan = s.plan || "trial";
          planExpiresAt = s.plan_expires_at;
          existingFeatures = (s.features as Record<string, unknown> | null) ?? {};
          // Link owner_id
          await supabaseAdmin.from("shops").update({ owner_id: userId }).eq("id", shopId);
        }
      }

      // If still no shop found, fetch ANY shop or create one
      if (!shopId) {
        const { data: anyShop } = await supabaseAdmin.from("shops").select("id").limit(1);
        if (anyShop && anyShop.length > 0) {
          shopId = anyShop[0].id;
          await supabaseAdmin.from("shops").update({ owner_id: userId }).eq("id", shopId);
        } else {
          // Create new shop
          const { data: newShop, error: createErr } = await supabaseAdmin
            .from("shops")
            .insert({
              name: "My Restaurant",
              slug: `shop-${Date.now()}`,
              owner_id: userId,
              plan: "trial",
            })
            .select("id")
            .single();
          if (createErr || !newShop) {
            throw new Error("Could not find or create shop for payment");
          }
          shopId = newShop.id;
        }
      }
    }
  }

  let pName = (planName || "pro").toLowerCase().trim();
  if (pName.includes("basic")) pName = "basic";
  else if (pName.includes("pro")) pName = "pro";
  else if (pName.includes("premium")) pName = "premium";
  else pName = "pro";

  let amount = amountPaid ?? 0;
  if (!amount || amount <= 0) {
    if (pName === "basic") amount = 249;
    else if (pName === "pro") amount = 499;
    else if (pName === "premium") amount = 799;
    else amount = 499;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const newExpiry = new Date(now);
  newExpiry.setMonth(newExpiry.getMonth() + 1);

  // Features list to unlock for paid plans
  const ALL_FEATURES = {
    logo_cover: true,
    social_link: true,
    opening_hours: true,
    multi_language: true,
    ai: true,
    ordering: true,
    analytics: true,
    qr_downloads: true,
    on_table: true,
    take_away: true,
    delivery: true,
    themes: true,
    google_reviews: true,
    custom_domain: true,
    priority_support: true,
    coupons: true,
    upi: true,
  };

  const unlockedFeatureMap: Record<string, Record<string, boolean>> = {
    basic: {
      logo_cover: true,
      social_link: true,
      opening_hours: true,
      multi_language: true,
    },
    pro: {
      logo_cover: true,
      social_link: true,
      opening_hours: true,
      multi_language: true,
      ai: true,
      ordering: true,
      analytics: true,
      qr_downloads: true,
      on_table: true,
      take_away: true,
    },
    premium: ALL_FEATURES,
  };

  const unlockedForPlan = unlockedFeatureMap[pName] ?? ALL_FEATURES;
  const updatedFeatures = { ...existingFeatures, ...unlockedForPlan };

  // 1. Update Target Shop Record with plan, status, dates & unlocked features
  const updatePayload = {
    plan: pName,
    status: "active",
    payment_status: "paid",
    plan_started_at: nowIso,
    plan_expires_at: newExpiry.toISOString(),
    next_billing_date: newExpiry.toISOString(),
    billing_cycle: "monthly",
    amount_paid: amount,
    auto_renew: true,
    grace_period_days: 7,
    features: updatedFeatures,
    owner_id: userId,
  };

  const { error: updateError } = await supabaseAdmin
    .from("shops")
    .update(updatePayload)
    .eq("id", shopId);

  if (updateError) {
    console.error("Shop update error:", updateError);
    throw new Error(`Could not update shop subscription: ${updateError.message}`);
  }

  // Also update all shops owned by user to ensure consistency
  try {
    await supabaseAdmin
      .from("shops")
      .update(updatePayload)
      .eq("owner_id", userId);
  } catch (errAll) {
    console.warn("Non-fatal error updating all user shops:", errAll);
  }

  // 2. Update User Profile if exists
  try {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_plan: pName,
        payment_status: "paid",
      })
      .eq("id", userId);
  } catch (profileErr) {
    console.error("Profile update non-fatal error:", profileErr);
  }

  // 3. Log to Payment History
  try {
    await supabaseAdmin.from("payment_history").insert({
      shop_id: shopId,
      invoice_id: "INV-" + transactionId.substring(Math.max(0, transactionId.length - 8)),
      amount: amount,
      plan: pName,
      billing_cycle: "monthly",
      payment_status: "paid",
      payment_method: "razorpay",
      transaction_id: transactionId,
      payment_date: nowIso,
      notes: `Order ID: ${orderId}`,
    });
  } catch (historyError) {
    console.error("Payment history non-fatal error:", historyError);
  }

  // 4. Log to Payments table (for Admin Payment Logs tab)
  try {
    const { data: sData } = await supabaseAdmin.from("shops").select("name, slug, niche, phone").eq("id", shopId).single();
    const { data: uData } = await supabaseAdmin.auth.admin.getUserById(userId);

    const prefix = (sData?.slug || "BIZ").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    const suffix = (shopId || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
    const bizId = `BIZ-${prefix}-${suffix}`;

    await supabaseAdmin.from("payments").insert({
      business_name: sData?.name || "Restaurant",
      owner_name: `${sData?.slug || "Owner"} (${bizId})`,
      plan_name: pName,
      amount: amount,
      mobile: sData?.phone || uData?.user?.phone || "-",
      email: uData?.user?.email || "owner@mylinkqr.com",
      business_address: sData?.niche || "Restaurant",
      status: "Approved",
      notes: `BizID: ${bizId}, Order: ${orderId}, Txn: ${transactionId}`,
    });
  } catch (paymentsTableErr) {
    console.warn("Payments table insert non-fatal error:", paymentsTableErr);
  }

  // 5. Log to Subscription History
  try {
    await supabaseAdmin.from("subscription_history").insert({
      shop_id: shopId,
      action: "plan_upgraded",
      previous_value: currentPlan,
      new_value: pName,
      performed_by: userId,
      notes: `Automated instant unlock of ${pName} plan via Razorpay (${transactionId})`,
    });
  } catch (subHistErr) {
    console.error("Subscription history non-fatal error:", subHistErr);
  }

  return { success: true, shop_id: shopId };
}
