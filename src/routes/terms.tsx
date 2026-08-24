import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — MY Link QR" },
      {
        name: "description",
        content: "Terms of Service and merchant agreement rules for using MY Link QR digital menu platform.",
      },
      { property: "og:title", content: "Terms of Service — MY Link QR" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <FileText className="size-3.5" />
              Agreement
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-6">
              Terms of <span className="italic text-primary">Service</span>
            </h1>
            <p className="text-sm text-muted-foreground">Last updated: August 23, 2026</p>
          </div>

          <div className="bg-card rounded-3xl p-8 sm:p-12 border border-border shadow-xl space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By signing up for or using MY Link QR ("Service"), you agree to be bound by these Terms of Service. If you are registering on behalf of a business, restaurant, or shop, you represent that you have authority to bind that entity.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">2. Merchant Account & Content</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You retain 100% ownership of all images, text, and pricing details uploaded to your QR menu. You agree not to upload fraudulent, deceptive, or illegal content.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">3. Service Availability & QR Links</h2>
              <p>
                MY Link QR strives to maintain a 99.9% uptime for hosted QR menu URLs. Printed QR codes created through our platform remain dynamic; however, routing is dependent on active merchant account standing.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">4. Billing & Subscriptions</h2>
              <p>
                Subscription plans (Basic, Pro, Premium) are billed according to selected billing cycles. Upgrades or plan changes take effect immediately. Subscriptions may be cancelled at any time through your dashboard or by contacting support.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">5. Termination & Support</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate law or abuse system resources. For questions regarding terms, contact support at <span className="font-semibold text-foreground">support@mylinkqr.com</span> or WhatsApp <span className="font-semibold text-foreground">+91 9392318135</span>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
