import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import * as crypto from "crypto";

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amount: number; receipt: string }) => {
    return { amount: data.amount, receipt: data.receipt };
  })
  .handler(async ({ data }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not set.");
    }

    const authHeader = "Basic " + btoa(`${keyId}:${keySecret}`);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: data.amount * 100, // Amount in paise
        currency: "INR",
        receipt: data.receipt,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.description || "Failed to create order");
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
  .inputValidator((data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan_name: string;
  }) => {
    return {
      razorpay_order_id: data.razorpay_order_id,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_signature: data.razorpay_signature,
      plan_name: data.plan_name,
    };
  })
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    if (!keySecret) {
      throw new Error("Razorpay credentials are not set.");
    }

    const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    // Load admin client dynamically for server function
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Find a shop owned by the user
    const { data: shops, error: shopError } = await supabaseAdmin
      .from("shops")
      .select("id, plan_expires_at")
      .eq("owner_id", context.userId)
      .limit(1);

    if (shopError) {
      console.error("Shop fetch error:", shopError);
      throw new Error("Could not fetch user shop");
    }

    if (!shops || shops.length === 0) {
      throw new Error("No shop found for user. Please create a shop first.");
    }

    const shop = shops[0];
    const pName = data.plan_name.toLowerCase();
    
    let amount = 0;
    if (pName === 'basic') amount = 99;
    else if (pName === 'pro') amount = 299;
    else if (pName === 'premium') amount = 499;

    let newExpiry = new Date();
    if (shop.plan_expires_at) {
      const currentExpiry = new Date(shop.plan_expires_at);
      if (currentExpiry > new Date()) {
        newExpiry = currentExpiry;
      }
    }
    
    if (pName === 'basic') {
      newExpiry.setDate(newExpiry.getDate() + 7);
    } else {
      newExpiry.setMonth(newExpiry.getMonth() + 1);
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("shops")
      .update({
        plan: pName,
        payment_status: "paid",
        plan_started_at: now,
        plan_expires_at: newExpiry.toISOString(),
        amount_paid: amount,
      })
      .eq("id", shop.id);

    if (updateError) {
      console.error("Shop update error:", updateError);
      throw new Error("Could not update shop subscription");
    }

    const { error: historyError } = await supabaseAdmin
      .from("payment_history")
      .insert({
        shop_id: shop.id,
        invoice_id: "INV-" + data.razorpay_payment_id.substring(4), // removing 'pay_' usually
        amount: amount,
        plan: pName,
        billing_cycle: pName === 'basic' ? "weekly" : "monthly",
        payment_status: "paid",
        payment_method: "razorpay",
        transaction_id: data.razorpay_payment_id,
        payment_date: now,
        notes: `Order ID: ${data.razorpay_order_id}`,
      });
      
    if (historyError) {
       console.error("Payment history error:", historyError);
    }

    return { success: true, shop_id: shop.id };
  });
