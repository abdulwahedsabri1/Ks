import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Flame,
  Layers,
  Printer,
  QrCode,
  Shield,
  Sparkles,
  Smartphone,
  Store,
} from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/showcase")({
  head: () => ({
    meta: [
      { title: "QR Code Stands & Showcase | MY Link QR" },
      {
        name: "description",
        content:
          "Explore print-ready QR table stands, acrylic displays, wooden block mounts, and high-res vector downloads.",
      },
    ],
  }),
  component: ShowcaseRoute,
});

const SHOWCASE_ITEMS = [
  {
    title: "Acrylic Dual-Sided Table Stand",
    subtitle: "High-Gloss Premium Table Display",
    description:
      "Crystal-clear acrylic stand with a high-density metallic gold QR print. Perfect for fine dining restaurants and modern lounges.",
    image: "/hero_qr.jpg",
    specs: ["Dual-sided 4x6 inch size", "Scratch-resistant acrylic", "Direct QR scan to WhatsApp"],
  },
  {
    title: "Rustic Engraved Wooden Block",
    subtitle: "Eco-Friendly Natural Wood Mount",
    description:
      "Laser-etched natural oak block stand crafted for artisanal bakeries, cafes, and organic bistros.",
    image: "/mock/food2.png",
    specs: ["Solid teak / oak wood block", "Laser engraved QR link", "Waterproof matte coating"],
  },
  {
    title: "Aluminium Counter Plaque",
    subtitle: "Heavy-Duty Order Counter Display",
    description:
      "Brushed aluminium metal plaque with high-contrast QR print for fast-casual ordering counters and cashier registers.",
    image: "/mock/food4.png",
    specs: ["Brushed metal finish", "Non-slip rubber base", "High-visibility scanning"],
  },
  {
    title: "Weatherproof Window Vinyl Decal",
    subtitle: "24/7 Outdoor Menu Scanner",
    description:
      "UV-resistant vinyl sticker for glass store fronts, allowing customers to view menus even when your shop is closed.",
    image: "/mock/retail2.png",
    specs: ["Weatherproof & UV resistant", "Glass front adhesive", "24/7 customer engagement"],
  },
];

function ShowcaseRoute() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Printer className="size-3.5" /> Print-Ready QR Stands & Touchpoints
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Turn Every Table into a <span className="text-gradient italic">Digital Portal</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Explore physical table stand mockups, custom acrylic displays, and print vector SVG/PNG files created for restaurants and local businesses.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full h-12 px-8 text-sm font-bold">
              <Link to="/auth">
                Create Your QR Stand <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full h-12 px-8 text-sm font-bold">
              <Link to="/demo">Book Free Setup & Demo</Link>
            </Button>
          </div>
        </section>

        {/* Showcase Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="grid gap-10 md:grid-cols-2">
            {SHOWCASE_ITEMS.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="rounded-full bg-primary/90 text-primary-foreground px-3 py-1 text-[11px] font-bold">
                      {item.subtitle}
                    </span>
                    <h3 className="font-bold text-xl text-white mt-2">{item.title}</h3>
                  </div>
                </div>

                <div className="p-6 flex flex-1 flex-col justify-between">
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    {item.description}
                  </p>

                  <ul className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground mb-6">
                    {item.specs.map((spec) => (
                      <li key={spec} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full font-bold">
                    <Link to="/demo" hash="booking-form">
                      <QrCode className="mr-2 size-4" /> Request Custom QR Stands
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Print Studio Features Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-card/60 p-8 sm:p-12 backdrop-blur-xl text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Vector SVG & 300 DPI Export Included
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Download high-resolution vector files embedded with your shop logo. Send them directly to any local print shop or order pre-made stands through our WhatsApp support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-full font-bold h-12 px-8">
                <Link to="/auth">Generate Free Vector QR</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full font-bold h-12 px-8">
                <Link to="/demo" hash="booking-form">Order Printed Stands (+91 9392318135)</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
