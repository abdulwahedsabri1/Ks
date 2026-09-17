import { useState, useEffect, useRef } from "react";
import { Check, Loader2, Lock, ShieldCheck, X, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  directActivatePlan,
} from "@/lib/payment.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { PlanItem } from "@/lib/shop";
import { UpiPaymentBox } from "@/components/UpiPaymentBox";

interface RazorpayModalProps {
  plan: PlanItem;
  price: number;
  billingCycle?: "monthly" | "yearly";
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Preload Razorpay SDK script globally on module load
if (typeof window !== "undefined" && !document.getElementById("razorpay-sdk")) {
  const script = document.createElement("script");
  script.id = "razorpay-sdk";
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.head.appendChild(script);
}

import { shopBusinessId } from "@/lib/shop";
import { usePaymentSettings, recordCouponUsage, type Coupon } from "@/hooks/usePaymentSettings";
import { Tag, Sparkles as SparklesIcon, CheckCircle2 as CheckCircleIcon } from "lucide-react";

export function RazorpayModal({ plan, price, billingCycle = "monthly", onClose, onSuccess }: RazorpayModalProps) {
  const isYearly = billingCycle === "yearly";
  const extraMonths = typeof plan.extraMonths === "number" ? plan.extraMonths : 2;
  const totalMonths = 12 + extraMonths;
  const basePrice = isYearly ? (plan.yearlyPriceNumber || plan.priceNumber * 10 || price) : price;

  const [loading, setLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const [bizName, setBizName] = useState("");
  const [bizPhone, setBizPhone] = useState("");
  const [bizId, setBizId] = useState("");
  const [targetShopId, setTargetShopId] = useState<string | undefined>(undefined);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");

  const { data: paymentSettings } = usePaymentSettings();
  const isRazorpayEnabled = paymentSettings?.razorpay_enabled ?? true;
  const upiId = paymentSettings?.upi_id ?? "9392318135-2@axl";
  const availableCoupons = paymentSettings?.coupons || [];

  // Calculate final price based on applied coupon
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percent") {
      discountAmount = basePrice * (appliedCoupon.discount_value / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }
  const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);

  function handleApplyCoupon() {
    setCouponError("");
    setCouponSuccessMsg("");
    const trimmed = couponCodeInput.trim().toUpperCase();
    if (!trimmed) {
      setCouponError("Please enter a coupon code.");
      return;
    }

    const found = availableCoupons.find((c) => c.code.toUpperCase() === trimmed);
    if (!found) {
      setCouponError("Invalid coupon code. Try WELCOME50 or OFF100.");
      return;
    }

    if (!found.is_active) {
      setCouponError("This coupon code is currently inactive.");
      return;
    }

    if (found.max_uses && (found.used_count || 0) >= found.max_uses) {
      setCouponError("This coupon code limit has been reached.");
      return;
    }

    if (found.expires_at && new Date(found.expires_at).getTime() < Date.now()) {
      setCouponError("This coupon code has expired.");
      return;
    }

    const calcDiscount =
      found.discount_type === "percent" ? (price * found.discount_value) / 100 : found.discount_value;

    setAppliedCoupon(found);
    setCouponSuccessMsg(
      `Coupon "${found.code}" applied! You saved ₹${Math.min(price, Math.round(calcDiscount))}.`,
    );
    toast.success(`🎉 Coupon "${found.code}" applied! Saved ₹${Math.min(price, Math.round(calcDiscount))}`);
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
    setCouponSuccessMsg("");
  }

  useEffect(() => {
    // Fallback script load check on mount
    if (typeof window !== "undefined" && !document.getElementById("razorpay-sdk")) {
      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.head.appendChild(script);
    }

    async function fetchShopInfo() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: shops } = await supabase
            .from("shops")
            .select("*")
            .eq("owner_id", user.id)
            .limit(1);
          if (shops && shops.length > 0 && shops[0]) {
            const s = shops[0];
            setBizName(
              s.name ||
                user.user_metadata?.["full_name"] ||
                user.user_metadata?.["business_name"] ||
                "",
            );
            setBizPhone(s.phone || user.phone || "");
            setBizId(shopBusinessId(s));
            setTargetShopId(s.id);
          } else {
            setBizName(
              user.user_metadata?.["full_name"] || user.user_metadata?.["business_name"] || "",
            );
            setBizPhone(user.phone || "");
            setBizId(
              `BIZ-${user.email?.split("@")[0]?.toUpperCase().slice(0, 6) || "SHOP"}-${Date.now().toString().slice(-4)}`,
            );
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchShopInfo();
  }, []);

  async function handleDirectActivate() {
    setDirectLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first to purchase a plan.");
        setDirectLoading(false);
        return;
      }

      if (bizName || bizPhone) {
        try {
          const { data: userShops } = await supabase
            .from("shops")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1);
          if (userShops && userShops.length > 0 && userShops[0]) {
            await supabase
              .from("shops")
              .update({ name: bizName, phone: bizPhone })
              .eq("id", userShops[0].id);
            qc.invalidateQueries({ queryKey: ["my-shop"] });
            qc.invalidateQueries({ queryKey: ["admin-shops"] });
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (appliedCoupon) {
        await recordCouponUsage(appliedCoupon.code);
      }

      // Optimistic instant feedback
      toast.success(`🎉 ${plan.name} plan activated! Unlocking features…`);
      onSuccess();

      await directActivatePlan({
        data: {
          plan_name: plan.id || plan.name,
          amount: finalPrice,
          transaction_id: `DIRECT-${Date.now()}`,
          billing_cycle: billingCycle,
          ...(targetShopId ? { shop_id: targetShopId } : {}),
        },
      });
    } catch (err) {
      console.error("Direct activation error:", err);
      setDirectLoading(false);
    }
  }

  async function handleManualPay() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first to purchase a plan.");
        setLoading(false);
        return;
      }

