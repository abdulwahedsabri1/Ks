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
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
