import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  Globe2,
  Layers,
  MessageSquare,
  MessageCircle,
  Paintbrush,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Zap,
  DollarSign,
  CreditCard,
  QrCode as QrIcon,
  Tag,
  Star,
  Flame,
  Check,
  TrendingUp,
  Award,
  Download,
  Wand2,
  CheckCircle,
  Coins,
} from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Platform Features | MY Link QR" },
      {
        name: "description",
        content:
          "Explore all 16+ features of MY Link QR: AI menu generator, 6 luxury themes, WhatsApp ordering, UPI instant payments, and real-time scan analytics.",
      },
    ],
  }),
  component: FeaturesRoute,
});

type FeatureCategory = "all" | "ordering" | "design" | "payments" | "analytics";

interface FeatureItem {
  number: string;
  id: string;
  category: FeatureCategory;
  icon: any;
  tag: string;
  badgeColor: string;
  gradient: string;
  title: string;
  description: string;
  isMostProfitable?: boolean;
  plan: "Basic" | "Pro" | "Premium";
  points: string[];
}

const ALL_16_FEATURES: FeatureItem[] = [
  {
    number: "01",
    id: "instant-digital-presence",
    category: "ordering",
    icon: Zap,
    tag: "FAST SETUP",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    gradient: "from-amber-100/70 via-orange-50/50 to-yellow-50/30",
    title: "Instant Digital Presence",
    description:
      "Launch your customized mobile-first experience in less than 5 minutes. Zero coding required.",
    plan: "Basic",
    points: [
      "5-minute instant menu setup",
      "Mobile-first responsive layout",
      "Zero technical skills required",
      "Unique QR menu link & QR code",
    ],
  },
  {
    number: "02",
    id: "luxury-themes",
    category: "design",
    icon: Palette,
    tag: "DESIGN SYSTEM",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    gradient: "from-purple-100/70 via-pink-50/50 to-amber-50/30",
    title: "Beautiful Luxury Themes",
    description:
      "Choose from our collection of premium, handcrafted luxury themes designed to elevate your brand image.",
    plan: "Premium",
    points: [
      "6 Luxury Themes (Dark, Amber, Emerald, Cyber, Rose)",
      "Real-time 1-click theme switcher",
      "Custom brand logo & cover banner",
      "Glassmorphism dark & light modes",
    ],
  },
  {
    number: "03",
    id: "dynamic-smart-qr",
    category: "ordering",
    icon: QrIcon,
    tag: "ALWAYS LIVE",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    gradient: "from-blue-100/70 via-indigo-50/50 to-cyan-50/30",
    title: "Dynamic Smart QR Codes",
    description:
      "High-resolution branded QR codes. Update your menu or links anytime without reprinting physical cards.",
    plan: "Pro",
    points: [
      "Logo embedded in QR code center",
      "Always-live dynamic redirection",
      "300 DPI high-res print quality",
      "Zero reprint costs when updating prices",
    ],
  },
  {
    number: "04",
    id: "deep-realtime-analytics",
    category: "analytics",
    icon: BarChart3,
    tag: "DATA DRIVEN",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    gradient: "from-cyan-100/70 via-teal-50/50 to-emerald-50/30",
    title: "Deep Real-Time Analytics",
    description:
      "Track QR scans, unique visitors, peak viewing hours, and top-selling menu items with live charts.",
    plan: "Pro",
    points: [
      "Daily & monthly scan counters",
      "Peak visit hour metrics",
      "Device & browser breakdown",
      "Auto-purge 30-day retention & admin reset",
    ],
  },
  {
    number: "05",
    id: "direct-whatsapp-ordering",
    category: "ordering",
    icon: MessageCircle,
    tag: "ZERO COMMISSION",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    gradient: "from-emerald-100/70 via-green-50/50 to-teal-50/30",
    title: "Direct WhatsApp Ordering",
    description:
      "Let customers select items, enter table numbers, and send formatted orders directly to your staff WhatsApp.",
    plan: "Pro",
    points: [
      "Dine-in table ordering with table number",
      "Takeaway & home delivery options",
      "Itemized receipt formatted for staff",
      "Zero 15-30% aggregator commission fees",
    ],
  },
  {
    number: "06",
    id: "multi-language-engine",
    category: "design",
    icon: Globe2,
    tag: "GLOBAL SUPPORT",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    gradient: "from-teal-100/70 via-cyan-50/50 to-blue-50/30",
    title: "Multi-Language Engine",
    description:
      "Auto-translate your menu into English, Hindi, Arabic, Malayalam, French, and Spanish instantly.",
    plan: "Basic",
    points: [
      "Supports 8 regional & global languages",
      "Automatic customer language toggle",
      "Localized food dish names & categories",
      "Instant translation switcher on mobile",
    ],
  },
  {
    number: "07",
    id: "sub-second-ultra-fast-load",
    category: "ordering",
    icon: Smartphone,
    tag: "HIGH PERFORMANCE",
    badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
    gradient: "from-yellow-100/70 via-amber-50/50 to-orange-50/30",
    title: "Sub-Second Ultra Fast Load",
    description:
      "Optimized lightweight mobile microsites load in under 400ms on 3G, 4G, and Wi-Fi networks.",
    plan: "Basic",
    points: [
      "Sub-400ms page load speed",
      "Lightweight responsive assets",
      "Works on low 3G networks smoothly",
      "Zero app installation required for guests",
    ],
  },
  {
    number: "08",
    id: "tailored-for-any-industry",
    category: "design",
    icon: Store,
    tag: "VERSATILE",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    gradient: "from-indigo-100/70 via-purple-50/50 to-pink-50/30",
    title: "Tailored For Any Industry",
    description:
      "Pre-configured layouts for restaurants, cafes, bakeries, salons, spas, boutiques, clinics, and shops.",
    plan: "Basic",
    points: [
      "Presets for 18+ business niches",
      "Custom currency symbol support (₹, $, €, £)",
      "Opening hours & social link badges",
      "Flexible catalog & menu structures",
    ],
  },
  {
    number: "09",
    id: "enterprise-data-protection",
    category: "analytics",
    icon: ShieldCheck,
    tag: "SECURE",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    gradient: "from-rose-100/70 via-pink-50/50 to-red-50/30",
    title: "Enterprise Data Protection",
    description:
      "SSL encryption, automated backups, and 99.9% uptime SLA guarantee for continuous store operation.",
    plan: "Basic",
    points: [
      "SSL encrypted cloud storage",
      "Super admin role controls",
      "Automated database backups",
      "99.9% guaranteed uptime SLA",
    ],
  },
  {
    number: "10",
    id: "vector-qr-code-downloads",
    category: "ordering",
    icon: Download,
    tag: "PRINT READY",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-300",
    gradient: "from-violet-100/70 via-purple-50/50 to-indigo-50/30",
    title: "Vector QR Code Downloads",
    description:
      "Export 300 DPI vector SVG & high-res PNG files embedded with your logo for table stand printing.",
    plan: "Pro",
    points: [
      "Vector SVG & 300 DPI PNG exports",
      "Ready for acrylic table stands & stickers",
      "Custom branded logo center frame",
      "Lifetime active QR link",
    ],
  },
  {
    number: "11",
    id: "camera-photo-ocr-scanner",
    category: "ordering",
    icon: Wand2,
    tag: "AI POWERED",
    badgeColor: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    gradient: "from-fuchsia-100/70 via-pink-50/50 to-purple-50/30",
    title: "Camera Photo OCR Scanner",
    description:
      "Snap a photo of your existing paper menu and our OCR engine extracts item titles, prices & categories.",
    plan: "Pro",
    points: [
      "Optical character recognition (OCR)",
      "Extracts prices & item names automatically",
      "Upload paper menu photos or PDFs",
      "Instant category matching",
    ],
  },
  {
    number: "12",
    id: "ai-menu-generator",
    category: "ordering",
    icon: Sparkles,
    tag: "AI POWERED",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    gradient: "from-amber-100/70 via-yellow-50/50 to-orange-50/30",
    title: "AI Menu Generator",
    description:
      "Describe your business in plain words and watch AI generate full menu categories & items in seconds.",
    plan: "Pro",
    points: [
      "10-second automatic menu generation",
      "High-resolution food image matching",
      "AI dish descriptions & tags",
      "Instant category layout",
    ],
  },
  {
    number: "13",
    id: "live-scan-item-metrics",
    category: "analytics",
    icon: TrendingUp,
    tag: "INSIGHTS",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    gradient: "from-teal-100/70 via-emerald-50/50 to-cyan-50/30",
    title: "Live Scan & Item Metrics",
    description:
      "Real-time metrics tracking total scans, customer views, and top-performing menu dishes.",
    plan: "Pro",
    points: [
      "Track customer dish popularity",
      "Live visit counter on dashboard",
      "Scan history trends",
      "Exportable analytics reports",
    ],
  },
  {
    number: "14",
    id: "tailored-for-any-business",
    category: "design",
    icon: CheckCircle,
    tag: "ALL-IN-ONE",
    badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
    gradient: "from-sky-100/70 via-blue-50/50 to-indigo-50/30",
    title: "Tailored for Any Business",
    description:
      "Built specifically for restaurants, cafes, bakeries, salons, spa, boutiques, clinics, and local stores.",
    plan: "Basic",
    points: [
      "Customizable business profiles",
      "WhatsApp & phone contact buttons",
      "Address & Google Maps link integration",
      "Multi-category structured listing",
    ],
  },
  {
    number: "15",
    id: "zero-hidden-fees",
    category: "payments",
    icon: Coins,
    tag: "FINANCE",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    gradient: "from-emerald-100/70 via-green-50/50 to-teal-50/30",
    title: "Zero Hidden Fees",
    description:
      "Keep 100% of your earnings with zero per-order transaction fees or revenue commissions.",
    isMostProfitable: true,
    plan: "Basic",
    points: [
      "0% commission on orders",
      "Zero per-order transaction charges",
      "Fixed predictable subscription pricing",
      "100% merchant profit retention",
    ],
  },
  {
    number: "16",
    id: "24-7-priority-support",
    category: "analytics",
    icon: Sparkles,
    tag: "24/7 SUPPORT",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    gradient: "from-amber-100/70 via-orange-50/50 to-yellow-50/30",
    title: "24/7 Priority Support",
    description:
      "Direct WhatsApp & phone assistance to guide setup, menu uploads, and QR stand printing.",
    plan: "Premium",
    points: [
      "Dedicated WhatsApp assistance",
      "Guided onboarding & menu setup",
      "QR stand print design guidance",
      "Priority customer service",
    ],
  },
  {
    number: "17",
    id: "upi-instant-payments",
    category: "payments",
    icon: CreditCard,
    tag: "🔥 MOST PROFITABLE FEATURE",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold",
    gradient: "from-emerald-100/80 via-teal-50/60 to-amber-50/40",
    title: "Instant UPI Payments & Direct QR Code",
    description:
      "Accept payments directly via GPay, PhonePe, Paytm, or BHIM. Zero middleman fees and 100% instant bank settlements.",
    isMostProfitable: true,
    plan: "Premium",
    points: [
      "Auto-generated & custom QR code payment card",
      "Direct GPay, PhonePe, Paytm deep links",
      "Instant 0% commission payouts",
      "Copy UPI ID button with toast notifications",
    ],
  },
  {
    number: "18",
    id: "coupons-discounts",
    category: "payments",
    icon: Tag,
    tag: "MARKETING",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    gradient: "from-rose-100/70 via-pink-50/50 to-purple-50/30",
    title: "Discount & Coupon Code Engine",
    description:
      "Create promo codes (% off or flat amount off) with minimum order limits and expiration dates to boost sales.",
    plan: "Premium",
    points: [
      "Percentage & flat currency discounts",
      "Minimum order limit constraints",
      "Expiration date enforcement",
      "Instant cart discount calculation",
    ],
  },
  {
    number: "19",
    id: "google-reviews-integration",
    category: "analytics",
    icon: Star,
    tag: "REPUTATION BOOSTER",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    gradient: "from-amber-100/70 via-yellow-50/50 to-orange-50/30",
    title: "Google Reviews Integration",
    description:
      "Collect 5-star Google reviews directly from your mobile menu page to boost your restaurant local Maps ranking.",
    plan: "Premium",
    points: [
      "One-tap Google Review popup link",
      "Custom review prompt banner",
      "Boosts local Google Maps ranking",
      "Increases customer trust & walk-ins",
    ],
  },
];

