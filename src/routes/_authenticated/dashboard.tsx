import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  shopCatalogLabel,
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
  shopFeatures,
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const [, setNowTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const views = (events ?? []).filter((e) => e.event_type === "view").length;
  const scans = (events ?? []).filter((e) => e.event_type === "scan").length;

  const priceOf = (p: PlanItem) => {
    if (billingCycle === "yearly") {
      return p.yearlyPriceNumber || (p.priceNumber ? p.priceNumber * 10 : 0);
    }
    return p.priceNumber ?? parsePriceNumber(p.price);
  };

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
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
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
            <Stat
              label={`${shopCatalogLabel(shop)} items`}
              sublabel="Active catalog"
              value={items?.length ?? 0}
              icon={UtensilsCrossed}
            />
            <Stat
              label="Current plan"
              sublabel={daysRemaining(shop) !== Infinity && daysRemaining(shop) > 0 ? `${daysRemaining(shop)}d left` : "Active"}
              value={shop.plan}
              icon={Sparkles}
            />
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

          <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
            {shop.cover_url && (
              <div className="h-32 sm:h-40 w-full overflow-hidden border-b border-border/40">
                <img
                  src={shop.cover_url}
                  alt={`${shop.name} cover`}
                  className="size-full object-cover"
                />
              </div>
            )}
            <div className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={`${shop.name} logo`}
                      className="size-12 sm:size-16 rounded-2xl object-cover border border-border shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="size-12 sm:size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-extrabold text-xl shrink-0">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-base sm:text-xl font-bold truncate">
                      {shop.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                        {shop.niche}
                      </p>
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-mono font-bold text-amber-500 shrink-0">
                        {shopBusinessId(shop)}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold shrink-0 ${
                    subscriptionState(shop) === "active"
                      ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                      : subscriptionState(shop) === "payment_pending"
                        ? "bg-yellow-500/15 text-yellow-600 border border-yellow-500/20"
                        : subscriptionState(shop) === "grace_period"
                          ? "bg-orange-500/15 text-orange-600 border border-orange-500/20"
                          : subscriptionState(shop) === "suspended"
                            ? "bg-red-500/15 text-red-600 border border-red-500/20"
                            : "bg-slate-500/15 text-slate-600 border border-slate-500/20"
                  }`}
                >
                  {subscriptionStateLabel(subscriptionState(shop))}
                </span>
              </div>

              <div className="mt-5 grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                <Meta label="Plan" value={<span className="capitalize">{shop.plan}</span>} />
                <Meta
                  label="Payment"
                  value={
                    shop.payment_status === "paid" ? (
                      <span className="text-emerald-500 font-bold">
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
                <div className="mt-5 rounded-2xl border bg-muted/30 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-semibold">Subscription Progress</span>
                    <span className="font-bold text-foreground">
                      {daysRemaining(shop) > 0
                        ? `${daysRemaining(shop)} days remaining (${planProgressPercent(shop)}%)`
                        : "Expired"}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted border">
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
                    Your <span className="capitalize font-bold text-foreground">{shop.plan}</span> plan started on{" "}
                    <span className="font-semibold text-foreground">
                      {formatDate(shop.plan_started_at || shop.created_at)}
                    </span>{" "}
                    and is
                    {daysRemaining(shop) > 0
                      ? ` active for ${daysRemaining(shop)} more days (expires ${formatDate(shop.plan_expires_at)}).`
                      : " expired. Please upgrade or renew your plan below."}
                  </p>
                </div>
              )}

              <ul className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {(() => {
                  const feat = shopFeatures(shop);
                  return [
                    {
                      label: `${Number.isFinite(feat.items) ? feat.items : "Unlimited"} items`,
                      locked: false,
                    },
                    {
                      label: feat.ai ? "AI tools" : "AI locked",
                      locked: !feat.ai,
                    },
                    {
                      label: feat.ordering ? "WhatsApp ordering" : "Ordering locked",
                      locked: !feat.ordering,
                    },
                    {
                      label: feat.analytics ? "Full analytics" : "Basic views",
                      locked: !feat.analytics,
                    },
                    {
                      label: feat.themes ? "18 Custom themes" : "Standard themes",
                      locked: !feat.themes,
                    },
                    {
                      label: feat.delivery ? "Delivery mode" : "Delivery locked",
                      locked: !feat.delivery,
                    },
                    {
                      label: feat.google_reviews ? "Google Reviews" : "Reviews locked",
                      locked: !feat.google_reviews,
                    },
                    {
                      label: feat.upi ? "UPI Payments" : "UPI locked",
                      locked: !feat.upi,
                    },
                  ];
                })().map((f) => (
                  <li
                    key={f.label}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      f.locked
                        ? "border-red-500/20 text-red-500/80 bg-red-500/5"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                      <Sparkles className="size-4 text-amber-500" /> Subscription Plans & Instant Upgrade
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Click any plan to open Razorpay checkout. Get 2 months extra free on annual subscriptions!
                    </p>
                  </div>

                  {/* Monthly / Yearly Toggle */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border/80 shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        billingCycle === "monthly"
                          ? "bg-background text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("yearly")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        billingCycle === "yearly"
                          ? "bg-amber-500 text-black shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/20 text-[9px] font-extrabold uppercase">
                        2 Mos Free
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  {paidPlans.map((p) => {
                    const isCurrent = shop.plan === p.id;
                    const price = priceOf(p);
                    const isPopular = Boolean(p.highlight || p.badge === "MOST POPULAR");
                    const extraMonths = typeof p.extraMonths === "number" ? p.extraMonths : 2;
                    const totalMonths = 12 + extraMonths;

                    return (
                      <div
                        key={p.id}
                        className={`relative rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                          isCurrent
                            ? "border-emerald-500 bg-emerald-500/5 shadow-md ring-1 ring-emerald-500/30"
                            : isPopular
                              ? "border-amber-500/80 bg-amber-500/5 shadow-md ring-1 ring-amber-500/30"
                              : "border-border bg-card hover:border-amber-500/40 shadow-sm"
                        }`}
                      >
                        {isCurrent ? (
                          <div className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm">
                            Current Plan
                          </div>
                        ) : isPopular ? (
                          <div className="absolute -top-2.5 right-4 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full shadow-sm">
                            MOST POPULAR
                          </div>
                        ) : null}

                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-display text-base font-bold text-foreground">
                              {p.name}
                            </h4>
                            <span className="font-display text-xl font-extrabold text-amber-500">
                              ₹{price}
                              <span className="text-xs font-normal text-muted-foreground">
                                /{billingCycle === "yearly" ? "yr" : "mo"}
                              </span>
                            </span>
                          </div>

                          {billingCycle === "yearly" && (
                            <p className="text-[10px] font-bold text-amber-500 mb-2">
                              🎁 Includes {totalMonths} Months Access ({extraMonths > 0 ? `12 Mos + ${extraMonths} ${extraMonths === 1 ? "Mo" : "Mos"} Free` : "12 Months Access"})
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mb-4 min-h-[32px] leading-relaxed">
                            {p.tagline}
                          </p>

                          <ul className="space-y-2 mb-4 text-xs text-muted-foreground">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-center gap-2">
                                <div className="size-4 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                                  <Check className="size-2.5" />
                                </div>
                                <span className="truncate font-medium">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-border/50 space-y-2">
                          <Button
                            onClick={() => handlePlanClick(p)}
                            size="sm"
                            className={`w-full h-10 text-xs font-bold rounded-xl transition-all shadow-sm ${
                              isCurrent
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : isPopular
                                  ? "bg-amber-500 hover:bg-amber-600 text-black"
                                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            <Zap className="size-3.5 mr-1.5 fill-current" />
                            {isCurrent ? `Renew ${p.name} (₹${price})` : `Upgrade to ${p.name}`}
                          </Button>
                          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="size-2.5 text-muted-foreground" /> Instant Razorpay Gateway
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Action Navigation Bar */}
              <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 w-full sm:w-auto">
                  <Button asChild variant="outline" size="sm" className="h-10 text-xs font-bold rounded-xl">
                    <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5 mr-1.5" /> View Public Shop
                    </a>
                  </Button>
                  <Button asChild size="sm" className="h-10 text-xs font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-600">
                    <Link to="/menu">Edit {shopCatalogLabel(shop)}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs font-bold rounded-xl col-span-2 sm:col-span-1"
                  >
                    <Link to="/qr">Get QR Code</Link>
                  </Button>
                  {shopGoogleReviewLink(shop) && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs font-bold rounded-xl col-span-2 sm:col-span-1 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                    >
                      <a href={shopGoogleReviewLink(shop)} target="_blank" rel="noreferrer">
                        <Star className="size-3.5 mr-1.5 fill-amber-400 text-amber-400" /> Google Review
                      </a>
                    </Button>
                  )}
                </div>

                {shop.plan === "trial" && (
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="h-10 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl w-full sm:w-auto"
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
            billingCycle={billingCycle}
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
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
      <p className="mt-0.5 text-xs sm:text-sm font-bold truncate">{value}</p>
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
  value: React.ReactNode;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-3xl border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{label}</p>
          {sublabel && (
            <p className="text-[10px] text-amber-500 font-semibold truncate">{sublabel}</p>
          )}
        </div>
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-2 font-display text-xl sm:text-3xl font-extrabold capitalize">{value}</p>
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
