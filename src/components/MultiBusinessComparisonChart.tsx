import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Utensils, Coffee, Scissors, ShoppingBag, Hotel, Stethoscope, Dumbbell, Store, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export interface ComparisonCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  comp1Name: string;
  comp2Name: string;
  rows: {
    feature: string;
    comp1: string | boolean;
    comp2: string | boolean;
    mylink: string | boolean;
  }[];
}

export const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    id: "restaurant",
    name: "Restaurant & Food Truck",
    icon: Utensils,
    title: "We vs Zomato & Swiggy",
    subtitle:
      "Stop losing 18–30% commission on every order. Own your customers, your menu, and your revenue — for less than ₹30 a day.",
    comp1Name: "🍽 Zomato",
    comp2Name: "🛵 Swiggy",
    rows: [
      {
        feature: "Monthly cost to business",
        comp1: "₹5,000–25,000+",
        comp2: "₹5,000–25,000+",
        mylink: "₹249–799/mo",
      },
      { feature: "Commission per order", comp1: "18–30%", comp2: "18–30%", mylink: "0% (Zero!)" },
      { feature: "Your own branded menu", comp1: false, comp2: false, mylink: true },
      { feature: "Direct WhatsApp ordering", comp1: false, comp2: false, mylink: true },
      { feature: "QR code for your table / door", comp1: false, comp2: false, mylink: true },
      { feature: "Customer data ownership", comp1: false, comp2: false, mylink: true },
      { feature: "UPI / direct payments", comp1: false, comp2: false, mylink: true },
      { feature: "No middleman delivery fee", comp1: false, comp2: false, mylink: true },
      { feature: "Setup in minutes", comp1: false, comp2: false, mylink: true },
      { feature: "Offline QR menu (no internet required)", comp1: false, comp2: false, mylink: true },
      { feature: "Custom coupon codes", comp1: false, comp2: false, mylink: true },
      {
        feature: "Real-time menu updates",
        comp1: "Slow/manual",
        comp2: "Slow/manual",
        mylink: "Instant",
      },
    ],
  },
  {
    id: "cafe",
    name: "Cafe & Bakery",
    icon: Coffee,
    title: "We vs Aggregators & Paper Menus",
    subtitle:
      "Upgrade your coffee shop with instant QR scan menus, live dish photos, and direct WhatsApp takeaway orders.",
    comp1Name: "☕ Food Aggregators",
    comp2Name: "📋 Paper Menus",
    rows: [
      {
        feature: "Monthly cost / losses",
        comp1: "High commissions",
        comp2: "High reprint costs",
        mylink: "₹249–799/mo",
      },
      { feature: "Order commission fee", comp1: "18–30%", comp2: "N/A", mylink: "0% (Zero!)" },
      { feature: "High-resolution dish photos", comp1: "Limited", comp2: "Static text", mylink: true },
      { feature: "Instant price updates", comp1: "Slow approval", comp2: "Reprint required", mylink: true },
      { feature: "Multi-language auto-translate", comp1: false, comp2: false, mylink: true },
      { feature: "Direct GPay / PhonePe UPI", comp1: false, comp2: "Cash only", mylink: true },
      { feature: "Counter & takeaway WhatsApp cart", comp1: false, comp2: false, mylink: true },
      { feature: "Custom promo & coupon codes", comp1: false, comp2: false, mylink: true },
    ],
  },
  {
    id: "salon",
    name: "Salon & Spa",
    icon: Scissors,
    title: "We vs Booking Portals & Directories",
    subtitle:
      "Eliminate heavy marketplace booking fees. Let clients scan your salon QR code to view services, pricing, and book on WhatsApp.",
    comp1Name: "💇 UrbanCompany",
    comp2Name: "📖 Listing Portals",
    rows: [
      {
        feature: "Commission per booking",
        comp1: "20–35%",
        comp2: "Monthly listing fee",
        mylink: "0% (Zero!)",
      },
      { feature: "Direct client phone & ownership", comp1: false, comp2: false, mylink: true },
      { feature: "Custom service catalog & photos", comp1: "Generic template", comp2: "Text only", mylink: true },
      { feature: "Instant service price updates", comp1: "Delayed", comp2: "Slow", mylink: true },
      { feature: "Direct WhatsApp booking", comp1: false, comp2: false, mylink: true },
      { feature: "Printable mirror & counter QR stand", comp1: false, comp2: false, mylink: true },
      { feature: "Google Reviews booster link", comp1: false, comp2: false, mylink: true },
    ],
  },
  {
    id: "retail",
    name: "Retail & Boutique",
    icon: ShoppingBag,
    title: "We vs E-commerce Marketplaces",
    subtitle:
      "Showcase clothing, jewelry, or products directly to walk-in and online customers without paying platform commissions.",
    comp1Name: "📦 Amazon / Flipkart",
    comp2Name: "🌐 Complex E-com",
    rows: [
      {
        feature: "Sales referral & platform fee",
        comp1: "10–25%",
        comp2: "2–3% Payment fees",
        mylink: "0% (Zero!)",
      },
      { feature: "Product catalog setup time", comp1: "Days/weeks", comp2: "Complex build", mylink: "Under 5 mins" },
      { feature: "Direct customer connection", comp1: "Hidden by platform", comp2: "Email only", mylink: "Direct WhatsApp" },
      { feature: "In-store counter QR scanner", comp1: false, comp2: false, mylink: true },
      { feature: "Instant GPay / PhonePe payouts", comp1: "15-day settlement", comp2: "Weekly payouts", mylink: "Instant 0%" },
      { feature: "Custom discount coupons", comp1: "Restricted", comp2: "Add-on fee", mylink: true },
    ],
  },
  {
    id: "hotel",
    name: "Hotel & Resort",
    icon: Hotel,
    title: "We vs OTAs & Paper Room Binders",
    subtitle:
      "Replace expensive printed room binders and OTA commissions with smart room QR codes for room service and amenities.",
    comp1Name: "🏨 MakeMyTrip / OTAs",
    comp2Name: "📖 Paper Room Binders",
    rows: [
      {
        feature: "Booking / service commission",
        comp1: "15–25%",
        comp2: "High reprint costs",
        mylink: "0% (Zero!)",
      },
      { feature: "In-room QR dining & amenity menu", comp1: false, comp2: false, mylink: true },
      { feature: "Instant room service via WhatsApp", comp1: false, comp2: "Landline call", mylink: "Direct Room #" },
      { feature: "Multi-language guest menu", comp1: false, comp2: "English only", mylink: "8+ Languages" },
      { feature: "Instant price & item updates", comp1: "Slow", comp2: "Reprint binders", mylink: "Instant" },
      { feature: "Reception desk QR display", comp1: false, comp2: false, mylink: true },
    ],
  },
  {
    id: "clinic",
    name: "Clinic & Healthcare",
    icon: Stethoscope,
    title: "We vs Medical Listing Apps",
    subtitle:
      "Digitize clinic doctor services, consultation fees, and appointment bookings with branded QR codes.",
    comp1Name: "🩺 Practo / Listing Apps",
    comp2Name: "📋 Paper Brochures",
    rows: [
      {
        feature: "Per-patient consultation fee",
        comp1: "₹100–300/booking",
        comp2: "N/A",
        mylink: "0% (Zero!)",
      },
      { feature: "Direct patient WhatsApp contact", comp1: false, comp2: false, mylink: true },
      { feature: "Branded digital fee catalog", comp1: "Generic profile", comp2: "Static paper", mylink: true },
      { feature: "Direct UPI payment QR code", comp1: false, comp2: "Manual cash/card", mylink: "Direct GPay/PhonePe" },
      { feature: "Reception desk vector QR stand", comp1: false, comp2: false, mylink: true },
    ],
  },
  {
    id: "gym",
    name: "Gym & Fitness",
    icon: Dumbbell,
    title: "We vs Fitness Portals & Paper Flyers",
    subtitle:
      "Share membership packages, personal trainer fees, and class schedules directly on mobile with 0% payment fees.",
    comp1Name: "🏋️ Gym Portals",
    comp2Name: "📄 Printed Flyers",
    rows: [
      {
        feature: "Membership booking fee",
        comp1: "10–20%",
        comp2: "High print costs",
        mylink: "0% (Zero!)",
      },
      { feature: "Direct WhatsApp membership inquiry", comp1: false, comp2: false, mylink: true },
      { feature: "Digital package catalog", comp1: "Generic listing", comp2: "Paper flyer", mylink: true },
      { feature: "Instant 0% UPI payment QR", comp1: false, comp2: "Cash/POS", mylink: true },
      { feature: "Front desk QR stand", comp1: false, comp2: false, mylink: true },
    ],
  },
  {
    id: "grocery",
    name: "Grocery & General Store",
    icon: Store,
    title: "We vs Quick-Commerce Apps",
    subtitle:
      "Empower your local store with a digital product list, direct WhatsApp orders, and instant 0% UPI payments.",
    comp1Name: "🛒 Blinkit / Zepto",
    comp2Name: "📝 Telephone Orders",
    rows: [
      {
        feature: "Store commission & margin loss",
        comp1: "25–40%",
        comp2: "High order mistakes",
        mylink: "0% (Zero!)",
      },
      { feature: "Own your local customers", comp1: false, comp2: "Limited", mylink: true },
      { feature: "Digital product list & prices", comp1: "App controlled", comp2: "Memory only", mylink: true },
      { feature: "Direct GPay/PhonePe UPI", comp1: "Delayed payouts", comp2: "Cash on delivery", mylink: "Instant 0%" },
      { feature: "Counter QR code sticker", comp1: false, comp2: false, mylink: true },
    ],
  },
];

