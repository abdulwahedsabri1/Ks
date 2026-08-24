import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, User, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog & Guides — MY Link QR" },
      {
        name: "description",
        content: "Explore industry insights, QR menu best practices, restaurant growth strategies, and digital store tutorials.",
      },
      { property: "og:title", content: "Blog & Guides — MY Link QR" },
    ],
  }),
  component: BlogPage,
});

const articles = [
  {
    id: 1,
    title: "10 Proven Ways to Increase Restaurant Revenue Using QR Menus in 2026",
    excerpt: "Discover how top-performing cafes and restaurants use high-resolution digital menus, upsell tags, and WhatsApp ordering to boost average check sizes.",
    category: "Growth & Sales",
    author: "Sabri Wahed",
    date: "Aug 20, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Why Printed Paper Menus Are Losing You Customers (And How to Fix It)",
    excerpt: "Paper menus get smudged, torn, and outdated fast. Learn how dynamic QR codes keep your business looking pristine and professional.",
    category: "Customer Experience",
    author: "Priya Sharma",
    date: "Aug 15, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "The Complete Guide to Setting Up WhatsApp Ordering for Your Store",
    excerpt: "Step-by-step instructions on enabling digital carts, direct order routing, and managing customer inquiries straight from your mobile phone.",
    category: "Tutorials",
    author: "Alex Morgan",
    date: "Aug 10, 2026",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1556742049-0a670f4a4591?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Designing QR Codes That Get Scanned: Best Practices for Table Displays",
    excerpt: "Color choices, frame placement, lighting tips, and call-to-action text that increase QR scan rates by over 40%.",
    category: "Design & Branding",
    author: "Sabri Wahed",
    date: "Aug 02, 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "How Beauty Salons & Spas Use MY Link QR for Service Catalogs",
    excerpt: "Service menus with pricing, treatment details, and instant booking inquiries are transforming appointment workflows for modern salons.",
    category: "Industry Case Study",
    author: "Sara Chen",
    date: "Jul 28, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Understanding Menu Analytics: Turning Scan Data Into Smart Decisions",
    excerpt: "Learn how to read view counters, peak customer scan hours, and item engagement to optimize your product offerings.",
    category: "Analytics",
    author: "Priya Sharma",
    date: "Jul 18, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  },
];

function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <BookOpen className="size-3.5" />
              Insights & Guides
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6">
              Grow your business with <span className="italic text-primary">smart digital menus</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Expert articles, growth tactics, case studies, and tutorials crafted for local business owners.
            </p>
          </div>

          {/* Featured Article Banner */}
          <div className="bg-card rounded-3xl overflow-hidden border border-border shadow-xl mb-16 grid lg:grid-cols-2">
            <div className="h-64 lg:h-auto overflow-hidden relative">
              <img
                src={articles[0]!.image}
                alt={articles[0]!.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <span className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-md shadow-md">
                Featured
              </span>
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary mb-3 block">
                  {articles[0]!.category}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-4 hover:text-primary transition-colors cursor-pointer leading-tight">
                  {articles[0]!.title}
                </h2>
                <p className="text-muted-foreground text-base mb-6 leading-relaxed">
                  {articles[0]!.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <span>{articles[0]!.author}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{articles[0]!.date}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" /> {articles[0]!.readTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.slice(1).map((art) => (
              <article
                key={art.id}
                className="bg-card rounded-2xl border border-border shadow-md overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-md text-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-md border border-border">
                      {art.category}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {art.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 flex items-center justify-between border-t border-border text-xs text-muted-foreground mt-4">
                  <span>{art.date}</span>
                  <span className="flex items-center gap-1 font-medium text-primary">
                    Read article <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Call To Action Box */}
          <div className="mt-20 bg-[#100C09] text-white rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <Sparkles className="size-10 text-[#FFC45A] mx-auto mb-4" />
              <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
                Ready to create your own digital menu?
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Join thousands of businesses who elevated their storefronts with MY Link QR today.
              </p>
              <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-white px-8">
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