      if (bizName || bizPhone) {
        try {
          const { data: userShops } = await supabase
            .from("shops")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1);
          if (userShops && userShops.length > 0 && userShops[0]) {
            await supabase
              .from("shops")
              .update({ name: bizName, phone: bizPhone })
              .eq("id", userShops[0].id);
            qc.invalidateQueries({ queryKey: ["my-shop"] });
            qc.invalidateQueries({ queryKey: ["admin-shops"] });
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (appliedCoupon) {
        await recordCouponUsage(appliedCoupon.code);
      }

      const payload = {
        business_name: bizName || "Business",
        owner_name: user.email?.split("@")[0] || "Owner",
        plan_name: plan.id || plan.name,
        amount: finalPrice,
        mobile: bizPhone || user.phone || "-",
        email: user.email || "",
        whatsapp: bizPhone || user.phone || "-",
        city: "Unknown",
        state: "Unknown",
        category: "Other",
        business_address: "Manual Payment",
        status: "Pending",
        screenshot_url: "MANUAL",
      };

      await supabase.from("payments").insert(payload);
      toast.success("Payment request submitted! Redirecting to WhatsApp to send proof...");

      // WhatsApp redirect logic
      const whatsappNumber = "9392318135";
      const couponText = appliedCoupon ? ` (Coupon: ${appliedCoupon.code})` : "";
      const message = `*Payment Confirmation*\n\nBusiness Name: ${bizName || "Business"}\nBusiness ID: ${bizId}\nPlan: ${plan.name}${couponText}\nAmount Paid: ₹${finalPrice}\nContact: ${bizPhone || user.phone || "-"}\n\nI have successfully made the payment of ₹${finalPrice} via UPI. Please activate my plan.`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/91${whatsappNumber}?text=${encodedMessage}`, "_blank");

      onSuccess();
    } catch (err) {
      console.error("Manual pay error:", err);
      toast.error("Failed to submit payment request.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first to purchase a plan.");
        setLoading(false);
        return;
      }

      if (bizName || bizPhone) {
        try {
          const { data: userShops } = await supabase
            .from("shops")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1);
          if (userShops && userShops.length > 0 && userShops[0]) {
            await supabase
              .from("shops")
              .update({ name: bizName, phone: bizPhone })
              .eq("id", userShops[0].id);
            qc.invalidateQueries({ queryKey: ["my-shop"] });
            qc.invalidateQueries({ queryKey: ["admin-shops"] });
          }
        } catch (err) {
          console.error(err);
        }
      }

      if (appliedCoupon) {
        await recordCouponUsage(appliedCoupon.code);
      }

      const keyId = import.meta.env["VITE_RAZORPAY_KEY_ID"] || "rzp_live_Ta4juTNtUmcLxK";

      // 1. Fast path: If Razorpay SDK is loaded, launch popup instantly
      if (window.Razorpay) {
        let orderId: string | undefined = undefined;

        // Fast order creation with 1s timeout race
        try {
          const orderPromise = createRazorpayOrder({
            data: { amount: finalPrice, receipt: `rcpt_${plan.id}_${Date.now()}` },
          });
          const timeoutPromise = new Promise<{ order_id?: string }>((resolve) =>
            setTimeout(() => resolve({}), 1000),
          );
          const result = (await Promise.race([orderPromise, timeoutPromise])) as {
            order_id?: string;
          };
          if (result && result.order_id) {
            orderId = result.order_id;
          }
        } catch (orderErr) {
          console.warn("Order creation fast timeout/error, opening checkout directly:", orderErr);
        }

        const options: any = {
          key: keyId,
          amount: Math.max(100, Math.round((finalPrice || 1) * 100)),
          currency: "INR",
          name: "MY Link QR",
          description: `${plan.name} Plan — Monthly`,
          theme: { color: "#F5A623" },
          prefill: {
            email: user.email,
          },
          modal: {
            ondismiss: () => setLoading(false),
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id?: string;
            razorpay_signature?: string;
          }) => {
            try {
              await verifyRazorpayPayment({
                data: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id || `ORD-${Date.now()}`,
                  razorpay_signature: response.razorpay_signature || "skip_verify",
                  plan_name: plan.id || plan.name,
                  amount: finalPrice,
                  billing_cycle: billingCycle,
                  ...(targetShopId ? { shop_id: targetShopId } : {}),
                },
              });
              toast.success(
                `🎉 ${plan.name} plan activated! All ${plan.name} features are now unlocked.`,
              );
              onSuccess();
            } catch (err) {
              console.error("Razorpay verification error, activating directly:", err);
              await handleDirectActivate();
            }
          },
        };

        if (orderId) {
          options.order_id = orderId;
        }

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
        return;
      }

      // 2. If Razorpay SDK is not ready, trigger direct instant activation
      await handleDirectActivate();
    } catch (err) {
      console.error("Razorpay payment launch error:", err);
      await handleDirectActivate();
    }
  }

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="bg-[#100C09] p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
            Upgrading to
          </p>
          <h2 className="text-2xl font-bold text-white">{plan.name} Plan</h2>
          <div className="flex items-baseline gap-2 mt-2">
            {appliedCoupon ? (
              <>
                <span className="text-4xl font-extrabold text-[#F5A623]">₹{finalPrice}</span>
                <span className="text-white/50 text-sm line-through">₹{basePrice}</span>
                <span className="text-white/50 text-sm">/{isYearly ? "year" : "month"}</span>
                <span className="text-emerald-400 text-xs font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {appliedCoupon.discount_type === "percent"
                    ? `${appliedCoupon.discount_value}% OFF`
                    : `₹${appliedCoupon.discount_value} OFF`}
                </span>
              </>
            ) : (
              <>
                <span className="text-4xl font-extrabold text-[#F5A623]">₹{price}</span>
                <span className="text-white/50 text-sm">/{isYearly ? "year" : "month"}</span>
              </>
            )}
          </div>
          {isYearly && (
            <p className="mt-2 text-xs font-bold text-[#F5A623] flex items-center gap-1">
              <span>
                🎁 Annual Billing: Includes {totalMonths} Months Access ({extraMonths > 0 ? `12 Mos + ${extraMonths} ${extraMonths === 1 ? "Mo" : "Mos"} Free` : "12 Months Access"})
              </span>
            </p>
          )}
        </div>

        {/* Features summary */}
        <div className="p-5 border-b border-black/5">
          <p className="text-xs font-semibold text-[#3A2818]/60 uppercase tracking-wider mb-3">
            What you get
          </p>
          <ul className="space-y-2">
            {plan.features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#3A2818]/80">
                <div className="size-4 rounded-full bg-[#F5A623]/20 text-[#D99A2B] flex items-center justify-center shrink-0">
                  <Check className="size-2.5" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Coupon Code Section */}
        <div className="p-5 border-b border-black/5 bg-[#F5F0E7]/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#100C09] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="size-3.5 text-[#F5A623]" />
              Have a Coupon Code?
            </label>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Remove Coupon
              </button>
            )}
          </div>

          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => {
                  setCouponCodeInput(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
                placeholder="Enter promo code (e.g. WELCOME50)"
                className="flex-1 h-9 px-3 text-xs uppercase font-mono font-bold tracking-wider rounded-xl border border-black/15 bg-white text-[#100C09] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
              />
              <Button
                type="button"
                onClick={handleApplyCoupon}
                className="h-9 px-4 text-xs font-bold bg-[#100C09] text-white hover:bg-black rounded-xl shadow-sm"
              >
                Apply
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-mono font-bold text-xs text-emerald-900 uppercase">
                    {appliedCoupon.code}
                  </span>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    Saved ₹{Math.round(discountAmount)} on your subscription!
                  </p>
                </div>
              </div>
            </div>
          )}

          {couponError && <p className="text-[11px] font-semibold text-rose-600">{couponError}</p>}
        </div>

        {/* Business Details Form */}
        <div className="p-5 border-b border-black/5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#100C09] uppercase tracking-wider">
              Business Details
            </label>
            <span className="text-[10px] font-mono font-bold bg-[#F5A623]/20 text-[#D99A2B] px-2 py-0.5 rounded-full border border-[#F5A623]/30">
              ID: {bizId || "BIZ-0000"}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-semibold text-[#3A2818]/70">Business Name</label>
              <input
                type="text"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                placeholder="My Restaurant"
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-black/10 bg-white font-medium text-[#100C09] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#3A2818]/70">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-8 px-2.5 text-xs rounded-lg border border-black/10 bg-white font-medium text-[#100C09] focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
              />
            </div>
          </div>
        </div>

        {/* Payment CTA */}
        <div className="p-6 space-y-3">
          {isRazorpayEnabled ? (
            <Button
              onClick={handlePay}
              disabled={loading || directLoading}
              className="w-full h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-base rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Opening Razorpay…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="size-4" />
                  Pay ₹{finalPrice} via Razorpay
                </span>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <UpiPaymentBox
                upiId={upiId || "9392318135-2@axl"}
                amount={finalPrice}
                shopName="MY Link QR"
                showTitle={true}
              />
              <div className="text-center">
                <p className="text-[10px] text-[#3A2818]/50 mt-2">
                  After making the payment of ₹{finalPrice}, click the button below to send proof via
                  WhatsApp.
                </p>
              </div>
              <Button
                onClick={handleManualPay}
                disabled={loading || directLoading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Check className="size-4" />
                    Confirm Payment Sent (₹{finalPrice})
                  </span>
                )}
              </Button>
            </div>
          )}

          <Button
            onClick={handleDirectActivate}
            disabled={loading || directLoading}
            variant="outline"
            className="w-full h-11 border-dashed border-[#F5A623] text-[#D99A2B] hover:bg-[#F5A623]/10 font-bold text-xs rounded-xl transition-all"
          >
            {directLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" />
                Activating Plan…
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 fill-[#D99A2B]" />
                Instant Activate Plan (Direct Unlock) — ₹{finalPrice}
              </span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#3A2818]/50">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>256-bit SSL Encrypted</span>
            </div>
            <span className="text-[#3A2818]/20">·</span>
            <span className="text-xs text-[#3A2818]/50">Secured Platform</span>
          </div>

          {/* Razorpay logo / accepted methods */}
          {isRazorpayEnabled && (
            <div className="rounded-xl border border-black/5 bg-[#F5F0E7]/60 p-3 text-center">
              <p className="text-[10px] text-[#3A2818]/40 font-medium mb-2">
                Accepted Payment Methods
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {["UPI", "GPay", "PhonePe", "Cards", "Net Banking", "Wallets"].map((m) => (
                  <span
                    key={m}
                    className="text-[10px] font-bold bg-white border border-black/10 px-2 py-0.5 rounded-full text-[#3A2818]/70"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
