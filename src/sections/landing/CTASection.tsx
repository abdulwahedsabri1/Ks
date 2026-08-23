import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="bg-primary py-24 md:py-32 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-primary-foreground">
        <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-semibold mb-6 max-w-4xl mx-auto">
          Ready to elevate your customer experience?
        </h2>
        <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
          Join thousands of local businesses using My QR Link to drive sales and engage customers.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-background text-foreground hover:bg-background/90 h-14 px-8 text-lg w-full sm:w-auto"
          >
            <Link to="/auth">Start your free trial</Link>
          </Button>
          <p className="text-sm text-primary-foreground/70 sm:ml-4">
            No credit card required • Setup in 5 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
