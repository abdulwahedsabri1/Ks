import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileText, Lock, Scale } from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Overview — MY Link QR" },
      {
        name: "description",
        content: "Overview of legal policies, terms of service, merchant agreements, and compliance standards for MY Link QR.",
      },
      { property: "og:title", content: "Legal Overview — MY Link QR" },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Scale className="size-3.5" />
              Compliance & Policies
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-6">
              Legal <span className="italic text-primary">Overview</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Our commitments to compliance, merchant data protection, and fair service usage.
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-3xl p-8 border border-border shadow-md">
              <div className="flex items-center gap-3 font-display text-xl font-semibold mb-4 text-primary">
                <FileText className="size-6" />
                <h2 className="text-foreground">Terms of Service</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Our Terms of Service define the agreement between MY Link QR and registered business owners using our digital menu creation platform, QR hosting, and WhatsApp ordering tools.
              </p>
              <Link to="/terms" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
                Read Full Terms of Service →
              </Link>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border shadow-md">
              <div className="flex items-center gap-3 font-display text-xl font-semibold mb-4 text-primary">
                <Lock className="size-6" />
                <h2 className="text-foreground">Privacy Policy</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                We take data privacy seriously. Learn how we collect, process, and protect your store data, menu items, and analytics metrics without selling your personal information.
              </p>
              <Link to="/privacy" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
                Read Full Privacy Policy →
              </Link>
            </div>

            <div className="bg-card rounded-3xl p-8 border border-border shadow-md">
              <div className="flex items-center gap-3 font-display text-xl font-semibold mb-4 text-primary">
                <ShieldCheck className="size-6" />
                <h2 className="text-foreground">Merchant Rights & Responsibilities</h2>
              </div>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li>Merchants retain 100% ownership of their uploaded photos, menu item names, and brand assets.</li>
                <li>Merchants are responsible for accurate pricing, allergen information, and fulfillment of WhatsApp orders.</li>
                <li>MY Link QR provides 99.9% uptime SLA for hosted QR links and dynamic menus.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
