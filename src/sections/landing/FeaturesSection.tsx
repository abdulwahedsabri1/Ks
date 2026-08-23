import { motion } from "framer-motion";
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
  CheckCircle,
} from "lucide-react";

const features = [
  {
    title: "Instant Digital Presence",
    description:
      "Launch your customized mobile-first experience in less than 5 minutes. No coding required.",
    icon: Zap,
  },
  {
    title: "Beautiful Themes",
    description:
      "Choose from our collection of premium, luxury themes designed to elevate your brand.",
    icon: Paintbrush,
  },
  {
    title: "Dynamic QR Codes",
    description:
      "Generate high-quality, branded QR codes. Update your links anytime without reprinting.",
    icon: QrCode,
  },
  {
    title: "Deep Analytics",
    description:
      "Track scans, unique visitors, and popular items with our powerful built-in dashboard.",
    icon: BarChart3,
  },
  {
    title: "Custom Domain",
    description: "Connect your own domain name for a truly professional, white-labeled experience.",
    icon: Globe2,
  },
  {
    title: "App-like Experience",
    description:
      "Customers browse your catalog smoothly on any device, feeling just like a native app.",
    icon: Smartphone,
  },
  {
    title: "Multi-location Support",
    description: "Manage multiple stores, menus, or catalogs from a single centralized dashboard.",
    icon: Store,
  },
  {
    title: "Secure & Reliable",
    description:
      "Enterprise-grade hosting ensures your digital storefront is always fast and available.",
    icon: ShieldCheck,
  },
  {
    title: "One QR, always current",
    description: "Update prices any time — the printed QR never changes.",
    icon: QrCode,
  },
  {
    title: "Premium mobile menu",
    description: "A fast, image-rich menu page your customers actually enjoy.",
    icon: Smartphone,
  },
  {
    title: "WhatsApp ordering",
    description: "Customers build a cart and send the order straight to your phone.",
    icon: MessageCircle,
  },
  {
    title: "AI menu generator",
    description: "Describe your business and get a full menu draft in seconds.",
    icon: Wand2,
  },
  {
    title: "Live analytics",
    description: "See scans, views and your most-viewed items.",
    icon: BarChart3,
  },
  {
    title: "Any local business",
    description: "Restaurants, salons, bakeries, boutiques, clinics and more.",
    icon: CheckCircle,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#F5F0E7] py-24 md:py-32 text-[#100C09]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-6"
          >
            Everything you need to <span className="italic text-[#3A2818]">succeed</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#3A2818]/80"
          >
            Powerful features crafted specifically for local businesses, restaurants, and creators
            to digitize their physical spaces.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 4) * 0.1, duration: 0.4 }}
              className="group relative bg-white rounded-[1.25rem] p-5 md:p-6 border border-black/5 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
            >
              {/* Golden hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFC45A]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-[#100C09] text-[#FFC45A] group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#3A2818]/70 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
