import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles, X, Minus, ShieldCheck, Loader2, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PLANS, parsePriceNumber, calculatePlanSavings, type PlanItem } from "@/lib/shop";
import { useCustomPlans } from "@/hooks/useShopData";
import { RazorpayModal } from "@/components/RazorpayModal";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/payment.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MultiBusinessComparisonChart } from "@/components/MultiBusinessComparisonChart";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Plans — MY Link QR" },
      {
        name: "description",
        content:
          "Simple, transparent pricing for local businesses, restaurants, and shops. Choose Trial, Basic, Pro, or Premium.",
      },
      { property: "og:title", content: "Pricing Plans — MY Link QR" },
      { property: "og:description", content: "Simple, transparent pricing for every business." },
    ],
  }),
  component: PricingPage,
});

// ── Comparison data ──────────────────────────────────────────────────────────

type CellValue = boolean | string;

interface CompRow {
  feature: string;
  trial: CellValue;
  basic: CellValue;
  pro: CellValue;
  premium: CellValue;
}

const COMPARE_ROWS: CompRow[] = [
  { feature: "Digital QR menu page", trial: true, basic: true, pro: true, premium: true },
  { feature: "Menu items", trial: "5", basic: "50", pro: "Unlimited", premium: "Unlimited" },
  { feature: "Categories", trial: "2", basic: "5", pro: "Unlimited", premium: "Unlimited" },
  { feature: "Business logo & cover photo", trial: false, basic: true, pro: true, premium: true },
  { feature: "Instagram link", trial: false, basic: true, pro: true, premium: true },
  {
    feature: "Advanced social media links (Facebook, X, Website)",
    trial: false,
    basic: false,
    pro: true,
    premium: true,
  },
  { feature: "Opening hours display", trial: false, basic: true, pro: true, premium: true },
  { feature: "Multiple languages support", trial: false, basic: true, pro: true, premium: true },
  { feature: "WhatsApp ordering & cart", trial: false, basic: false, pro: true, premium: true },
  { feature: "On-Table dining", trial: false, basic: false, pro: true, premium: true },
  { feature: "Take-away orders", trial: false, basic: false, pro: true, premium: true },
  { feature: "Full analytics dashboard", trial: false, basic: false, pro: false, premium: true },
  { feature: "AI menu generator", trial: false, basic: false, pro: true, premium: true },
  { feature: "PNG / SVG / PDF QR downloads", trial: false, basic: false, pro: true, premium: true },
  { feature: "Delivery options", trial: false, basic: false, pro: false, premium: true },
  { feature: "Coupon & discount codes", trial: false, basic: false, pro: false, premium: true },
  {
    feature: "UPI Payments (GPay / PhonePe)",
    trial: false,
    basic: false,
    pro: false,
    premium: true,
  },
  {
    feature: "QR Code Themes",
    trial: "3 Standard",
    basic: "6 Standard",
    pro: "12 Themes",
    premium: "All 18 Themes",
  },
  { feature: "Google Reviews integration", trial: false, basic: false, pro: false, premium: true },
  { feature: "Custom domain", trial: false, basic: false, pro: false, premium: true },
  { feature: "Priority support", trial: false, basic: false, pro: false, premium: true },
];

interface ZomatoRow {
  feature: string;
  zomato: CellValue;
  swiggy: CellValue;
  mylink: CellValue;
}

const ZOMATO_ROWS: ZomatoRow[] = [
  {
    feature: "Monthly cost to business",
    zomato: "₹5,000–25,000+",
    swiggy: "₹5,000–25,000+",
    mylink: "₹249–799/mo",
  },
  { feature: "Commission per order", zomato: "18–30%", swiggy: "18–30%", mylink: "0% (Zero!)" },
  { feature: "Your own branded menu", zomato: false, swiggy: false, mylink: true },
  { feature: "Direct WhatsApp ordering", zomato: false, swiggy: false, mylink: true },
  { feature: "QR code for your table / door", zomato: false, swiggy: false, mylink: true },
  { feature: "Customer data ownership", zomato: false, swiggy: false, mylink: true },
  { feature: "UPI / direct payments", zomato: false, swiggy: false, mylink: true },
  { feature: "No middleman delivery fee", zomato: false, swiggy: false, mylink: true },
  { feature: "Setup in minutes", zomato: false, swiggy: false, mylink: true },
  { feature: "Offline QR menu (no internet required)", zomato: false, swiggy: false, mylink: true },
  { feature: "Custom coupon codes", zomato: false, swiggy: false, mylink: true },
  {
    feature: "Real-time menu updates",
    zomato: "Slow/manual",
    swiggy: "Slow/manual",
    mylink: "Instant",
  },
];

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true) {
    return (
      <div className={`flex justify-center ${highlight ? "text-[#F5A623]" : "text-emerald-600"}`}>
        <div
          className={`size-5 rounded-full flex items-center justify-center ${highlight ? "bg-[#F5A623]/10" : "bg-emerald-100"}`}
        >
          <Check className="size-3" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center text-[#C0B8AF]">
        <Minus className="size-4" />
      </div>
    );
  }
  return (
    <div
      className={`text-center text-xs font-semibold ${highlight ? "text-[#D99A2B]" : "text-[#3A2818]/70"}`}
    >
      {value}
    </div>
  );
}

