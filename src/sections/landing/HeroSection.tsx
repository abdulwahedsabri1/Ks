import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Play, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background pt-32 pb-20 md:pt-48 md:pb-32">
      {/* Background Gradient & Grid */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-hero-gradient mix-blend-screen" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm mb-8">
              <Sparkles className="size-4 text-primary" />
              <span>One QR. Unlimited Possibilities.</span>
            </div>

            <h1 className="font-display text-5xl font-medium leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] mb-6">
              Transform any <br className="hidden sm:block" />
              business into a <br className="hidden sm:block" />
              <span className="text-gradient font-bold italic">premium digital</span>{" "}
              <br className="hidden sm:block" />
              <span className="text-gradient font-bold italic">experience</span>
            </h1>

            <p className="text-lg text-muted-foreground sm:text-xl max-w-xl mb-10 leading-relaxed">
              Create QR menus, business profiles, catalogs, product showcases, promotions and
              customer experiences in minutes — no design or developer needed.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base"
              >
                <Link to="/auth">
                  Start free trial <ArrowRight className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border bg-card/30 hover:bg-card/50 h-14 px-8 text-base backdrop-blur-sm"
              >
                <a href="#demo">
                  <Play className="mr-2 size-5" /> Watch demo
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 1, ease: "easeOut", delay: 0.2 },
              scale: { duration: 1, ease: "easeOut", delay: 0.2 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative lg:ml-auto w-full max-w-xl"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-lift">
              <img
                src="/hero_qr.jpg"
                alt="Premium Restaurant QR Display"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>

            {/* Floating Card 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 0.8 },
                x: { duration: 0.8, delay: 0.8 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
              }}
              className="absolute top-12 -left-8 sm:-left-16 glass-card rounded-2xl p-4 pr-6 flex items-center gap-4"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                <QrCode className="size-5" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">1,284 scans today</p>
                <p className="text-xs text-muted-foreground">Royal Biryani · Hyderabad</p>
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: 1.1 },
                x: { duration: 0.8, delay: 1.1 },
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
              }}
              className="absolute bottom-16 -right-4 sm:-right-12 glass-card rounded-2xl p-4 pr-6 flex items-center gap-4"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">+42% repeat visits</p>
                <p className="text-xs text-muted-foreground">after menu refresh</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
