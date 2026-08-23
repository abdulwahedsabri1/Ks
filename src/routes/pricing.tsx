import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/shop";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — MenuQR Pro" },
      {
        name: "description",
        content:
          "Free QR menus to start, with Pro and Premium plans for analytics, AI menus and WhatsApp ordering.",
      },
      { property: "og:title", content: "Pricing — MenuQR Pro" },
      { property: "og:description", content: "Plans for every local business, starting free." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <QrCode className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">MenuQR Pro</span>
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-center font-display text-4xl font-semibold">Pricing</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Start free. Upgrade when your menu starts selling for you.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border bg-card p-6 ${p.highlight ? "ring-2 ring-primary" : ""}`}
            >
              <h2 className="font-display text-xl font-semibold">{p.name}</h2>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-4 font-display text-3xl font-semibold">{p.price}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={p.highlight ? "default" : "outline"}>
                <Link to="/auth">Choose {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
