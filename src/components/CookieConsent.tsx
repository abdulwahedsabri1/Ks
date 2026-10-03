import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("mylink_cookie_consent");
      if (!consent) {
        timer = setTimeout(() => setIsVisible(true), 1200);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      "mylink_cookie_consent",
      JSON.stringify({ essential: true, analytics: true, timestamp: Date.now() }),
    );
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      "mylink_cookie_consent",
      JSON.stringify({ essential: true, analytics: false, timestamp: Date.now() }),
    );
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl text-card-foreground"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Cookie className="size-4" />
              </div>
              <h3 className="font-display font-semibold text-sm">Cookie Preferences</h3>
            </div>
            <button
              onClick={handleDecline}
              aria-label="Close cookie consent"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            We use essential cookies for authentication and performance analytics to ensure your QR
            menus load at lightning speed. Learn more in our{" "}
            <Link to="/privacy" className="text-primary underline hover:opacity-80">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-2 rounded-xl border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
            >
              Essential Only
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
