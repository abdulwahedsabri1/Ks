import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Smartphone,
  Store,
  Paintbrush,
  BarChart3,
  Globe2,
  Zap,
  QrCode,
  ShieldCheck,
  MessageCircle,
  Wand2,
  Sparkles,
  ArrowRight,
  Coins,
  Download,
  CheckCircle,
  TrendingUp,
  CreditCard,
  Flame,
  Star,
} from "lucide-react";

const features = [
  {
    number: "01",
    title: "Instant UPI Payments & Direct QR Code",
    description:
      "Accept customer payments directly to your bank account via GPay, PhonePe, Paytm or BHIM with zero middleman fees. 100% instant payouts.",
    tag: "🔥 Most Profitable Feature",
    badgeColor: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    gradient: "from-emerald-500/25 via-teal-500/15 to-transparent",
    icon: CreditCard,
    highlight: true,
  },
  {
    number: "02",
    title: "Direct WhatsApp Ordering & Cart",
    description:
      "Allow guests to browse items, select table numbers or delivery options, and send itemized cart receipts directly to staff WhatsApp.",
    tag: "Top 5 Feature ⭐",
    badgeColor: "bg-green-500/15 text-green-700 border-green-500/30",
    gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    icon: MessageCircle,
  },
  {
    number: "03",
    title: "Beautiful Luxury Themes",
    description:
      "Choose from our collection of premium, handcrafted luxury themes designed to elevate your brand image.",
    tag: "Top 5 Feature ⭐",
    badgeColor: "bg-purple-500/15 text-purple-700 border-purple-500/30",
    gradient: "from-purple-500/20 via-pink-500/10 to-transparent",
    icon: Paintbrush,
  },
  {
    number: "04",
    title: "AI Menu Generator & OCR Scanner",
    description:
      "Snap a photo of your paper menu or describe your restaurant in words — AI automatically builds your menu in 10 seconds.",
    tag: "Top 5 Feature ⭐",
    badgeColor: "bg-amber-500/15 text-amber-700 border-amber-500/30",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    icon: Wand2,
  },
  {
    number: "05",
    title: "Deep Real-Time Analytics",
    description:
      "Track QR scans, unique visitors, peak viewing hours, and top-selling menu items with live interactive graphs.",
    tag: "Top 5 Feature ⭐",
    badgeColor: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30",
    gradient: "from-cyan-500/20 via-teal-500/10 to-transparent",
    icon: BarChart3,
  },
  {
    number: "06",
    title: "Dynamic Smart QR Codes",
    description:
      "High-resolution branded QR codes. Update your menu or links anytime without reprinting physical cards.",
    tag: "Always Live",
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: QrCode,
  },
  {
    number: "07",
    title: "Multi-Language Engine",
    description:
      "Auto-translate your menu into English, Hindi, Arabic, Malayalam, French, and Spanish instantly.",
    tag: "Global Support",
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    icon: Globe2,
  },
  {
    number: "08",
    title: "Sub-Second Ultra Fast Load",
    description:
      "Optimized lightweight mobile microsites load in under 400ms on 3G, 4G, and Wi-Fi networks.",
    tag: "High Performance",
    gradient: "from-yellow-500/20 via-amber-500/10 to-transparent",
    badgeColor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: Smartphone,
  },
  {
    number: "09",
    title: "Tailored For Any Industry",
    description:
      "Pre-configured layouts for restaurants, cafes, bakeries, salons, spas, boutiques, clinics, and shops.",
    tag: "Versatile",
    gradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    icon: Store,
  },
  {
    number: "10",
    title: "Vector QR Code Downloads",
    description:
      "Export 300 DPI vector SVG & high-res PNG files embedded with your logo for table stand printing.",
    tag: "Print Ready",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    badgeColor: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    icon: Download,
  },
  {
    number: "11",
    title: "Zero Hidden Fees",
    description:
      "Keep 100% of your earnings with zero per-order transaction fees or revenue commissions.",
    tag: "Finance",
    gradient: "from-emerald-500/20 via-green-500/10 to-transparent",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Coins,
  },
  {
    number: "12",
    title: "24/7 Priority Support",
    description:
      "Direct WhatsApp & phone assistance to guide setup, menu uploads, and QR stand printing.",
    tag: "24/7 Support",
    gradient: "from-[#F5A623]/20 via-amber-500/10 to-transparent",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Sparkles,
  },
];

export function FeaturesSection() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-82%"]);

  return (
    <section
      ref={targetRef}
      id="features"
      className="relative h-[350vh] bg-[#FDFBF7] text-[#100C09]"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-200/40 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col w-full h-full justify-between py-12 md:py-16">
          {/* Header */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 shrink-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5A623]/15 border border-[#F5A623]/30 text-xs font-bold uppercase tracking-widest text-[#D99A2B] mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Top Features & ROI Engine
                </motion.div>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#100C09]">
                  Everything you need to <span className="italic text-[#F5A623]">succeed</span>
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#100C09] text-[#FFC45A] hover:bg-[#F5A623] hover:text-white transition-all text-xs font-bold shadow-md"
                >
                  <span>Explore All 16 Features</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Horizontal Scrolling Track */}
          <div className="relative w-full overflow-hidden my-auto py-6">
            <motion.div style={{ x }} className="flex gap-6 md:gap-8 px-4 sm:px-8 w-max">
              {features.map((feature) => (
                <div
                  key={feature.number}
                  className={`group relative w-[300px] sm:w-[380px] md:w-[440px] shrink-0 rounded-3xl bg-white border p-6 sm:p-8 md:p-10 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col justify-between overflow-hidden ${
                    feature.highlight
                      ? "border-emerald-500/60 ring-2 ring-emerald-500/20 hover:border-emerald-500"
                      : "border-black/10 hover:border-[#F5A623]/50"
                  }`}
                >
                  {/* Subtle Card Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-20 group-hover:opacity-100 transition-opacity duration-500`}
                  />

                  {/* Card Top */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[#100C09]/20 group-hover:text-[#F5A623] transition-colors duration-300">
                        {feature.number}
                      </span>
                      <div
                        className={`size-12 sm:size-14 rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-md ${
                          feature.highlight
                            ? "bg-emerald-600 text-white border-emerald-400 group-hover:scale-110"
                            : "bg-[#100C09] text-[#FFC45A] border-black/10 group-hover:scale-110 group-hover:bg-[#F5A623] group-hover:text-white"
                        }`}
                      >
                        <feature.icon className="size-6 sm:size-7" />
                      </div>
                    </div>

                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${feature.badgeColor}`}
                      >
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#100C09] mb-3 group-hover:text-[#F5A623] transition-colors duration-300">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Card Bottom */}
                  <div className="relative z-10 pt-4 border-t border-black/10 mt-6">
                    <p className="text-sm sm:text-base text-[#3A2818]/80 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
