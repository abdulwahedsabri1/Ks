import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  QrCode,
  UtensilsCrossed,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, useIsAdmin, useMenuItems, useMyShop } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  money,
  NICHES,
  planOf,
  PLAN_PRICE,
  slugify,
  subscriptionState,
  subscriptionStateLabel,
  daysRemaining,
  PAYMENT_STATUSES,
} from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MY Link QR" },
      {
        name: "description",
        content: "Manage your shop, menu and QR code from your MY Link QR dashboard.",
      },
      { property: "og:title", content: "Dashboard — MY Link QR" },
      { property: "og:description", content: "Manage your shop, menu and QR code." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { data: shop, isLoading } = useMyShop(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: items } = useMenuItems(shop?.id);
  const { data: events } = useAnalytics(shop?.id);

  const views = (events ?? []).filter((e) => e.event_type === "view").length;
  const scans = (events ?? []).filter((e) => e.event_type === "scan").length;

  return (
    <DashboardShell title="Dashboard" description="Overview of your shop." isAdmin={isAdmin}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !shop ? (
        <CreateShop userId={user?.id} />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <Stat label="Menu views (30d)" value={views} icon={BarChart3} />
            <Stat label="QR scans (30d)" value={scans} icon={QrCode} />
            <div className="col-span-2 sm:col-span-1">
              <Stat label="Menu items" value={items?.length ?? 0} icon={UtensilsCrossed} />
            </div>
          </div>

          {/* ── Payment Warning Banners ─── */}
          {(shop.payment_status === "pending" || shop.payment_status === "overdue") && (
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 ${shop.payment_status === "overdue" ? "border-red-500/30 bg-red-500/5" : "border-yellow-500/30 bg-yellow-500/5"}`}
            >
              <AlertTriangle
                className={`mt-0.5 size-5 shrink-0 ${shop.payment_status === "overdue" ? "text-red-500" : "text-yellow-500"}`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${shop.payment_status === "overdue" ? "text-red-600" : "text-yellow-600"}`}
                >
                  {shop.payment_status === "overdue" ? "Payment Overdue" : "Payment Pending"}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your subscription payment of{" "}
                  {money(Number(shop.amount_paid ?? PLAN_PRICE[shop.plan] ?? 0))} is{" "}
                  {shop.payment_status}.
                  {shop.payment_status === "pending" &&
                    " Please complete your payment before the due date."}
                  {shop.payment_status === "overdue" && " Your subscription may be suspended soon."}
                </p>
              </div>
            </div>
          )}

          {shop.payment_status === "paid" && subscriptionState(shop) === "active" && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-600">Subscription Active</p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Your payment has been confirmed. Enjoy your {shop.plan} plan!
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base sm:text-lg font-bold truncate">{shop.name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{shop.niche}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0 ${
                  subscriptionState(shop) === "active"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : subscriptionState(shop) === "payment_pending"
                      ? "bg-yellow-500/15 text-yellow-600"
                      : subscriptionState(shop) === "grace_period"
                        ? "bg-orange-500/15 text-orange-600"
                        : subscriptionState(shop) === "suspended"
                          ? "bg-red-500/15 text-red-600"
                          : "bg-slate-500/15 text-slate-600"
                }`}
              >
                {subscriptionStateLabel(subscriptionState(shop))}
              </span>
            </div>

            <div className="mt-4 grid gap-2.5 grid-cols-2 lg:grid-cols-4">
              <Meta label="Plan" value={<span className="capitalize">{shop.plan}</span>} />
              <Meta
                label="Payment"
                value={
                  shop.payment_status === "paid" ? (
                    <span className="text-primary">
                      Paid {money(Number(shop.amount_paid ?? PLAN_PRICE[shop.plan] ?? 0))}
                    </span>
                  ) : shop.payment_status === "pending" ? (
                    <span className="text-yellow-600">Pending</span>
                  ) : shop.payment_status === "overdue" ? (
                    <span className="text-destructive">Overdue</span>
                  ) : shop.plan === "trial" ? (
                    <span className="text-muted-foreground">Free Trial</span>
                  ) : shop.plan === "basic" ? (
                    <span className="text-muted-foreground">Free plan</span>
                  ) : (
                    <span className="text-muted-foreground">Not Paid</span>
                  )
                }
              />
              <Meta
                label="Billing"
                value={<span className="capitalize">{shop.billing_cycle ?? "monthly"}</span>}
              />
              <Meta label="Expiry" value={formatDate(shop.plan_expires_at)} />
            </div>

            {/* Progress Bar - Days Remaining */}
            {shop.plan_expires_at && daysRemaining(shop) !== Infinity && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Subscription Progress</span>
                  <span className="font-medium">
                    {daysRemaining(shop) > 0 ? `${daysRemaining(shop)} days remaining` : "Expired"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      daysRemaining(shop) > 30
                        ? "bg-emerald-500"
                        : daysRemaining(shop) > 3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(2, (daysRemaining(shop) / (shop.plan === "trial" ? 7 : 365)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your <span className="capitalize font-medium">{shop.plan}</span> plan is
                  {daysRemaining(shop) > 0
                    ? ` active for ${daysRemaining(shop)} more days.`
                    : " expired. Please contact admin to renew."}
                </p>
              </div>
            )}

            <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {[
                { label: `${Number.isFinite(planOf(shop.plan).items) ? planOf(shop.plan).items : "Unlimited"} items`, locked: false },
                { label: planOf(shop.plan).ai ? "AI tools" : "AI locked", locked: !planOf(shop.plan).ai },
                { label: planOf(shop.plan).ordering ? "WhatsApp ordering" : "Ordering locked", locked: !planOf(shop.plan).ordering },
                { label: planOf(shop.plan).analytics ? "Full analytics" : "Basic views", locked: !planOf(shop.plan).analytics },
              ].map((f) => (
                <li key={f.label} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${f.locked ? "border-red-500/20 text-red-500/80 bg-red-500/5" : "bg-muted/30"}`}>
                  {f.locked && <Lock className="inline-block size-3 mr-1 mb-0.5" />}
                  {f.label}
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="h-9 text-xs">
                  <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5 mr-1" /> View Menu
                  </a>
                </Button>
                <Button asChild size="sm" className="h-9 text-xs">
                  <Link to="/menu">Edit Menu</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-9 text-xs col-span-2 sm:col-span-1">
                  <Link to="/qr">Get QR Code</Link>
                </Button>
              </div>
              
              {shop.plan === "trial" && (
                <Button asChild variant="default" size="sm" className="h-9 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium w-full sm:w-auto">
                  <Link to="/pricing">Unlock All Features</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-2.5 sm:p-3">
      <p className="text-[11px] sm:text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{label}</p>
        <Icon className="size-4 text-muted-foreground shrink-0" />
      </div>
      <p className="mt-1.5 sm:mt-2 font-display text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
  );
}

function CreateShop({ userId }: { userId?: string | undefined }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [niche, setNiche] = useState(NICHES[0]!);
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!userId) return;
    if (name.trim().length < 2) {
      toast.error("Enter your shop name");
      return;
    }
    setSaving(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("shops").insert({
      owner_id: userId,
      name: name.trim(),
      slug,
      niche,
      whatsapp: whatsapp.trim() || null,
      status: "pending",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Shop created");
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  }

  return (
    <div className="max-w-lg mx-auto sm:mx-0 rounded-2xl border bg-card p-5 sm:p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold">Create your shop</h2>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">This takes about 30 seconds.</p>
      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shop-name" className="text-xs font-semibold">Shop name</Label>
          <Input
            id="shop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rafeek Textile"
            className="text-xs h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="niche" className="text-xs font-semibold">Business type</Label>
          <select
            id="niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs"
          >
            {NICHES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa" className="text-xs font-semibold">WhatsApp number (with country code)</Label>
          <Input
            id="wa"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="919876543210"
            className="text-xs h-10"
          />
        </div>
        <Button className="w-full h-10 text-xs font-bold" onClick={create} disabled={saving}>
          Create shop
        </Button>
      </div>
    </div>
  );
}
