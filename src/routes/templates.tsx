import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Eye, CheckCircle2, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "QR Menu Templates — MY Link QR" },
      {
        name: "description",
        content: "Explore pre-built luxury digital menu templates for restaurants, cafes, bakeries, salons, and boutiques.",
      },
      { property: "og:title", content: "QR Menu Templates — MY Link QR" },
    ],
  }),
  component: TemplatesPage,
});

const categories = ["All", "Restaurant", "Cafe & Bistro", "Bakery", "Salon & Spa", "Boutique"];

const templates = [
  {
    id: "restaurant-emerald",
    name: "Luxury Bistro & Dining",
    category: "Restaurant",
    theme: "Emerald & Gold Dark",
    description: "Rich dark aesthetic with gold accents, item tags, high-resolution food images, and category sticky nav.",
    demoSlug: "royalbiryani",
    items: "50+ items included",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    popular: true,
  },
  {
    id: "cafe-[#F5F0E7]",
    name: "Warm Artisan Cafe",
    category: "Cafe & Bistro",
    theme: "Warm Cream & Coffee",
    description: "Minimalist cream design tailored for espresso bars, specialty coffees, and artisan breakfast spots.",
    demoSlug: "artisancafe",
    items: "35+ items included",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    popular: false,
  },
  {
    id: "bakery-sweet",
    name: "Pastry & Gourmet Bakery",
    category: "Bakery",
    theme: "Pastel Pink & Warm Cocoa",
    description: "Vibrant showcase with photo cards, allergen tags, and instant WhatsApp custom cake order buttons.",
    demoSlug: "sweettreats",
    items: "40+ items included",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    popular: true,
  },
  {
    id: "salon-spa",
    name: "Velvet Beauty & Spa",
    category: "Salon & Spa",
    theme: "Rose Gold & Silk",
    description: "Elegant service menu detailing hair, skin, and spa packages with duration and appointment inquiry links.",
    demoSlug: "glamoursalon",
    items: "25+ services included",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    popular: false,
  },
  {
    id: "boutique-fashion",
    name: "Minimalist Boutique Catalog",
    category: "Boutique",
    theme: "Monochrome Sleek",
    description: "Modern lookbook style catalog for clothing stores, footwear, and handmade craft galleries.",
    demoSlug: "urbantreads",
    items: "30+ items included",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    popular: false,
  },
];

function TemplatesPage() {
  const [selectedCat, setSelectedCat] = useState("All");

  const filteredTemplates = selectedCat === "All"
    ? templates
    : templates.filter((t) => t.category === selectedCat);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <LayoutGrid className="size-3.5" />
              Pre-built Designs
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6">
              Choose a template & <span className="italic text-primary">launch in minutes</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Every template is 100% customizable, mobile-optimized, and comes with dynamic QR code support.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-16">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  selectedCat === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card text-foreground border-border hover:bg-card/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-300 group"
              >
                <div>
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={tpl.image}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {tpl.popular && (
                      <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-md">
                        Popular Choice
                      </span>
                    )}
                    <span className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-md text-white text-xs py-1 px-3 rounded-full font-mono">
                      {tpl.theme}
                    </span>
                  </div>

                  <div className="p-7">
                    <div className="flex items-center justify-between text-xs text-primary font-bold uppercase tracking-wider mb-2">
                      <span>{tpl.category}</span>
                      <span className="text-muted-foreground font-normal lowercase">{tpl.items}</span>
                    </div>

                    <h3 className="font-display text-2xl font-semibold mb-3 text-foreground">{tpl.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      {tpl.description}
                    </p>

                    <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span>Instant QR Code Generation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span>WhatsApp Ordering Pre-Configured</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-7 pt-0 grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-border">
                    <Link to="/shop/$slug" params={{ slug: tpl.demoSlug }}>
                      <Eye className="size-3.5 mr-1.5" /> Preview Demo
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link to="/auth">
                      Use Template <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="mt-20 bg-[#100C09] text-white rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <Sparkles className="size-10 text-[#FFC45A] mx-auto mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
                Need a custom template for your brand?
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Our design team can craft a bespoke template tailored to your exact brand colors and domain.
              </p>
              <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white px-8">
                <Link to="/contact">Request Custom Template</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
