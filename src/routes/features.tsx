import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  MessageSquare,
  Palette,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
  Zap,
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
          "Discover all features of MY Link QR: AI menu generator, photo OCR scanner, 6 custom themes, WhatsApp ordering, and scan analytics.",
      },
    ],
  }),
  component: FeaturesRoute,
});

const ALL_FEATURES = [
  {
    icon: Sparkles,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    title: "AI Menu Generator & OCR Photo Scanner",
    description:
      "Transform paper menus or dish photos into structured digital menus in 10 seconds. AI automatically extracts item names, prices, categories, and assigns food imagery.",
    points: [
      "10-second automatic menu generation",
      "Camera photo scanner (OCR) for paper menus",
      "Automatic high-resolution food image matching",
      "Multi-category structured output",
    ],
  },
  {
    icon: Palette,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    title: "6 Custom Theme Styling Engine",
    description:
      "Switch your public QR menu appearance instantly with zero code. Choose from Luxury Dark, Minimalist Light, Warm Amber, Royal Emerald, Cyber Neon, and Rose Gold.",
    points: [
      "Real-time theme switching with 1 click",
      "Customizable brand colors & logos",
      "Mobile-first responsive design",
      "Glassmorphism & dark mode aesthetics",
    ],
  },
  {
    icon: MessageSquare,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    title: "Direct WhatsApp Ordering System",
    description:
      "Allow guests to browse items, select table numbers or delivery options, and send itemized cart receipts directly to your restaurant staff WhatsApp.",
    points: [
      "Dine-in table ordering with table number",
      "Takeaway & delivery options",
      "Itemized receipt formatted for staff",
      "No commission fees on your sales",
    ],
  },
  {
    icon: QrCode,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    title: "Vector QR Code Studio & Print Downloads",
    description:
      "Generate crystal-clear vector SVG & high-res PNG QR codes embedded with your shop logo. Ready for acrylic table stands, stickers, and menus.",
    points: [
      "Custom logo embedding in QR code center",
      "300 DPI vector SVG & PNG export",
      "Instant scan tracking URL",
      "Lifetime active QR link",
    ],
  },
  {
    icon: BarChart3,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    title: "Real-time Customer Analytics",
    description:
      "Track daily scan volumes, peak ordering hours, popular food categories, and customer device breakdowns to optimize your menu offerings.",
    points: [
      "Daily & monthly QR scan graphs",
      "Device & browser breakdown statistics",
      "Peak visit hour metrics",
      "Exportable customer reports",
    ],
  },
  {
    icon: ShieldCheck,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    title: "Multi-Owner & Staff Account Management",
    description:
      "Super admin and shop owner controls for linking customer credentials, updating operating hours, managing trial & subscription plans seamlessly.",
    points: [
      "Automatic user email & shop linking",
      "Super admin subscription controls",
      "Operating hours & social links",
      "Enterprise security & cloud backups",
    ],
  },
];

function FeaturesRoute() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Hero Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Zap className="size-3.5" /> All-In-One QR Digital Platform
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Complete Features to <span className="text-gradient italic">Elevate Your Restaurant</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            From instant AI menu creation to WhatsApp table orders and real-time analytics — everything you need to run a modern digital dining experience.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full h-12 px-8 text-sm font-bold">
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8 text-sm font-bold">
              <Link to="/demo">Watch Video Demo</Link>
            </Button>
          </div>
        </section>

        {/* Detailed Feature Cards Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ALL_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card/60 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
                >
                  <div>
                    <div
                      className={`inline-flex size-12 items-center justify-center rounded-2xl border mb-6 ${feat.color}`}
                    >
                      <Icon className="size-6" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      {feat.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 border-t border-border/60 pt-5 text-xs text-muted-foreground">
                    {feat.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-r from-card via-card/80 to-primary/10 p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to Upgrade Your Restaurant Menu?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mb-8">
                Join hundreds of restaurants, cafes, and bakeries using MY Link QR to boost sales and customer satisfaction.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="rounded-full h-12 px-8 font-bold">
                  <Link to="/auth">Create Your QR Menu Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8 font-bold">
                  <Link to="/demo" hash="booking-form">Book Free Setup Meeting</Link>
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
