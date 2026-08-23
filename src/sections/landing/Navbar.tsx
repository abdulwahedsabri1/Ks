import { Link } from "@tanstack/react-router";
import { QrCode, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between rounded-full border border-border transition-all duration-300 ${
            scrolled ? "bg-card/80 shadow-soft backdrop-blur-md px-6 py-3" : "bg-card/40 px-6 py-4"
          }`}
        >
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
                <QrCode className="size-5" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                My QR Link
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <motion.a
              whileTap={{ scale: 0.9 }}
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Features
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.9 }}
              href="#previews"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Live Previews
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.9 }}
              href="#showcase"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Showcase
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.9 }}
              href="#pricing"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Pricing
            </motion.a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/auth"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6"
            >
              <Link to="/auth">Start free</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-4 right-4 top-24 rounded-2xl border border-border bg-card/95 p-6 shadow-lift backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-6">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#previews"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Live Previews
              </a>
              <a
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Showcase
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </a>
              <div className="h-px bg-border my-2" />
              <div className="flex flex-col gap-4">
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
                >
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Start free
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
