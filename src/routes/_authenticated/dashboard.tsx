import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  QrCode,
  UtensilsCrossed,
  Lock,
  Star,
  Sparkles,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useAnalytics,
  useIsAdmin,
  useMenuItems,
  useMyShop,
  useCustomPlans,
} from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { RazorpayModal } from "@/components/RazorpayModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatDate,
  money,
  NICHES,
  planOf,
  PLAN_PRICE,
  planAmount,
  slugify,
  subscriptionState,
  subscriptionStateLabel,
  daysRemaining,
  PAYMENT_STATUSES,
  shopGoogleReviewLink,
  PLANS,
  analyticsRemainingDays,
  analyticsLastResetDate,
  planTotalDays,
  planProgressPercent,
  parsePriceNumber,
  type PlanItem,
  shopBusinessId,
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
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: shop, isLoading } = useMyShop(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: items } = useMenuItems(shop?.id);
  const { data: plans = PLANS } = useCustomPlans();
  const resetAt = (shop?.features as Record<string, unknown> | null)?.["analytics_reset_at"] as
    string | undefined;
  const { data: events } = useAnalytics(shop?.id, 30, resetAt);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  const views = (events ?? []).filter((e) => e.event_type === "view").length;
  const scans = (events ?? []).filter((e) => e.event_type === "scan").length;

  const priceOf = (p: PlanItem) => p.priceNumber ?? parsePriceNumber(p.price);

  const handlePlanClick = (p: PlanItem) => {
    setSelectedPlan(p);
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    qc.invalidateQueries();
  };

  const paidPlans = plans.filter((p) => p.id !== "trial");
  const resetRemainingDays = analyticsRemainingDays(shop);

  return (
    <DashboardShell title="Dashboard" description="Overview of your shop." isAdmin={isAdmin}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !shop ? (
        <CreateShop userId={user?.id} />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <Stat
              label="Menu views"
              sublabel={`30d cycle (${resetRemainingDays}d left)`}
              value={views}
              icon={BarChart3}
            />
            <Stat
              label="QR scans"
              sublabel={`30d cycle (${resetRemainingDays}d left)`}
              value={scans}
              icon={QrCode}
            />
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

          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
            {shop.cover_url && (
              <div className="h-28 w-full overflow-hidden border-b border-border/40">
                <img
                  src={shop.cover_url}
                  alt={`${shop.name} cover`}
                  className="size-full object-cover"
                />
              </div>
            )}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={`${shop.name} logo`}
                      className="size-12 sm:size-14 rounded-xl object-cover border border-border shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="size-12 sm:size-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base sm:text-lg font-bold truncate">
                      {shop.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {shop.niche}
                      </p>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-primary shrink-0">
                        {shopBusinessId(shop)}
                      </span>
                    </div>
                  </div>
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
                      <span className="text-primary font-semibold">
                        Paid{" "}
                        {money(
                          Number(
                            shop.amount_paid && Number(shop.amount_paid) > 0
                              ? shop.amount_paid
                              : planAmount(shop.plan, shop.billing_cycle ?? "monthly", plans),
                          ),
                        )}
                      </span>
                    ) : shop.payment_status === "pending" ? (
                      <span className="text-yellow-600 font-semibold">Pending</span>
                    ) : shop.plan === "trial" ? (
                      <span className="text-muted-foreground">Free Trial</span>
                    ) : (
                      <span className="text-muted-foreground">Not Paid</span>
                    )
                  }
                />
                <Meta
                  label="Billing"
                  value={<span className="capitalize">{shop.billing_cycle ?? "monthly"}</span>}
                />
                <Meta
                  label="Start Date"
                  value={formatDate(shop.plan_started_at || shop.created_at)}
                />
                <Meta label="Expiry" value={formatDate(shop.plan_expires_at)} />
                <Meta
                  label="Auto Renew"
                  value={
                    shop.auto_renew !== false ? (
                      <span className="text-emerald-600 font-semibold">Enabled</span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )
                  }
                />
                <Meta label="Grace Period" value={`${shop.grace_period_days ?? 7} days`} />
              </div>

              {/* Progress Bar - Days Remaining */}
              {shop.plan_expires_at && daysRemaining(shop) !== Infinity && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Subscription Progress</span>
                    <span className="font-medium">
                      {daysRemaining(shop) > 0
                        ? `${daysRemaining(shop)} days remaining (${planProgressPercent(shop)}%)`
                        : "Expired"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        planProgressPercent(shop) > 40
                          ? "bg-emerald-500"
                          : planProgressPercent(shop) > 15
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${planProgressPercent(shop)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Your <span className="capitalize font-medium">{shop.plan}</span> plan started on{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(shop.plan_started_at || shop.created_at)}
                    </span>{" "}
                    and is
                    {daysRemaining(shop) > 0
                      ? ` active for ${daysRemaining(shop)} more days (expires ${formatDate(shop.plan_expires_at)}).`
                      : " expired. Please upgrade or renew your plan."}
                  </p>
                </div>
              )}

              <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {[
                  {
                    label: `${Number.isFinite(planOf(shop.plan).items) ? planOf(shop.plan).items : "Unlimited"} items`,
                    locked: false,
                  },
                  {
                    label:
                      (shop.features as Record<string, unknown> | null)?.["ai"] ||
                      planOf(shop.plan).ai
                        ? "AI tools"
                        : "AI locked",
                    locked: !(
                      (shop.features as Record<string, unknown> | null)?.["ai"] ||
                      planOf(shop.plan).ai
                    ),
                  },
                  {
                    label:
                      (shop.features as Record<string, unknown> | null)?.["ordering"] ||
                      planOf(shop.plan).ordering
                        ? "WhatsApp ordering"
                        : "Ordering locked",
                    locked: !(
                      (shop.features as Record<string, unknown> | null)?.["ordering"] ||
                      planOf(shop.plan).ordering
                    ),
                  },
                  {
                    label:
                      (shop.features as Record<string, unknown> | null)?.["analytics"] ||
                      planOf(shop.plan).analytics
                        ? "Full analytics"
                        : "Basic views",
                    locked: !(
                      (shop.features as Record<string, unknown> | null)?.["analytics"] ||
                      planOf(shop.plan).analytics
                    ),
                  },
                ].map((f) => (
                  <li
                    key={f.label}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                      f.locked
                        ? "border-red-500/20 text-red-500/80 bg-red-500/5"
                        : "bg-emerald-500/10 text-emerald-600 font-medium border-emerald-500/20"
                    }`}
                  >
                    {f.locked ? (
                      <Lock className="inline-block size-3 mr-1 mb-0.5 text-red-500" />
                    ) : (
                      <Check className="inline-block size-3 mr-1 mb-0.5 text-emerald-600" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>

              {/* ── 3-Plan Instant Upgrade Cards (Razorpay Integrated) ── */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                      <Sparkles className="size-4 text-amber-500" /> Choose or Upgrade Your
                      Subscription Plan
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click any plan to open instant Razorpay checkout. Plan updates activate
                      immediately upon payment.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  {paidPlans.map((p) => {
                    const isCurrent = shop.plan === p.id;
                    const price = priceOf(p);

                    return (
                      <div
                        key={p.id}
                        className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                          isCurrent
                            ? "border-emerald-500 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/30"
                            : p.highlight
                              ? "border-amber-500/60 bg-amber-500/5 shadow-md ring-1 ring-amber-500/20"
                              : "border-border bg-card hover:border-primary/40 shadow-sm"
                        }`}
                      >
                        {isCurrent ? (
                          <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow">
                            Current Plan
                          </div>
                        ) : p.highlight ? (
                          <div className="absolute -top-2.5 right-4 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow">
                            Most Popular
                          </div>
                        ) : null}

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-display text-base font-bold text-foreground">
                              {p.name}
                            </h4>
                            <span className="font-display text-xl font-extrabold text-amber-500">
                              ₹{price}
                              <span className="text-xs font-normal text-muted-foreground">/mo</span>
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 min-h-[32px]">
                            {p.tagline}
                          </p>

                          <ul className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-2">
                                <div className="size-3.5 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                                  <Check className="size-2.5" />
                                </div>
                                <span className="truncate">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 border-t border-border/50 space-y-1.5">
                          <Button
                            onClick={() => handlePlanClick(p)}
                            size="sm"
                            className={`w-full h-9 text-xs font-bold rounded-xl transition-all shadow-sm ${
                              isCurrent
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : p.highlight
                                  ? "bg-amber-500 hover:bg-amber-600 text-black"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            <Zap className="size-3.5 mr-1.5 fill-current" />
                            {isCurrent ? `Renew ${p.name} (₹${price})` : `Upgrade to ${p.name}`}
                          </Button>
                          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="size-2.5 text-muted-foreground" /> Instant Razorpay
                            Gateway
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs col-span-2 sm:col-span-1"
                  >
                    <Link to="/qr">Get QR Code</Link>
                  </Button>
                  {shopGoogleReviewLink(shop) && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs col-span-2 sm:col-span-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                    >
                      <a href={shopGoogleReviewLink(shop)} target="_blank" rel="noreferrer">
                        <Star className="size-3.5 mr-1 fill-amber-400 text-amber-400" /> Google
                        Review
                      </a>
                    </Button>
                  )}
                </div>

                {shop.plan === "trial" && (
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="h-9 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-medium w-full sm:w-auto"
                  >
                    <Link to="/pricing">Compare All Features</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <RazorpayModal
            plan={selectedPlan}
            price={priceOf(selectedPlan)}
            onClose={() => setSelectedPlan(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
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
  sublabel,
  value,
  icon: Icon,
}: {
  label: string;
  sublabel?: string;
  value: number;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-2xl border bg-card p-3.5 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-amber-500 font-medium truncate">{sublabel}</p>
          )}
        </div>
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
      status: "active",
      plan: "trial",
      plan_expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
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
          <Label htmlFor="shop-name" className="text-xs font-semibold">
            Shop name
          </Label>
          <Input
            id="shop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rafeek Textile"
            className="text-xs h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="niche" className="text-xs font-semibold">
            Business type
          </Label>
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
          <Label htmlFor="wa" className="text-xs font-semibold">
            WhatsApp number (with country code)
          </Label>
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
