import { createFileRoute } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Support — MY Link QR" },
      {
        name: "description",
        content: "Get in touch with MY Link QR support team. WhatsApp, phone, email, and live inquiry assistance.",
      },
      { property: "og:title", content: "Contact Support — MY Link QR" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }

    const whatsappMessage = `*NEW CONTACT INQUIRY - MY LINK QR*

*Name:* ${name}
*Email:* ${email}
*Phone:* ${phone || "N/A"}
*Subject:* ${subject || "General Inquiry"}

*Message:*
${message}`;

    const encoded = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/919392318135?text=${encoded}`;

    toast.success("Message submitted! Opening WhatsApp support...");
    setSubmitted(true);

    const opened = window.open(whatsappUrl, "_blank");
    if (!opened) {
      window.location.href = whatsappUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
              <Phone className="size-3.5" />
              Get In Touch
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6">
              We're here to <span className="italic text-primary">help you grow</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Have a question about our QR menus, custom templates, or pricing? Reach out to our team anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto items-start">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card text-foreground p-8 md:p-10 rounded-3xl border border-border shadow-xl relative overflow-hidden space-y-8">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] pointer-events-none" />
                
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2">Direct Contact Information</h2>
                  <p className="text-sm text-muted-foreground">Connect directly with our support engineers.</p>
                </div>

                <div className="space-y-6 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MessageCircle className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">WhatsApp Support</p>
                      <p className="font-mono text-base font-semibold text-foreground">+91 9392318135</p>
                      <p className="text-xs text-muted-foreground">Instant response (24/7)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Mail className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Email Inquiry</p>
                      <p className="font-medium text-foreground">support@mylinkqr.com</p>
                      <p className="text-xs text-muted-foreground">Response within 2 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Operating Hours</p>
                      <p className="font-medium text-foreground">Mon – Sun: 9:00 AM – 9:00 PM IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Headquarters</p>
                      <p className="font-medium text-foreground">Mumbai, Maharashtra, India</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-3xl border border-border shadow-md flex items-center gap-4">
                <CheckCircle2 className="size-8 text-green-500 shrink-0" />
                <div>
                  <h3 className="font-display font-semibold text-base">Quick WhatsApp Help</h3>
                  <p className="text-xs text-muted-foreground">Click submit to immediately initiate a WhatsApp live support chat.</p>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-3">
              <div className="bg-card p-8 md:p-12 rounded-3xl border border-border shadow-xl">
                <h2 className="font-display text-2xl font-semibold mb-6">Send Us a Message</h2>

                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <CheckCircle2 className="size-16 text-green-500 mx-auto" />
                    <h3 className="font-display text-2xl font-semibold">Thank You!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your message has been sent to our team. If WhatsApp didn't open automatically, feel free to message us directly at +91 9392318135.
                    </p>
                    <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-4 rounded-full">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone / WhatsApp Number</Label>
                        <Input
                          id="phone"
                          placeholder="+91 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="E.g. Custom Template Request"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message *</Label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="Tell us how we can help your business..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-semibold">
                      <Send className="size-4 mr-2" /> Send Message
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