function CellValueRender({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="flex justify-center"
      >
        <div
          className={`size-7 rounded-full flex items-center justify-center shadow-md ${
            highlight
              ? "bg-gradient-to-br from-[#FFC45A] to-[#D99A2B] text-[#100C09] ring-2 ring-[#FFC45A]/40 shadow-[#FFC45A]/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          <Check className="size-4 stroke-[3]" />
        </div>
      </motion.div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <div className="size-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400/80">
          <X className="size-3.5 stroke-[2.5]" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div
        className={`text-center text-xs sm:text-sm px-2.5 py-0.5 rounded-full ${
          highlight
            ? "text-[#FFC45A] font-extrabold bg-[#FFC45A]/15 border border-[#FFC45A]/30 shadow-sm"
            : "text-red-400/90 font-semibold bg-red-500/10 border border-red-500/15"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function MultiBusinessComparisonChart() {
  const navigate = useNavigate();
  const [activeCatId, setActiveCatId] = useState<string>("restaurant");

  const activeCategory =
    COMPARISON_CATEGORIES.find((c) => c.id === activeCatId) ?? COMPARISON_CATEGORIES[0]!;

  return (
    <div className="w-full">
      {/* Category Chips Bar */}
      <div className="mb-10 text-center sm:text-left">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#D99A2B] mb-4 flex items-center gap-1.5 justify-center sm:justify-start">
          <Sparkles className="size-3.5 text-[#F5A623] animate-pulse" /> SELECT YOUR INDUSTRY CATEGORY
        </p>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          {COMPARISON_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeCatId;
            return (
              <motion.button
                key={cat.id}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCatId(cat.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#100C09] text-white border-[#F5A623] shadow-xl shadow-[#F5A623]/10 ring-2 ring-[#F5A623]/40"
                    : "bg-white text-[#100C09]/80 border-black/10 hover:border-[#F5A623]/50 hover:bg-[#F5A623]/10 hover:text-[#100C09]"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-[#F5A623]" : "text-[#D99A2B]"}`} />
                <span>{cat.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryBorder"
                    className="absolute inset-0 rounded-xl border-2 border-[#F5A623] pointer-events-none"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Header Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#D99A2B] mb-4 shadow-sm">
          <Sparkles className="size-3.5 text-[#F5A623]" /> WHY MY LINK QR?
        </div>
        <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#100C09] mb-3 leading-tight">
          {activeCategory.title}
        </h3>
        <p className="text-[#3A2818]/80 text-xs sm:text-sm max-w-xl mx-auto font-medium leading-relaxed">
          {activeCategory.subtitle}
        </p>
      </div>

      {/* Comparison Table Box with Animated Content */}
      <motion.div
        layout
        className="rounded-3xl border border-[#F5A623]/25 bg-[#100C09] shadow-[0_0_60px_rgba(245,166,35,0.12)] overflow-hidden backdrop-blur-2xl relative"
      >
        {/* Glow ambient spot */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F5A623]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* Table Header Bar */}
            <div className="grid grid-cols-4 bg-[#18120D] border-b border-white/10 text-xs sm:text-sm font-bold relative z-10">
              <div className="p-4 sm:p-5 text-white/60 flex items-center">Feature</div>
              <div className="p-4 sm:p-5 text-center flex items-center justify-center">
                <span className="bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm">
                  {activeCategory.comp1Name}
                </span>
              </div>
              <div className="p-4 sm:p-5 text-center flex items-center justify-center">
                <span className="bg-orange-500/15 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm">
                  {activeCategory.comp2Name}
                </span>
              </div>
              <div className="p-4 sm:p-5 text-center bg-gradient-to-b from-[#FFC45A]/30 via-[#FFC45A]/15 to-[#FFC45A]/10 text-[#FFC45A] flex items-center justify-center gap-1.5 border-l border-r border-[#FFC45A]/30 shadow-inner">
                <Sparkles className="size-4 text-[#FFC45A] animate-spin-slow" />
                <span className="font-extrabold tracking-wide text-xs sm:text-sm">⚡ MY Link QR</span>
              </div>
            </div>

            {/* Table Body Rows */}
            <div className="divide-y divide-white/5 relative z-10">
              {activeCategory.rows.map((row, i) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.035 }}
                  className={`grid grid-cols-4 transition-all duration-200 ${
                    i % 2 === 0 ? "bg-[#100C09]" : "bg-[#18120D]/60"
                  } hover:bg-white/5 hover:border-l-2 hover:border-l-[#FFC45A]`}
                >
                  <div className="p-3.5 sm:p-4 text-xs sm:text-sm font-semibold text-white/90 flex items-center">
                    {row.feature}
                  </div>
                  <div className="p-3.5 sm:p-4 flex items-center justify-center">
                    <CellValueRender value={row.comp1} />
                  </div>
                  <div className="p-3.5 sm:p-4 flex items-center justify-center">
                    <CellValueRender value={row.comp2} />
                  </div>
                  <div className="p-3.5 sm:p-4 flex items-center justify-center bg-[#FFC45A]/5 border-l border-r border-[#FFC45A]/20">
                    <CellValueRender value={row.mylink} highlight />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Table Footer Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#18120D] to-[#100C09] text-center border-t border-white/10 relative z-10">
              <p className="text-white/80 text-xs sm:text-sm mb-5 font-medium max-w-xl mx-auto leading-relaxed">
                Join hundreds of <span className="text-[#FFC45A] font-bold">{activeCategory.name.toLowerCase()}</span> businesses who switched to MY Link QR and stopped paying commissions.
              </p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05, boxShadow: "0 0 35px rgba(245,166,35,0.45)" }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate({ to: "/auth" })}
                className="relative group overflow-hidden bg-gradient-to-r from-[#FFC45A] via-[#F5A623] to-[#FFC45A] text-[#100C09] font-extrabold text-xs sm:text-sm px-9 py-4 rounded-full transition-all shadow-2xl cursor-pointer inline-flex items-center gap-2.5 border border-[#FFC45A]/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>Start Free — Zero commission forever</span>
                  <Check className="size-4 stroke-[3]" />
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
