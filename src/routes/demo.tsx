import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Instagram,
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
import { BusinessVideoSeries } from "@/components/BusinessVideoSeries";
import { InstagramProfileFeed } from "@/components/InstagramProfileFeed";

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
              Explore how customers order effortlessly from their mobile phones and how restaurant
              owners manage menus, AI tools, and scan analytics in real-time.
            </p>

            {/* Instagram Link Pill */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://instagram.com/mylinkqr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-pink-500/30 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-amber-500/10 px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:border-pink-500/60 hover:shadow-lg hover:shadow-pink-500/20 hover:scale-[1.02] transition-all duration-300 group"
              >
                <div className="size-6 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <Instagram className="size-3.5 text-white" />
                </div>
                <span>
                  Official Instagram:{" "}
                  <strong className="text-pink-500 font-bold group-hover:underline">
                    instagram/mylinkqr
                  </strong>
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Video Player & Tab Switcher Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-14">
          <BusinessVideoSeries initialVideoId="restaurant-kj" showTitle={false} />
        </section>

        {/* Instagram Featured Callout Banner */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="max-w-4xl mx-auto rounded-3xl border border-pink-500/30 bg-card/80 p-5 sm:p-7 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left transition-all hover:border-pink-500/50">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full bg-card rounded-[14px] flex items-center justify-center">
                  <Instagram className="size-7 text-pink-500" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-500 uppercase tracking-wider">
                  <Instagram className="size-3.5" /> Follow Our Journey
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Watch Daily Reels on Instagram:{" "}
                  <span className="text-pink-500">instagram/mylinkqr</span>
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg">
                  See real restaurant case studies, QR stand designs, staff training shorts, and
                  live customer reactions at <strong className="text-foreground">@mylinkqr</strong>.
                </p>
              </div>
            </div>
            <a
              href="https://instagram.com/mylinkqr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs hover:opacity-90 hover:shadow-lg hover:shadow-pink-500/25 transition-all shrink-0"
            >
              <Instagram className="size-4" /> Open instagram/mylinkqr
            </a>
          </div>
        </section>

        {/* Instagram Profile & Video Reels Feed */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <InstagramProfileFeed />
        </section>

        {/* Meeting Booking & Consultation Form Section */}
        <section
          id="booking-form"
          className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-28"
        >
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
                  Fill in your restaurant details below and our specialist team will contact you on
                  WhatsApp to set up your digital QR menu, print table stands, and guide your staff.
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
                    <div className="grid size-8 place-items-center rounded-lg bg-pink-500/10 text-pink-500 shrink-0">
                      <Instagram className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Instagram ID</p>
                      <a
                        href="https://instagram.com/mylinkqr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:underline font-medium"
                      >
                        instagram/mylinkqr
                      </a>
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
                          onChange={(e) =>
                            setBookingForm({ ...bookingForm, phone: e.target.value })
                          }
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
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, businessName: e.target.value })
                      }
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
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, address: e.target.value })
                        }
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
