import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  QrCode,
  Send,
  Sparkles,
  User,
  UtensilsCrossed,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Watch Demo & Book Meeting | MY Link QR" },
      {
        name: "description",
        content:
          "Watch customer experience & restaurant owner dashboard video demos, and book a free 1-on-1 setup meeting for your restaurant.",
      },
    ],
  }),
  component: DemoWatchRoute,
});

function DemoWatchRoute() {
  const [activeTab, setActiveTab] = useState<"customer" | "owner">("customer");
  const [bookingForm, setBookingForm] = useState({
    businessName: "",
    name: "",
    phone: "",
    address: "",
    preferredTime: "",
    notes: "",
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      toast.error("Please provide your name and phone/WhatsApp number.");
      return;
    }

    const message =
      `Hello MY Link QR Team!\n\n` +
      `I watched your video demo and would like to book a meeting / free setup consultation for my restaurant.\n\n` +
      `📌 Business Name: ${bookingForm.businessName.trim() || "Not specified"}\n` +
      `👤 Owner Name: ${bookingForm.name.trim()}\n` +
      `📞 Phone / WhatsApp: ${bookingForm.phone.trim()}\n` +
      `📍 Address / City: ${bookingForm.address.trim() || "Not specified"}\n` +
      `⏰ Preferred Time: ${bookingForm.preferredTime.trim() || "As soon as possible"}\n` +
      (bookingForm.notes.trim() ? `📝 Notes: ${bookingForm.notes.trim()}\n` : "");

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/919392318135?text=${encoded}`;

    toast.success("Opening WhatsApp to book your meeting...");
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="size-4" /> Back to Home
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              <Sparkles className="size-3.5" /> Interactive Video Demonstrations
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Watch <span className="text-gradient italic">MY Link QR</span> in Action
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Explore how customers order effortlessly from their mobile phones and how restaurant owners manage menus, AI tools, and scan analytics in real-time.
            </p>
          </div>
        </section>

        {/* Video Player & Tab Switcher Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16">
          <div className="max-w-5xl mx-auto">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={`flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold transition-all ${
                  activeTab === "customer"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <UtensilsCrossed className="size-4" /> Customer Ordering Experience
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("owner")}
                className={`flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-bold transition-all ${
                  activeTab === "owner"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                }`}
              >
                <Video className="size-4" /> Restaurant Owner Dashboard
              </button>
            </div>

            {/* Video Cards Grid */}
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              {/* Main Video Screen */}
              <div className="lg:col-span-8">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                  {activeTab === "customer" ? (
                    <div className="relative group">
                      <div className="bg-card/90 px-4 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-3 rounded-full bg-emerald-500 inline-block animate-pulse" />
                          <span className="text-xs font-bold text-foreground">Customer QR Ordering Experience</span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          Mobile View
                        </span>
                      </div>
                      <video
                        key="customer-video"
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full aspect-video object-cover bg-black"
                        poster="/hero_qr.jpg"
                      >
                        <source src="/mock/Mylinkqr.mp4" type="video/mp4" />
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="bg-card/90 px-4 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-3 rounded-full bg-amber-500 inline-block animate-pulse" />
                          <span className="text-xs font-bold text-foreground">Restaurant Order Management & Dashboard</span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          Owner & Staff View
                        </span>
                      </div>
                      <video
                        key="owner-video"
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full aspect-video object-cover bg-black"
                        poster="/hero_qr.jpg"
                      >
                        <source src="/mock/dsf.mp4" type="video/mp4" />
                        Your browser does not support HTML5 video.
                      </video>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Explainer Side Card */}
              <div className="lg:col-span-4 space-y-6">
                {activeTab === "customer" ? (
                  <motion.div
                    key="customer-info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-md"
                  >
                    <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
                      <QrCode className="size-5" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Customer Experience</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      Watch how diner guests scan your table QR code, browse interactive categorized menus with dish photos, and place instant orders directly via WhatsApp.
                    </p>

                    <ul className="space-y-3 text-xs">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Zero App Downloads</strong> — Works instantly on any iOS & Android browser.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Live Dish Photos</strong> — High-res food imagery to boost appetite and order values.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Direct WhatsApp Orders</strong> — Carts arrive at staff phone with table number & itemized details.</span>
                      </li>
                    </ul>
                  </motion.div>
                ) : (
                  <motion.div
                    key="owner-info"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-md"
                  >
                    <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
                      <Sparkles className="size-5" />
                    </div>
                    <h3 className="font-bold text-xl mb-2">Owner Dashboard & AI</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      See how restaurant owners manage categories, use AI menu generation & photo OCR scanning, track scan analytics, and download print-ready QR codes.
                    </p>

                    <ul className="space-y-3 text-xs">
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>AI Menu Scanner</strong> — Import photo menus or generate 20+ items in 10 seconds.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>6 Custom Themes</strong> — Change your public QR design instantly anytime.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 text-amber-500 shrink-0 mt-0.5" />
                        <span><strong>Printable Stand Designs</strong> — High-res SVG & PNG QR codes for tables.</span>
                      </li>
                    </ul>
                  </motion.div>
                )}

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-3">
                    Want to see both videos side-by-side or get a live 1-on-1 walkthrough?
                  </p>
                  <a
                    href="#booking-form"
                    className="inline-flex items-center justify-center w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Book Free Consultation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meeting Booking & Consultation Form Section */}
        <section id="booking-form" className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28">
          <div className="max-w-4xl mx-auto rounded-3xl border border-border bg-card/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="grid gap-10 lg:grid-cols-12 items-center">
              {/* Left Form Pitch */}
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-500">
                  <Calendar className="size-3.5" /> Free Setup Session
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Book a Meeting for Your Restaurant
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Fill in your restaurant details below and our specialist team will contact you on WhatsApp to set up your digital QR menu, print table stands, and guide your staff.
                </p>

                <div className="pt-2 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted text-foreground shrink-0">
                      <Phone className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Direct WhatsApp Line</p>
                      <p>+91 93923 18135</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="grid size-8 place-items-center rounded-lg bg-muted text-foreground shrink-0">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Fast Turnaround</p>
                      <p>Menu ready within 15 minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Form Fields */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-10">
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="b-name" className="text-xs font-semibold">
                        Your Name *
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          id="b-name"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                          className="pl-9 text-xs h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b-phone" className="text-xs font-semibold">
                        WhatsApp / Phone *
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                        <Input
                          id="b-phone"
                          required
                          type="tel"
                          placeholder="e.g. 9392318135"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                          className="pl-9 text-xs h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b-biz" className="text-xs font-semibold">
                      Restaurant / Business Name
                    </Label>
                    <Input
                      id="b-biz"
                      placeholder="e.g. Paradise Biryani & Cafe"
                      value={bookingForm.businessName}
                      onChange={(e) => setBookingForm({ ...bookingForm, businessName: e.target.value })}
                      className="text-xs h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b-addr" className="text-xs font-semibold">
                      Restaurant Address / City
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input
                        id="b-addr"
                        placeholder="e.g. MG Road, Kochi, Kerala"
                        value={bookingForm.address}
                        onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                        className="pl-9 text-xs h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="b-notes" className="text-xs font-semibold">
                      Preferred Date, Time or Questions
                    </Label>
                    <Textarea
                      id="b-notes"
                      rows={2}
                      placeholder="e.g. Tomorrow at 3 PM or Need assistance uploading menu photos"
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="text-xs min-h-[70px]"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 text-xs font-bold gap-2">
                    <Send className="size-4" /> Forward to WhatsApp (+91 9392318135)
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
