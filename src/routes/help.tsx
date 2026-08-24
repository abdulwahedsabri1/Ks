import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, HelpCircle, QrCode, Smartphone, CreditCard, MessageSquare, ShieldCheck, ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — MY Link QR" },
      {
        name: "description",
        content: "Find guides, answers, and tutorials on setting up your QR menu, WhatsApp ordering, and account.",
      },
      { property: "og:title", content: "Help Center — MY Link QR" },
    ],
  }),
  component: HelpPage,
});

const helpCategories = [
  {
    icon: QrCode,
    title: "QR Code Setup",
    description: "How to generate, customize, download, and print high-resolution QR codes.",
    articles: 6,
  },
  {
    icon: Smartphone,
    title: "Digital Menu Builder",
    description: "Adding categories, menu items, prices, high-res photos, and tags.",
    articles: 8,
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Ordering",
    description: "Configuring WhatsApp notifications, cart ordering, and phone number routing.",
    articles: 5,
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Understanding plans, payment methods, renewals, and invoice downloads.",
    articles: 4,
  },
  {
    icon: ShieldCheck,
    title: "Shop Settings & Security",
    description: "Custom domain connection, password reset, team roles, and privacy.",
    articles: 7,
  },
];

const faqs = [
  {
    question: "How do I create my first QR Menu with MY Link QR?",
    answer: "Simply sign up for a free account, enter your business name and category, and use our intuitive Menu Builder or AI Generator to add items. Your unique QR code is instantly generated!",
  },
  {
    question: "Do my customers need to download an app to scan the QR code?",
    answer: "No! Customers simply open their smartphone camera app, point it at your QR code, and tap the link. Your digital menu opens instantly in their browser.",
  },
  {
    question: "Can I update my prices or menu items after printing the QR code?",
    answer: "Yes, 100%! Your printed QR code is dynamic and stays the exact same. Whenever you edit prices or add new dishes in your dashboard, your live menu updates automatically.",
  },
  {
    question: "How does WhatsApp ordering work?",
    answer: "When enabled, customers can add dishes to a digital cart on their phone and tap 'Send Order to WhatsApp'. A pre-formatted order message with item names, quantities, and total price opens directly in WhatsApp to your business number.",
  },
  {
    question: "How can I contact live customer support?",
    answer: "You can reach our dedicated support team 24/7 via WhatsApp at +91 9392318135 or through our Contact page.",
  },
];

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Search Header Banner */}
        <section className="bg-card text-foreground border-b border-border py-16 md:py-20 mb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
              Knowledge Base
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-6">
              How can we <span className="italic text-primary">help you</span> today?
            </h1>
            
            <div className="relative max-w-xl mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search articles, guides, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 bg-background text-foreground rounded-full shadow-lg border-border text-base"
              />
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <h2 className="font-display text-2xl font-semibold mb-8 text-center sm:text-left">
            Browse Help Topics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((cat) => (
              <div
                key={cat.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/40 cursor-pointer group"
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <cat.icon className="size-6" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{cat.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{cat.description}</p>
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  {cat.articles} articles <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-semibold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Quick answers to common questions about MY Link QR.</p>
          </div>

          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between font-display text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Need More Help Box */}
          <div className="mt-16 bg-card rounded-3xl p-8 border border-border shadow-lg text-center flex flex-col items-center">
            <HelpCircle className="size-10 text-primary mb-4" />
            <h3 className="font-display text-2xl font-semibold mb-2 text-foreground">Still need help?</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Our support team is ready to answer your questions and assist with setting up your account.
            </p>
            <Button asChild size="lg" className="rounded-full">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
