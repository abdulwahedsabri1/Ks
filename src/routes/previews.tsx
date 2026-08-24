import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Coffee,
  ExternalLink,
  Eye,
  Flame,
  Globe,
  Palette,
  QrCode,
  Sparkles,
  Store,
  Utensils,
  Wine,
} from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";
import { BusinessPreviewSection } from "@/sections/landing/BusinessPreviewSection";

export const Route = createFileRoute("/previews")({
  head: () => ({
    meta: [
      { title: "Live Previews & Themes | MY Link QR" },
      {
        name: "description",
        content:
          "Experience live digital menu previews for restaurants, cafes, bakeries, bars, and salons in different design themes.",
      },
    ],
  }),
  component: PreviewsRoute,
});

const PREVIEW_DEMOS = [
  {
    title: "Aurora Fine Dining",
    niche: "Gourmet Restaurant & Grill",
    themeName: "Luxury Dark Gold",
    themeBadge: "Dark Mode",
    bgClass: "bg-[#100C09] text-white border-white/10",
    accentBg: "bg-[#FFC45A] text-[#100C09]",
    coverUrl: "/hero_qr.jpg",
    items: [
      { name: "Thalassery Chicken Biryani", price: "₹220", desc: "Aromatic Kaima rice biryani cooked with fried onions and spices" },
      { name: "Karimeen Pollichathu", price: "₹350", desc: "Pearl spot fish marinated in masala grilled in banana leaf" },
      { name: "Kerala Parotta with Beef Roast", price: "₹180", desc: "Flaky layered flatbread served with slow-cooked beef roast" },
    ],
  },
  {
    title: "La Petite Bakery & Café",
    niche: "Coffee & Artisan Pastries",
    themeName: "Warm Amber & Wood",
    themeBadge: "Warm Vibe",
    bgClass: "bg-[#FFFAF5] text-[#100C09] border-[#D99A2B]/20",
    accentBg: "bg-[#D99A2B] text-white",
    coverUrl: "/mock/food1.png",
    items: [
      { name: "Espresso Cappuccino", price: "₹140", desc: "Rich espresso topped with velvety steamed milk foam" },
      { name: "Butter Croissant", price: "₹110", desc: "Freshly baked flaky butter croissant served warm" },
      { name: "Tender Coconut Payasam", price: "₹90", desc: "Creamy traditional dessert with tender coconut pulp" },
    ],
  },
  {
    title: "Malabar Spice Bistro",
    niche: "Traditional South Indian Cuisine",
    themeName: "Royal Emerald Bistro",
    themeBadge: "Royal Green",
    bgClass: "bg-[#062319] text-emerald-50 border-emerald-500/20",
    accentBg: "bg-[#F59E0B] text-[#062319]",
    coverUrl: "/mock/food3.png",
    items: [
      { name: "Appam with Veg Stew", price: "₹130", desc: "Fluffy rice pancakes served with coconut milk vegetable stew" },
      { name: "Chicken 65 (Kerala Style)", price: "₹180", desc: "Crispy fried chicken chunks with spicy curry leaf marinade" },
      { name: "Sulaimani Tea", price: "₹30", desc: "Traditional spiced black lemon tea with mint" },
    ],
  },
  {
    title: "Cyber Neon Lounge & Bar",
    niche: "Sports Bar & Cocktails",
    themeName: "Cyber Neon Night",
    themeBadge: "Neon Glow",
    bgClass: "bg-[#0D0E15] text-cyan-50 border-cyan-500/20",
    accentBg: "bg-[#06B6D4] text-[#0D0E15]",
    coverUrl: "/mock/retail1.png",
    items: [
      { name: "Signature Mojito Cooler", price: "₹190", desc: "Refreshing crushed lime, fresh mint and soda cooler" },
      { name: "Chilly Garlic Noodles", price: "₹140", desc: "Spicy noodles stir-fried with garlic, peppers and soy" },
      { name: "Crispy Chicken Wings", price: "₹240", desc: "Glazed in spicy BBQ chili glaze served with dip" },
    ],
  },
  {
    title: "Velvet Rose Sweet House",
    niche: "Pastry & Dessert Parlor",
    themeName: "Rose Gold & Cream",
    themeBadge: "Blush Pink",
    bgClass: "bg-[#FFF5F5] text-[#4A1D24] border-[#E11D48]/20",
    accentBg: "bg-[#E11D48] text-white",
    coverUrl: "/mock/salon2.png",
    items: [
      { name: "Dark Chocolate Brownie", price: "₹150", desc: "Fudgy warm chocolate brownie with vanilla gelato" },
      { name: "Rose Milkshake", price: "₹110", desc: "Chilled organic rose milk topped with basil seeds" },
      { name: "Red Velvet Pastry", price: "₹130", desc: "Layered sponge cake with cream cheese frosting" },
    ],
  },
  {
    title: "Urban Minimalist Diner",
    niche: "Fast Casual & Burgers",
    themeName: "Minimalist Ivory",
    themeBadge: "Clean Light",
    bgClass: "bg-[#F5F0E7] text-[#100C09] border-black/10",
    accentBg: "bg-[#100C09] text-white",
    coverUrl: "/mock/food4.png",
    items: [
      { name: "Classic Cheese Burger", price: "₹199", desc: "Juicy grilled beef patty with cheddar, lettuce and special sauce" },
      { name: "Loaded Fries Platter", price: "₹140", desc: "Crispy golden fries topped with melted cheese & jalapeños" },
      { name: "Cold Brew Iced Coffee", price: "₹120", desc: "Smooth 16-hour steeped cold brew coffee" },
    ],
  },
];

