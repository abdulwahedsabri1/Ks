import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, QrCode, ShieldCheck, Zap, Users, Award, ArrowRight } from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — MY Link QR" },
      {
        name: "description",
        content: "Learn about MY Link QR mission, values, and how we empower local businesses across India to build digital storefronts.",
      },
      { property: "og:title", content: "About Us — MY Link QR" },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { value: "5,000+", label: "Active Businesses" },
  { value: "10M+", label: "QR Scans Delivered" },
  { value: "99.9%", label: "Platform Uptime" },
  { value: "< 5 Min", label: "Average Setup Time" },
];

const values = [
  {
    icon: Zap,
    title: "Instant Simplicity",
    description: "Technology should never be complicated. We build software so intuitive that any store owner can launch in minutes without hiring developers.",
  },
  {
    icon: ShieldCheck,
    title: "Reliability & Speed",
    description: "Your QR menu is the front door to your business. We invest heavily in lightning-fast CDN infrastructure so menus open instantly on any phone.",
  },
  {
    icon: Users,
    title: "Customer-First Growth",
    description: "We are committed to helping local merchants, restaurants, bakeries, and shops compete in the modern mobile economy.",
  },
  {
    icon: Award,
    title: "Uncompromising Elegance",
    description: "Beautiful design drives sales. Our themes are crafted with luxury aesthetics to make your brand look world-class.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="size-3.5" />
              Our Story & Mission
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6 leading-tight">
              Empowering local businesses with <span className="italic text-primary">digital experiences</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              MY Link QR was founded to bridge the gap between physical retail spaces and modern mobile customers. We make QR menus, digital catalogs, and instant WhatsApp ordering effortless.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-card text-foreground border-y border-border py-16 mb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-display text-4xl sm:text-5xl font-extrabold text-primary mb-2">
                    {s.value}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Mission & Vision */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
                Why We Started
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-6">
                Reinventing how customers interact with physical spaces.
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-4">
                Traditional paper menus and printed price cards are static, expensive to reprint, and easily damaged.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                With MY Link QR, merchants gain full dynamic control. Update prices in real-time, showcase high-res dish photos, collect instant WhatsApp orders, and analyze customer behavior—all from one clean dashboard.
              </p>
            </div>

            <div className="bg-card p-8 md:p-10 rounded-3xl border border-border shadow-xl space-y-6">
              <div className="flex items-center gap-3 text-primary font-display text-xl font-semibold">
                <QrCode className="size-8" />
                <span>MY Link QR Vision</span>
              </div>
              <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-4 py-1">
                "Our goal is to give every restaurant, cafe, salon, and boutique owner the digital tools of a global enterprise with the simplicity of a mobile app."
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">What Drives Us</h2>
            <p className="text-muted-foreground">The core principles behind our design, engineering, and support.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-card rounded-3xl p-8 border border-border shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <v.icon className="size-6" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 text-foreground">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary text-primary-foreground rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <h2 className="font-display text-3xl sm:text-5xl font-semibold mb-6">
              Ready to elevate your storefront?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
              Start building your QR menu in less than 5 minutes.
            </p>
            <Button asChild size="lg" className="rounded-full bg-white text-gray-900 hover:bg-white/90 px-8">
              <Link to="/auth">
                Get Started Free <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