function FeaturesRoute() {
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>("all");

  const filteredFeatures =
    activeCategory === "all"
      ? ALL_16_FEATURES
      : ALL_16_FEATURES.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#100C09] selection:bg-[#F5A623]/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Hero Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-4 py-1.5 text-xs font-bold text-[#D99A2B] uppercase tracking-widest mb-6">
            <Zap className="size-3.5 text-[#D99A2B]" /> All 16+ Platform Features
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight text-[#100C09]">
            Everything You Need to <br />
            <span className="text-[#F5A623] italic">Succeed & Multiply Profits</span>
          </h1>

          <p className="text-base sm:text-lg text-[#3A2818]/80 max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
            From direct WhatsApp ordering and instant UPI payments to AI menu generation, 6 luxury themes, and live analytics — explore all 16+ powerful features built for your store.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-[#100C09] hover:bg-[#F5A623] text-white font-bold h-12 px-8 text-sm shadow-xl transition-all hover:scale-105">
              <Link to="/auth">
                Start Free 7-Day Trial <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-black/20 bg-white text-[#100C09] hover:bg-black/5 font-bold h-12 px-8 text-sm shadow-sm transition-all hover:scale-105"
            >
              <Link to="/pricing">View Pricing Plans</Link>
            </Button>
          </div>
        </section>

        {/* Highlight Banner: Most Profitable Feature */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-14 md:mt-20">
          <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 sm:p-10 shadow-xl relative overflow-hidden text-[#100C09] group hover:border-emerald-500 transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/15 border border-emerald-600/30 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  <Flame className="size-3.5 text-emerald-600" /> Most Profitable Feature #1
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#100C09]">
                  WhatsApp Direct Ordering + Instant 0% Fee UPI Payments
                </h2>
                <p className="text-sm text-[#3A2818]/80 leading-relaxed font-medium">
                  Eliminate 15%–30% food aggregator commission fees. Accept orders directly to your staff WhatsApp with payments deposited straight to your UPI ID (<code className="text-emerald-800 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded">GPay, PhonePe, Paytm</code>) with <strong className="text-emerald-800 font-bold">0% fees</strong>.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-[#3A2818]/90 font-semibold pt-1">
                  <span className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-600 stroke-[3]" /> Save ₹15,000+ monthly in fees
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="size-4 text-emerald-600 stroke-[3]" /> 100% Instant bank settlements
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto">
                <Button asChild size="lg" className="w-full md:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-8 shadow-lg hover:scale-105 transition-all">
                  <Link to="/auth">Unlock UPI Payments</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Category Tabs */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl border border-black/10 bg-white shadow-md">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === "all"
                  ? "bg-[#100C09] text-white shadow-md"
                  : "text-[#3A2818]/70 hover:text-[#100C09] hover:bg-black/5"
              }`}
            >
              All 16+ Features ({ALL_16_FEATURES.length})
            </button>
            <button
              onClick={() => setActiveCategory("payments")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === "payments"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-[#3A2818]/70 hover:text-[#100C09] hover:bg-black/5"
              }`}
            >
              🔥 Payments & Revenue
            </button>
            <button
              onClick={() => setActiveCategory("ordering")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === "ordering"
                  ? "bg-[#100C09] text-white shadow-md"
                  : "text-[#3A2818]/70 hover:text-[#100C09] hover:bg-black/5"
              }`}
            >
              Ordering & Menu AI
            </button>
            <button
              onClick={() => setActiveCategory("design")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === "design"
                  ? "bg-[#100C09] text-white shadow-md"
                  : "text-[#3A2818]/70 hover:text-[#100C09] hover:bg-black/5"
              }`}
            >
              Design & Themes
            </button>
            <button
              onClick={() => setActiveCategory("analytics")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeCategory === "analytics"
                  ? "bg-[#100C09] text-white shadow-md"
                  : "text-[#3A2818]/70 hover:text-[#100C09] hover:bg-black/5"
              }`}
            >
              Analytics & Stats
            </button>
          </div>
        </section>

        {/* Feature Cards Grid - All Cards with Colorful Hover Gradient Fill */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className={`group relative flex flex-col justify-between rounded-3xl bg-white border p-7 sm:p-8 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl overflow-hidden ${
                    feat.isMostProfitable
                      ? "border-emerald-500/60 hover:border-emerald-600 ring-2 ring-emerald-500/20"
                      : "border-black/10 hover:border-[#F5A623]"
                  }`}
                >
                  {/* Vibrant Pastel Gradient Fill Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl`}
                  />

                  <div className="relative z-10">
                    {/* Top Row: Gold Number & Orange Square Icon Box */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#F5A623] transition-colors duration-300">
                        {feat.number}
                      </span>
                      <div
                        className="size-12 sm:size-14 rounded-2xl bg-[#F5A623] text-white border border-black/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md"
                      >
                        <Icon className="size-6 sm:size-7" />
                      </div>
                    </div>

                    {/* Tag Badge & Plan Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider border ${feat.badgeColor}`}
                      >
                        {feat.tag}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#100C09]/5 border border-black/10 text-[#100C09]/75">
                        {feat.plan} Plan
                      </span>
                    </div>

                    {/* Feature Title in Gold/Amber */}
                    <h3 className="font-display font-bold text-2xl mb-3 text-[#F5A623] group-hover:text-[#D99A2B] transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#3A2818]/90 leading-relaxed mb-6 font-medium">
                      {feat.description}
                    </p>
                  </div>

                  {/* Bottom Row: Points List & Action Link */}
                  <div className="relative z-10 pt-5 border-t border-black/10">
                    <ul className="space-y-2 text-xs text-[#3A2818]/90 font-semibold mb-5">
                      {feat.points.map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-[#F5A623] shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/auth"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5A623] hover:text-[#D99A2B] transition-colors group-hover:translate-x-1"
                    >
                      <span>Try Feature Now</span>
                      <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="rounded-3xl border border-[#F5A623]/30 bg-gradient-to-br from-[#100C09] via-[#18120D] to-[#100C09] p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden text-white">
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-white">
                Ready to Upgrade Your Restaurant Experience?
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto mb-8 font-medium">
                Join hundreds of restaurants, cafes, and bakeries using MY Link QR to boost sales
                and customer satisfaction.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-full bg-[#FFC45A] hover:bg-[#FFC45A]/90 text-[#100C09] font-bold h-12 px-8 text-sm shadow-xl hover:scale-105 transition-all">
                  <Link to="/auth">Create Your QR Menu Now</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold h-12 px-8 text-sm hover:scale-105 transition-all"
                >
                  <Link to="/demo">Watch Video Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
