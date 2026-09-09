import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles, X, Minus, ShieldCheck, Loader2, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PLANS, parsePriceNumber, type PlanItem } from "@/lib/shop";
import { useCustomPlans } from "@/hooks/useShopData";
import { RazorpayModal } from "@/components/RazorpayModal";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/payment.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  { feature: "Social media link", trial: false, basic: true, pro: true, premium: true },
  { feature: "Opening hours display", trial: false, basic: true, pro: true, premium: true },
  { feature: "Multiple languages support", trial: false, basic: true, pro: true, premium: true },
  { feature: "WhatsApp ordering & cart", trial: false, basic: false, pro: true, premium: true },
  { feature: "On-Table dining", trial: false, basic: false, pro: true, premium: true },
  { feature: "Take-away orders", trial: false, basic: false, pro: true, premium: true },
  { feature: "Full analytics dashboard", trial: false, basic: false, pro: true, premium: true },
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
  { feature: "Custom themes", trial: false, basic: false, pro: false, premium: true },
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

function PricingPage() {
  const navigate = useNavigate();
  const { data: plans = PLANS } = useCustomPlans();
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  const handlePlanClick = (p: PlanItem) => {
    if (p.id === "trial") {
      navigate({ to: "/auth" });
    } else {
      setSelectedPlan(p);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    navigate({ to: "/dashboard" });
  };

  const priceOf = (p: PlanItem) => p.priceNumber ?? parsePriceNumber(p.price);

  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#100C09] font-sans selection:bg-[#F5A623]/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#D99A2B] mb-6">
            <Sparkles className="size-3.5" /> Simple Plans for Every Business
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-[#100C09]">
            Simple plans for <span className="italic text-[#F5A623]">every business</span>
          </h1>

          <p className="text-base sm:text-lg text-[#3A2818]/70 max-w-2xl mx-auto leading-relaxed font-medium">
            No hidden fees. Pay securely via Razorpay. Upgrade or cancel anytime.
          </p>
        </section>

        {/* 4 Plans Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto items-stretch">
            {plans.map((p: PlanItem) => (
              <div
                key={p.id}
                className={`relative rounded-3xl bg-white p-6 sm:p-7 border ${
                  p.highlight
                    ? "border-[#F5A623] shadow-2xl ring-2 ring-[#F5A623]/30"
                    : "border-black/10 shadow-xl hover:border-[#F5A623]/40"
                } flex flex-col justify-between transition-all duration-300`}
              >
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div>
                  <h2 className="font-display text-2xl font-bold mb-1 text-[#100C09]">{p.name}</h2>
                  <p className="text-xs text-[#3A2818]/70 mb-6 min-h-[32px] leading-relaxed font-medium">
                    {p.tagline}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6 border-b border-black/10 pb-6">
                    <span className="font-display text-4xl font-extrabold text-[#100C09]">
                      {p.price}
                    </span>
                    <span className="text-[#3A2818]/70 text-xs font-medium">/period</span>
                  </div>

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
                      p.highlight
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
            ))}
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
                  className={`p-4 text-center text-sm font-bold ${name === "Premium" ? "text-[#D99A2B]" : "text-[#100C09]"}`}
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
                  <Cell value={row.pro} />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <Cell value={row.premium} highlight />
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
                      p.highlight
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

        {/* ── MY Link QR vs Zomato / Swiggy ── */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-500 mb-5">
              Why MY Link QR?
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#100C09] mb-3">
              We vs <span className="text-red-500">Zomato</span> &amp;{" "}
              <span className="text-orange-500">Swiggy</span>
            </h2>
            <p className="text-[#3A2818]/60 text-sm font-medium max-w-xl mx-auto">
              Stop losing 18–30% commission on every order. Own your customers, your menu, and your
              revenue — for less than ₹30 a day.
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
            <div className="grid grid-cols-4 bg-[#100C09]">
              <div className="p-4 text-sm font-bold text-white/60">Feature</div>
              <div className="p-4 text-center">
                <span className="text-sm font-bold text-red-400">🍽 Zomato</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-bold text-orange-400">🛵 Swiggy</span>
              </div>
              <div className="p-4 text-center bg-[#F5A623]/20">
                <span className="text-sm font-bold text-[#F5A623]">⚡ MY Link QR</span>
              </div>
            </div>

            {ZOMATO_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 border-b border-black/5 ${i % 2 === 0 ? "bg-white" : "bg-[#F5F0E7]/40"}`}
              >
                <div className="p-3.5 text-xs font-medium text-[#3A2818]/80">{row.feature}</div>
                <div className="p-3.5 flex items-center justify-center">
                  <ZCell value={row.zomato} />
                </div>
                <div className="p-3.5 flex items-center justify-center">
                  <ZCell value={row.swiggy} />
                </div>
                <div className="p-3.5 flex items-center justify-center bg-[#F5A623]/5">
                  <ZCell value={row.mylink} highlight />
                </div>
              </div>
            ))}

            <div className="p-6 bg-[#100C09] text-center">
              <p className="text-white/50 text-xs mb-4">
                Join hundreds of restaurants, cafes &amp; shops who switched to MY Link QR and
                stopped paying commission.
              </p>
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="bg-[#F5A623] text-black font-bold text-sm px-8 py-2.5 rounded-full hover:bg-[#e09615] transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                Start Free — Zero commission forever ✓
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Razorpay Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <RazorpayModal
            plan={selectedPlan}
            price={priceOf(selectedPlan)}
            onClose={() => setSelectedPlan(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
