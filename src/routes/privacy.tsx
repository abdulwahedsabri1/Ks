import { createFileRoute } from "@tanstack/react-router";
import { Lock, Shield } from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MY Link QR" },
      {
        name: "description",
        content: "Detailed Privacy Policy explaining how MY Link QR collects, protects, and handles merchant data and menu analytics.",
      },
      { property: "og:title", content: "Privacy Policy — MY Link QR" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Shield className="size-3.5" />
              Data Protection
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-6">
              Privacy <span className="italic text-primary">Policy</span>
            </h1>
            <p className="text-sm text-muted-foreground">Last updated: August 23, 2026</p>
          </div>

          <div className="bg-card rounded-3xl p-8 sm:p-12 border border-border shadow-xl space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>
                When you create an account with MY Link QR, we collect business registration details including your full name, business name, phone/WhatsApp number, email address, and store categories. When customers view your QR menu, anonymous analytics data (device type, scan count, and item views) are recorded to provide your dashboard metrics.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To host, render, and update your live QR code menu pages.</li>
                <li>To route WhatsApp orders directly to your provided business phone number.</li>
                <li>To calculate scan analytics and view counters for your shop dashboard.</li>
                <li>To send critical account updates, service notices, and billing receipts.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">3. Data Sharing & Security</h2>
              <p>
                We do NOT sell, rent, or trade merchant or customer data to third-party advertisers. All account data and menu media files are encrypted in transit via SSL/TLS and stored on secure cloud database infrastructure.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">4. Cookies & Local Storage</h2>
              <p>
                We use essential browser cookies and local storage strictly to keep you authenticated in your dashboard and preserve temporary cart items when customers build an order.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">5. Contact Privacy Officer</h2>
              <p>
                If you have any questions or wish to request data deletion, please contact us at <span className="font-semibold text-foreground">privacy@mylinkqr.com</span> or via WhatsApp support at <span className="font-semibold text-foreground">+91 9392318135</span>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
