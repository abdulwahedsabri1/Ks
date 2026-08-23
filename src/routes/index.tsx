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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My QR Link — Premium QR Menus & Digital Experiences" },
      {
        name: "description",
        content:
          "Create QR menus, business profiles, catalogs, and customer experiences in minutes.",
      },
      { property: "og:title", content: "My QR Link — Premium QR Menus & Digital Experiences" },
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
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
