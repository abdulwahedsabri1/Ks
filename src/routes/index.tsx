import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/sections/landing/Navbar";
import { HeroSection } from "@/sections/landing/HeroSection";
import { FeaturesSection } from "@/sections/landing/FeaturesSection";
import { BusinessPreviewSection } from "@/sections/landing/BusinessPreviewSection";
import { ThemesSection } from "@/sections/landing/ThemesSection";
import { QRShowcaseSection } from "@/sections/landing/QRShowcaseSection";
import { PricingSection } from "@/sections/landing/PricingSection";
import { CTASection } from "@/sections/landing/CTASection";
import { Footer } from "@/sections/landing/Footer";
import { InstagramProfileFeed } from "@/components/InstagramProfileFeed";
import { Instagram } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MY Link QR — Premium QR Menus & Digital Experiences" },
      {
        name: "description",
        content:
          "Create QR menus, business profiles, catalogs, and customer experiences in minutes.",
      },
      { property: "og:title", content: "MY Link QR — Premium QR Menus & Digital Experiences" },
      { property: "og:url", content: "https://mylinkqr.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "MY Link QR",
          operatingSystem: "Web",
          applicationCategory: "BusinessApplication",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "INR",
          },
          description:
            "Create interactive QR menus, digital catalogs, business cards, and online ordering experiences in minutes.",
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 text-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <BusinessPreviewSection />
        <ThemesSection />
        <QRShowcaseSection />

        {/* Live Instagram Feed & Video Reels Section */}
        <section id="instagram" className="py-20 md:py-28 bg-[#100C09] border-t border-white/5 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs font-bold text-pink-400 mb-4">
                <Instagram className="size-3.5" /> Live Instagram Videos & Demos
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
                See <span className="text-gradient italic">MY Link QR</span> in Action
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Follow <strong className="text-white">@mylinkqr.in</strong> for live video walkthroughs, restaurant customer case studies, and daily shorts.
              </p>
            </div>
            <InstagramProfileFeed />
          </div>
        </section>

        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