function PreviewsRoute() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Eye className="size-3.5" /> Interactive Public Menu Previews
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            See How Your Menu Looks to <span className="text-gradient italic">Your Customers</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Browse live interactive mockups of digital QR menus across different themes, food categories, and business types.
          </p>
        </section>

        {/* Embedded Interactive Business Preview Component */}
        <section className="-mt-8 mb-16">
          <BusinessPreviewSection />
        </section>

        {/* Theme Mockup Cards Section Header */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center max-w-3xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Explore Theme Designs & Preset Layouts
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-10">
            Select any theme below and book a 1-on-1 setup session to customize it for your business.
          </p>
        </section>

        {/* Live Demos Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {PREVIEW_DEMOS.map((demo) => (
              <div
                key={demo.title}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
              >
                {/* Theme Mockup Screen Header */}
                <div className={`p-5 ${demo.bgClass} relative overflow-hidden border-b`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {demo.niche}
                    </span>
                    <span className="rounded-full bg-white/20 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold uppercase">
                      {demo.themeBadge}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-1">{demo.title}</h3>
                  <p className="text-xs opacity-75 mb-4">Theme: {demo.themeName}</p>

                  {/* Sample Dishes Preview Box */}
                  <div className="space-y-2">
                    {demo.items.map((it) => (
                      <div
                        key={it.name}
                        className="flex items-center justify-between gap-2 rounded-xl bg-black/10 backdrop-blur p-2.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{it.name}</p>
                          <p className="text-[10px] opacity-75 truncate">{it.desc}</p>
                        </div>
                        <span className="font-bold shrink-0">{it.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2">
                    <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${demo.accentBg}`}>
                      WhatsApp Order Demo
                    </span>
                    <span className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
                      <QrCode className="size-3.5" /> Table #04
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 flex items-center justify-between bg-card">
                  <div>
                    <p className="text-xs font-bold text-foreground">{demo.themeName}</p>
                    <p className="text-[11px] text-muted-foreground">Book custom setup for this theme</p>
                  </div>
                  <Button asChild size="sm" className="rounded-full font-bold">
                    <Link to="/demo" hash="booking-form">
                      Book Setup <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center max-w-3xl">
          <div className="rounded-3xl border border-border bg-card/60 p-8 sm:p-12 backdrop-blur-xl">
            <h2 className="font-display text-3xl font-bold mb-3">Want a Custom Design for Your Brand?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
              Our design team can craft a tailored QR menu with your custom logo, font choices, and brand guidelines.
            </p>
            <Button asChild size="lg" className="rounded-full font-bold h-12 px-8">
              <Link to="/demo" hash="booking-form">
                Book Free Setup & Demo Meeting
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