function ZCell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true) {
    return (
      <div className={`flex justify-center ${highlight ? "text-[#F5A623]" : "text-[#3A2818]/50"}`}>
        <div
          className={`size-5 rounded-full flex items-center justify-center ${highlight ? "bg-[#F5A623]/15" : "bg-black/5"}`}
        >
          <Check className="size-3" />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center text-red-400">
        <div className="size-5 rounded-full bg-red-50 flex items-center justify-center">
          <X className="size-3" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`text-center text-xs font-semibold ${highlight ? "text-[#D99A2B] font-bold" : "text-red-500"}`}
    >
      {value}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

import { useAuth } from "@/hooks/useAuth";

function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plans = PLANS } = useCustomPlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handlePlanClick = (p: PlanItem) => {
    if (!user) {
      navigate({
        to: "/auth",
        search: { tab: "signup", plan: p.id, cycle: billingCycle },
      });
      return;
    }
    if (p.id === "trial") {
      navigate({ to: "/dashboard" });
    } else {
      setSelectedPlan(p);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    navigate({ to: "/dashboard" });
  };

  const priceOf = (p: PlanItem) => {
    if (p.id === "trial") return 0;
    if (billingCycle === "yearly") {
      return p.yearlyPriceNumber || (p.priceNumber ? p.priceNumber * 12 : 0);
    }
    return p.priceNumber ?? parsePriceNumber(p.price);
  };

  const priceDisplayOf = (p: PlanItem) => {
    if (p.id === "trial") return "Free";
    if (billingCycle === "yearly") {
      const val = p.yearlyPriceNumber || (p.priceNumber ? p.priceNumber * 12 : 0);
      return `₹${val.toLocaleString("en-IN")}`;
    }
    const val = p.priceNumber ?? parsePriceNumber(p.price);
    return `₹${val}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#100C09] font-sans selection:bg-[#F5A623]/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#D99A2B] mb-6">
            <Sparkles className="size-3.5" /> Simple Plans for Every Business
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-[#100C09]">
            Simple plans for <span className="italic text-[#F5A623]">every business</span>
          </h1>

          <p className="text-base sm:text-lg text-[#3A2818]/70 max-w-2xl mx-auto leading-relaxed font-medium mb-8">
            No hidden fees. Upgrade or cancel anytime. Get 2 months extra free on annual
            subscriptions!
          </p>

          {/* Billing Cycle Toggle Switch */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white border border-black/10 shadow-md">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-[#100C09] text-white shadow-sm"
                  : "text-[#3A2818]/70 hover:text-[#100C09]"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-[#F5A623] text-white shadow-sm"
                  : "text-[#3A2818]/70 hover:text-[#100C09]"
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
                2 Mos Extra Free!
              </span>
            </button>
          </div>
        </section>

        {/* 4 Plans Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto items-stretch">
            {plans.map((p: PlanItem) => {
              const isPopular = Boolean(p.highlight || p.badge === "MOST POPULAR");
              const extraMonths = typeof p.extraMonths === "number" ? p.extraMonths : 2;
              const totalMonths = 12 + extraMonths;

              return (
                <div
                  key={p.id}
                  className={`relative rounded-3xl bg-white p-6 sm:p-7 border ${
                    isPopular
                      ? "border-[#F5A623] shadow-2xl ring-2 ring-[#F5A623]/30"
                      : "border-black/10 shadow-xl hover:border-[#F5A623]/40"
                  } flex flex-col justify-between transition-all duration-300`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <h2 className="font-display text-2xl font-bold mb-1 text-[#100C09]">
                      {p.name}
                    </h2>
                    <p className="text-xs text-[#3A2818]/70 mb-4 min-h-[32px] leading-relaxed font-medium">
                      {p.tagline}
                    </p>

                    {(() => {
                      const sav = calculatePlanSavings(p);
                      const isYearly = billingCycle === "yearly" && p.id !== "trial";

                      return (
                        <>
                          <div className="flex flex-col mb-2">
                            {isYearly && sav.monthly12x > sav.yearlyPrice && (
                              <div className="flex items-center gap-2 text-xs text-[#3A2818]/50 line-through font-semibold">
                                <span>12x Regular: ₹{sav.monthly12x.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="font-display text-4xl font-extrabold text-[#100C09]">
                                {priceDisplayOf(p)}
                              </span>
                              <span className="text-[#3A2818]/70 text-xs font-medium">
                                /{isYearly ? "year" : "month"}
                              </span>
                              {isYearly && sav.effectiveMonthly > 0 && (
                                <span className="text-[11px] text-emerald-700 font-bold ml-1.5">
                                  (₹{sav.effectiveMonthly}/mo)
                                </span>
                              )}
                            </div>
                          </div>

                          {isYearly ? (
                            <div className="mb-6 pb-4 border-b border-black/10 space-y-1.5">
                              {sav.savingsAmount > 0 && (
                                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                                  💥 SAVE ₹{sav.savingsAmount.toLocaleString("en-IN")} (
                                  {sav.discountPercent}% OFF)
                                </div>
                              )}
                              <div>
                                <span className="text-[11px] font-bold text-[#D99A2B] bg-[#F5A623]/15 px-2.5 py-1 rounded-md border border-[#F5A623]/30 inline-block">
                                  🎁 {totalMonths} Months Access (
                                  {extraMonths > 0
                                    ? `12 Mos + ${extraMonths} ${extraMonths === 1 ? "Mo" : "Mos"} Extra Free`
                                    : "12 Months Access"}
                                  )
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-6 pb-4 border-b border-black/10">
                              <span className="text-[11px] text-[#3A2818]/50 font-medium">
                                Billed monthly, cancel anytime
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <ul className="space-y-3 mb-8 text-xs text-[#3A2818]/80 font-medium">
                      {p.features.map((f: string) => (
                        <li key={f} className="flex items-center gap-2.5">
                          <div className="size-4 rounded-full bg-[#F5A623]/20 text-[#D99A2B] flex items-center justify-center shrink-0">
                            <Check className="size-2.5" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => handlePlanClick(p)}
                      size="lg"
                      className={`w-full rounded-full font-bold h-11 text-xs ${
                        isPopular
                          ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90 shadow-lg"
                          : "bg-[#F5A623] text-white hover:bg-[#F5A623]/90 shadow-md"
                      }`}
                    >
                      {p.id === "trial" ? "Start Free" : `Choose ${p.name}`}
                    </Button>
                    {p.id !== "trial" && (
                      <p className="text-center text-[10px] text-[#3A2818]/40 flex items-center justify-center gap-1">
                        <Lock className="size-2.5" /> Secured by Razorpay
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Compare Every Feature Table ── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#100C09] mb-3">
              Compare every feature
            </h2>
            <p className="text-[#3A2818]/60 text-sm font-medium">
              See exactly what you get with each plan — no surprises.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
            <div className="grid grid-cols-5 bg-[#F5F0E7] border-b border-black/10">
              <div className="p-4 text-sm font-bold text-[#100C09]">Feature</div>
              {["Trial", "Basic", "Pro", "Premium"].map((name) => (
                <div
                  key={name}
                  className={`p-4 text-center text-sm font-bold ${name === "Pro" ? "text-[#D99A2B]" : "text-[#100C09]"}`}
                >
                  {name}
                </div>
              ))}
            </div>

            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 border-b border-black/5 ${i % 2 === 0 ? "bg-white" : "bg-[#F5F0E7]/40"} hover:bg-[#F5A623]/5 transition-colors`}
              >
                <div className="p-3.5 text-xs font-medium text-[#3A2818]/80">{row.feature}</div>
                <div className="p-3.5 flex items-center justify-center">
                  <Cell value={row.trial} />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <Cell value={row.basic} />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <Cell value={row.pro} highlight />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <Cell value={row.premium} />
                </div>
              </div>
            ))}

            <div className="grid grid-cols-5 bg-[#F5F0E7] pt-5 pb-6">
              <div className="p-3" />
              {PLANS.map((p) => (
                <div key={p.id} className="px-3 flex items-center justify-center">
                  <button
                    onClick={() => handlePlanClick(p)}
                    className={`w-full text-xs font-bold py-2 rounded-full transition-all ${
                      p.id === "pro" || p.highlight
                        ? "bg-[#F5A623] text-white shadow-lg hover:bg-[#e09615]"
                        : "bg-white border border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                    }`}
                  >
                    {p.id === "trial" ? "Start Free" : `Get ${p.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Multi-Business Comparison Chart ── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 max-w-5xl">
          <MultiBusinessComparisonChart />
        </section>
      </main>

      <Footer />

      {/* Razorpay Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <RazorpayModal
            plan={selectedPlan}
            price={priceOf(selectedPlan)}
            billingCycle={billingCycle}
            onClose={() => setSelectedPlan(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
