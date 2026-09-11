import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  History,
  Key,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Shield,
  Store,
  Trash2,
  UserCheck,
  Users,
  XCircle,
  Star,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllStaff,
  useIsAdmin,
  useSubscriptionHistory,
  usePaymentHistory,
  useCustomPlans,
  savePlatformPlans,
} from "@/hooks/useShopData";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { useAllReviews, useReviewStats } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  type Shop,
  PAYMENT_STATUSES,
  BILLING_CYCLES,
  PLAN_PRICE,
  NICHES,
  formatDate,
  toDateInput,
  money,
  subscriptionState,
  subscriptionStateLabel,
  planAmount,
  addMonths,
  addDays,
  daysRemaining,
  shopGoogleReviewLink,
  FEATURE_LABELS,
  FEATURE_KEYS,
  type FeatureKey,
  planOf,
  PLANS,
  parsePriceNumber,
  type PlanItem,
  shopBusinessId,
} from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      throw redirect({ to: "/auth" });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "Super Admin — MY Link QR" },
      { name: "description", content: "Manage all shops across the platform." },
      { property: "og:title", content: "Super Admin — MY Link QR" },
      {
        property: "og:description",
        content: "Platform administration for shops, staff and users.",
      },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "shops" | "staff" | "payments" | "reviews" | "analytics" | "settings";

// ─── Manage Modal Tab ───────────────────────────────────────────
type ModalTab =
  "info" | "customer" | "subscription" | "payment" | "features" | "actions" | "history";

// ─── Main Component ─────────────────────────────────────────────
function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const { data: dynamicPlans = PLANS } = useCustomPlans();
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [managingShop, setManagingShop] = useState<Shop | null>(null);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);
  const [shopToResetAnalytics, setShopToResetAnalytics] = useState<Shop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingAnalytics, setIsResettingAnalytics] = useState(false);

  const { data: shops } = useQuery({
    queryKey: ["admin-shops"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<Shop[]> => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Shop[];
    },
  });

  // Real-time subscription: refresh admin shops list when any shop changes
  useEffect(() => {
    if (!isAdmin) return;
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`admin-shops-realtime-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shops" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-shops"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  const { data: staff } = useAllStaff(!!isAdmin);

  const { data: itemCount } = useQuery({
    queryKey: ["admin-item-count"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: scanCount } = useQuery({
    queryKey: ["admin-scan-count"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const filtered = useMemo(() => {
    let list = shops ?? [];
    const term = q.trim().toLowerCase();
    if (term)
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.slug.includes(term) ||
          s.niche.toLowerCase().includes(term),
      );
    if (filterPlan) list = list.filter((s) => s.plan === filterPlan);
    if (filterPayment)
      list = list.filter((s) => (s.payment_status ?? "not_paid") === filterPayment);
    if (filterStatus) list = list.filter((s) => s.status === filterStatus);
    return list;
  }, [shops, q, filterPlan, filterPayment, filterStatus]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
    qc.invalidateQueries({ queryKey: ["my-shop"] });
    qc.invalidateQueries({ queryKey: ["subscription-history"] });
    qc.invalidateQueries({ queryKey: ["payment-history"] });
  }

  async function handleDeleteShop(targetShop: Shop) {
    setIsDeleting(true);
    try {
      // Purge dependent tables
      await supabase.from("analytics_events").delete().eq("shop_id", targetShop.id);
      await supabase.from("subscription_history").delete().eq("shop_id", targetShop.id);
      await supabase.from("payment_history").delete().eq("shop_id", targetShop.id);
      await supabase.from("menu_items").delete().eq("shop_id", targetShop.id);
      await supabase.from("categories").delete().eq("shop_id", targetShop.id);
      await supabase.from("staff").delete().eq("shop_id", targetShop.id);

      // Delete shop
      const { error } = await supabase.from("shops").delete().eq("id", targetShop.id);
      if (error) throw error;

      toast.success(`Shop "${targetShop.name}" deleted successfully.`);
      refresh();
      setShopToDelete(null);
      if (managingShop?.id === targetShop.id) {
        setManagingShop(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete shop.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Platform Settings
  const { data: platformSettings } = useQuery({
    queryKey: ["admin-platform-settings"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "auth_settings")
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error; // ignore no rows error
      return data?.value as { require_email_confirmation?: boolean } | null;
    },
  });

  const toggleEmailConfirmation = async (checked: boolean) => {
    try {
      const { error } = await (supabase as any).from("app_settings").upsert(
        {
          key: "auth_settings",
          value: { require_email_confirmation: checked },
        },
        { onConflict: "key" },
      );

      if (error) throw error;
      toast.success(`Email confirmation is now ${checked ? "REQUIRED" : "DISABLED"}`);
      qc.invalidateQueries({ queryKey: ["admin-platform-settings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    }
  };

  // Auto-purge analytics older than 30 days
  useEffect(() => {
    if (!isAdmin) return;
    const purgeOldAnalytics = async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        await supabase.from("analytics_events").delete().lt("created_at", thirtyDaysAgo);
      } catch (err) {
        console.error("Auto purge analytics error:", err);
      }
    };
    purgeOldAnalytics();
  }, [isAdmin]);

  async function handleResetAnalytics(targetShop: Shop) {
    setIsResettingAnalytics(true);
    try {
      const { error } = await supabase
        .from("analytics_events")
        .delete()
        .eq("shop_id", targetShop.id);
      if (error) throw error;

      const resetTimestamp = new Date().toISOString();
      const currentFeatures = (targetShop.features as Record<string, unknown> | null) ?? {};
      const updatedFeatures = {
        ...currentFeatures,
        analytics_reset_at: resetTimestamp,
      };

      await supabase.from("shops").update({ features: updatedFeatures }).eq("id", targetShop.id);

      await supabase.from("subscription_history").insert({
        shop_id: targetShop.id,
        action: "analytics_reset",
        previous_value: "active_analytics",
        new_value: "reset_to_zero",
        performed_by: user?.id ?? null,
        notes: "Analytics data reset by admin (cycle restarts from 30 days)",
      });

      toast.success(`Analytics reset for "${targetShop.name}".`);
      refresh();
      qc.invalidateQueries({ queryKey: ["analytics"] });
      setShopToResetAnalytics(null);
      if (managingShop?.id === targetShop.id) {
        setManagingShop(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset analytics.");
    } finally {
      setIsResettingAnalytics(false);
    }
  }

  if (isLoading) {
    return (
      <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}>
        <p className="text-slate-400">Loading…</p>
      </AdminFrame>
    );
  }

  if (!isAdmin) {
    return (
      <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <h2 className="font-display text-xl font-semibold text-white">Restricted area</h2>
          <p className="mt-2 text-sm text-slate-400">
            This console is only available to platform administrators.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to my dashboard</Link>
          </Button>
        </div>
      </AdminFrame>
    );
  }

  const allShops = shops ?? [];
  const active = allShops.filter((s) => s.status === "active").length;
  const pendingApproval = allShops.filter((s) => s.status === "pending").length;
  const suspended = allShops.filter((s) => s.status === "suspended").length;
  const paymentPending = allShops.filter((s) => s.payment_status === "pending").length;
  const paidThisMonth = allShops.filter((s) => s.payment_status === "paid").length;
  const expiringSoon = allShops.filter((s) => {
    const d = daysRemaining(s);
    return d <= 7 && d > 0;
  }).length;
  const monthlyRevenue = allShops
    .filter((s) => s.payment_status === "paid" && s.billing_cycle !== "yearly")
    .reduce((sum, s) => sum + Number(s.amount_paid ?? PLAN_PRICE[s.plan] ?? 0), 0);

  return (
    <AdminFrame tab={tab} setTab={setTab} onSignOut={signOut}>
      {/* ─── OVERVIEW ────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStat label="Total shops" value={allShops.length} />
            <AdminStat label="Pending Approval" value={pendingApproval} color="yellow" />
            <AdminStat label="Active shops" value={active} color="emerald" />
            <AdminStat label="Suspended" value={suspended} color="red" />
            <AdminStat label="Payment Pending" value={paymentPending} color="yellow" />
            <AdminStat label="Paid Plans" value={paidThisMonth} color="emerald" />
            <AdminStat label="Monthly Revenue" value={monthlyRevenue} prefix="₹" />
            <AdminStat label="Expiring ≤7 days" value={expiringSoon} color="orange" />
            <AdminStat label="Menu items" value={itemCount ?? 0} />
            <AdminStat label="Tracked events" value={scanCount ?? 0} />
            <AdminStat label="Staff members" value={staff?.length ?? 0} />
            <AdminStat
              label="New this week"
              value={
                allShops.filter((s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000)
                  .length
              }
            />
          </div>

          {expiringSoon > 0 && (
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-left text-sm text-orange-300 transition hover:bg-orange-500/15"
              onClick={() => {
                setTab("shops");
                setFilterStatus("");
                setFilterPayment("");
                setFilterPlan("");
              }}
            >
              <AlertTriangle className="size-5 shrink-0 text-orange-400" />
              <span className="font-medium">
                {expiringSoon} shop{expiringSoon > 1 ? "s" : ""} have subscriptions expiring within
                7 days.
              </span>
              <ChevronRight className="ml-auto size-4" />
            </button>
          )}
        </div>
      )}

      {/* ─── SHOPS TABLE ─────────────────────────── */}
      {tab === "shops" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shops…"
              className="max-w-xs border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">All Plans</option>
              {dynamicPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">All Payments</option>
              {PAYMENT_STATUSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-sm text-slate-200">
              <thead className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Shop</th>
                  <th className="p-3">Niche</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Billing</th>
                  <th className="p-3">Expiry</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const ps = s.payment_status ?? "not_paid";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.02]"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt={`${s.name} logo`}
                              className="size-8 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white">{s.name}</p>
                              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                                {shopBusinessId(s)}
                              </span>
                            </div>
                            <a
                              href={`/shop/${s.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-400 hover:underline"
                            >
                              /shop/{s.slug}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-300">{s.niche}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
                          {s.plan}
                        </span>
                      </td>
                      <td className="p-3">
                        <PaymentBadge status={ps} />
                      </td>
                      <td className="p-3 capitalize text-slate-300">
                        {s.billing_cycle ?? "monthly"}
                      </td>
                      <td className="p-3 text-slate-300">{formatDate(s.plan_expires_at)}</td>
                      <td className="p-3">
                        <StatusBadge status={subscriptionState(s)} />
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 bg-transparent text-white hover:bg-white/10"
                            onClick={() => setManagingShop(s)}
                          >
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            title="Reset Analytics"
                            onClick={() => setShopToResetAnalytics(s)}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="Delete Shop"
                            onClick={() => setShopToDelete(s)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={8}>
                      No shops found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── STAFF ───────────────────────────────── */}
      {tab === "staff" && <StaffTable staff={staff ?? []} />}

      {/* ─── PAYMENTS ────────────────────────────── */}
      {tab === "payments" && <PaymentManagement isAdmin={isAdmin} />}

      {/* ─── PLATFORM SETTINGS ───────────────────── */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-4xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-display text-lg font-semibold text-white">
              Authentication Settings
            </h3>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              Manage global authentication behaviors for the platform.
            </p>

            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-white">Require Email Confirmation</div>
                <div className="text-xs text-slate-400 max-w-lg">
                  When enabled, new users must click a confirmation link in their email before they
                  can log in. When disabled, users are instantly verified (requires SERVICE_ROLE_KEY
                  to be set in .env).
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={platformSettings?.require_email_confirmation ?? true}
                  onChange={(e) => toggleEmailConfirmation(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANAGE MODAL ────────────────────────── */}
      {managingShop && (
        <ManageShopModal
          shop={managingShop}
          userId={user?.id}
          onClose={() => setManagingShop(null)}
          onDeleteClick={(s) => setShopToDelete(s)}
          onRefresh={() => {
            refresh();
            setManagingShop(null);
          }}
        />
      )}

      {/* ─── DELETE SHOP CONFIRMATION DIALOG ─────── */}
      {shopToDelete && (
        <Dialog open onOpenChange={(open) => !open && !isDeleting && setShopToDelete(null)}>
          <DialogContent className="bg-slate-900 text-slate-100 border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2 text-lg">
                <Trash2 className="size-5" /> Delete Shop — {shopToDelete.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm text-slate-300">
              <p>
                Are you sure you want to permanently delete{" "}
                <strong className="text-white">{shopToDelete.name}</strong> (
                <code className="text-emerald-400">/shop/{shopToDelete.slug}</code>)?
              </p>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 space-y-1">
                <p className="font-semibold text-red-200 flex items-center gap-1">
                  <AlertTriangle className="size-4 text-red-400" /> Irreversible Action
                </p>
                <p>
                  This will purge all associated menu categories, items, analytics events, staff
                  roles, and payment records. This cannot be undone.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={isDeleting}
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setShopToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => handleDeleteShop(shopToDelete)}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Shop"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── RESET ANALYTICS CONFIRMATION DIALOG ─── */}
      {shopToResetAnalytics && (
        <Dialog open={!!shopToResetAnalytics} onOpenChange={() => setShopToResetAnalytics(null)}>
          <DialogContent className="bg-slate-900 text-slate-100 border-white/10 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <RotateCcw className="size-5 text-amber-400" /> Reset Analytics Data
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm text-slate-300">
              <p>
                Are you sure you want to reset all analytics for{" "}
                <strong className="text-white">{shopToResetAnalytics.name}</strong> (
                <code className="text-emerald-400">/shop/{shopToResetAnalytics.slug}</code>)?
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
                <p className="font-semibold text-amber-200 flex items-center gap-1">
                  <AlertTriangle className="size-4 text-amber-400" /> Confirm Analytics Reset
                </p>
                <p>
                  This will clear all views, item clicks, and scan counts for this shop. Analytics
                  automatically purge entries older than 30 days.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                disabled={isResettingAnalytics}
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setShopToResetAnalytics(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={isResettingAnalytics}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5"
                onClick={() => handleResetAnalytics(shopToResetAnalytics)}
              >
                {isResettingAnalytics ? "Resetting..." : "Reset Analytics"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── REVIEWS ────────────────────────────── */}
      {tab === "reviews" && <ReviewsPanel isAdmin={!!isAdmin} />}
    </AdminFrame>
  );
}

// ─── Payment Badge ──────────────────────────────────────────────
function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-yellow-500/15 text-yellow-400",
    not_paid: "bg-slate-500/15 text-slate-400",
    unpaid: "bg-red-500/15 text-red-400",
  };
  const label = PAYMENT_STATUSES.find((p) => p.value === status)?.label ?? status;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        colors[status] ?? colors["not_paid"],
      )}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPending = status === "pending" || status === "payment_pending";
  const isGrace = status === "grace_period";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        status === "active"
          ? "bg-emerald-500/15 text-emerald-400"
          : isPending || isGrace
            ? "bg-yellow-500/15 text-yellow-400"
            : "bg-red-500/15 text-red-400",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Manage Shop Modal ──────────────────────────────────────────
function ManageShopModal({
  shop,
  userId,
  onClose,
  onDeleteClick,
  onRefresh,
}: {
  shop: Shop;
  userId?: string | undefined;
  onClose: () => void;
  onDeleteClick: (shop: Shop) => void;
  onRefresh: () => void;
}) {
  const [modalTab, setModalTab] = useState<ModalTab>("info");
  const [busy, setBusy] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState("");
  const [editInfo, setEditInfo] = useState({ name: shop.name, niche: shop.niche, slug: shop.slug });
  const [localShop, setLocalShop] = useState(shop);
  // Billing form state
  const [billingForm, setBillingForm] = useState({
    startDate: toDateInput(localShop.plan_started_at ?? localShop.created_at),
    endDate: toDateInput(localShop.plan_expires_at),
    payStatus: localShop.payment_status ?? "unpaid",
    quickMonths: 1,
  });
  const [renewalForm, setRenewalForm] = useState({
    autoRenew: localShop.auto_renew !== false,
    gracePeriod: localShop.grace_period_days ?? 7,
  });
  const qc = useQueryClient();
  const { data: dynamicPlans = PLANS } = useCustomPlans();

  const { data: subHistory } = useSubscriptionHistory(shop.id);
  const { data: payHistory } = usePaymentHistory(shop.id);

  const subState = subscriptionState(shop);

  async function logAction(action: string, prevVal: string, newVal: string, actionNotes?: string) {
    await supabase.from("subscription_history").insert({
      shop_id: shop.id,
      action,
      previous_value: prevVal,
      new_value: newVal,
      performed_by: userId ?? null,
      notes: actionNotes || null,
    });
  }

  async function updateShop(
    patch: any,
    action: string,
    prevVal: string,
    newVal: string,
    actionNotes?: string,
  ) {
    setBusy(true);
    const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    await logAction(action, prevVal, newVal, actionNotes);
    toast.success("Shop updated");
    qc.invalidateQueries({ queryKey: ["admin-shops"] });
    qc.invalidateQueries({ queryKey: ["my-shop"] });
    qc.invalidateQueries({ queryKey: ["subscription-history"] });
    setLocalShop((prev: Shop) => ({ ...prev, ...patch }));
    setBusy(false);
  }

  async function saveInfo() {
    await updateShop(
      { name: editInfo.name, niche: editInfo.niche, slug: editInfo.slug },
      "info_updated",
      shop.name,
      editInfo.name,
    );
  }

  async function markPayment(newStatus: string) {
    const patch: any = { payment_status: newStatus };
    if (newStatus === "paid") {
      patch.status = "active";
      const cycle = localShop.billing_cycle ?? "monthly";
      const now = new Date();
      const exp = cycle === "yearly" ? addMonths(now, 12) : addMonths(now, 1);
      patch["plan_started_at"] = now.toISOString();
      patch["plan_expires_at"] = exp.toISOString();
      patch["next_billing_date"] = exp.toISOString();
      const amt = planAmount(localShop.plan, cycle, dynamicPlans);
      patch["amount_paid"] = amt;

      const ALL_FEATURES = {
        logo_cover: true,
        social_link: true,
        opening_hours: true,
        multi_language: true,
        ai: true,
        ordering: true,
        analytics: true,
        qr_downloads: true,
        on_table: true,
        take_away: true,
        delivery: true,
        themes: true,
        google_reviews: true,
        custom_domain: true,
        priority_support: true,
        coupons: true,
        upi: true,
      };
      const unlockedFeatureMap: Record<string, Record<string, boolean>> = {
        basic: { logo_cover: true, social_link: true, opening_hours: true, multi_language: true },
        pro: {
          logo_cover: true,
          social_link: true,
          opening_hours: true,
          multi_language: true,
          ai: true,
          ordering: true,
          analytics: true,
          qr_downloads: true,
          on_table: true,
          take_away: true,
        },
        premium: ALL_FEATURES,
      };
      const unlocked = unlockedFeatureMap[localShop.plan.toLowerCase()] ?? ALL_FEATURES;
      patch["features"] = {
        ...((localShop.features as Record<string, unknown> | null) ?? {}),
        ...unlocked,
      };

      await supabase.from("payment_history").insert({
        shop_id: shop.id,
        amount: amt,
        plan: localShop.plan,
        billing_cycle: cycle,
        payment_status: "paid",
        payment_date: now.toISOString(),
        due_date: exp.toISOString(),
      });

      try {
        const bizId = shopBusinessId(localShop);
        await supabase.from("payments").insert({
          business_name: localShop.name,
          owner_name: `${localShop.slug} (${bizId})`,
          plan_name: localShop.plan,
          amount: amt,
          mobile: localShop.phone || "-",
          email: `${localShop.slug}@mylinkqr.com`,
          business_address: localShop.niche || "Business",
          status: "Approved",
          screenshot_url: "",
          whatsapp: localShop.phone || "-",
          city: "Local",
          state: "State",
          category: localShop.niche || "General",
        });
      } catch (pErr) {
        console.warn("Payments insert non-fatal error:", pErr);
      }
    } else if (["unpaid", "pending"].includes(newStatus)) {
      patch.status = "suspended";
    }
    await updateShop(
      patch,
      "payment_status_changed",
      localShop.payment_status ?? "not_paid",
      newStatus,
      notes || undefined,
    );
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }

  async function changePlan(newPlan: string) {
    const cycle = localShop.billing_cycle ?? "monthly";
    const pObj =
      dynamicPlans.find((p) => p.id.toLowerCase() === newPlan.toLowerCase()) ||
      PLANS.find((p) => p.id.toLowerCase() === newPlan.toLowerCase());
    const amount = pObj
      ? (pObj.priceNumber ?? parsePriceNumber(pObj.price))
      : planAmount(newPlan, cycle);

    const ALL_FEATURES = {
      logo_cover: true,
      social_link: true,
      opening_hours: true,
      multi_language: true,
      ai: true,
      ordering: true,
      analytics: true,
      qr_downloads: true,
      on_table: true,
      take_away: true,
      delivery: true,
      themes: true,
      google_reviews: true,
      custom_domain: true,
      priority_support: true,
      coupons: true,
      upi: true,
    };

    const unlockedFeatureMap: Record<string, Record<string, boolean>> = {
      basic: { logo_cover: true, social_link: true, opening_hours: true, multi_language: true },
      pro: {
        logo_cover: true,
        social_link: true,
        opening_hours: true,
        multi_language: true,
        ai: true,
        ordering: true,
        analytics: true,
        qr_downloads: true,
        on_table: true,
        take_away: true,
      },
      premium: ALL_FEATURES,
    };

    const targetKey = newPlan.toLowerCase();
    const unlocked = unlockedFeatureMap[targetKey] ?? ALL_FEATURES;
    const currentFeatures = (localShop.features as Record<string, unknown> | null) ?? {};
    const updatedFeatures = { ...currentFeatures, ...unlocked };

    await updateShop(
      { plan: newPlan, amount_paid: amount, features: updatedFeatures },
      "plan_changed",
      localShop.plan,
      newPlan,
    );
  }

  async function changeBilling(newCycle: string) {
    await updateShop(
      { billing_cycle: newCycle, amount_paid: planAmount(localShop.plan, newCycle) },
      "billing_cycle_changed",
      localShop.billing_cycle ?? "monthly",
      newCycle,
    );
  }

  async function toggleStatus() {
    const newStatus = localShop.status === "active" ? "suspended" : "active";
    await updateShop({ status: newStatus }, "status_changed", localShop.status, newStatus);
  }

  async function cancelSubscription() {
    await updateShop(
      { status: "cancelled", payment_status: "not_paid" },
      "subscription_cancelled",
      localShop.status,
      "cancelled",
      notes || undefined,
    );
  }

  async function extendSubscription(days: number) {
    const base = localShop.plan_expires_at ? new Date(localShop.plan_expires_at) : new Date();
    const newExpiry = addDays(base, days);
    await updateShop(
      { plan_expires_at: newExpiry.toISOString(), next_billing_date: newExpiry.toISOString() },
      "subscription_extended",
      formatDate(localShop.plan_expires_at),
      formatDate(newExpiry.toISOString()),
      `Extended by ${days} days`,
    );
    setExtendOpen(false);
  }

  const modalTabs: { id: ModalTab; label: string; icon: typeof Store }[] = [
    { id: "info", label: "Info", icon: Store },
    { id: "customer", label: "Customer Login", icon: Key },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "payment", label: "Payment", icon: DollarSign },
    { id: "features", label: "Feature Access", icon: Shield },
    { id: "actions", label: "Actions", icon: Play },
    { id: "history", label: "History", icon: History },
  ];

  const ownerEmail = shop.phone ? `${shop.slug}@mylinkqr.com` : `${shop.slug}-owner@store.com`;
  const ownerPassword = `QR#${shop.slug.slice(0, 4)}@2026`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border-white/10 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between gap-2">
            <span>Manage — {shop.name}</span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 text-xs font-mono font-bold">
              ID: {shopBusinessId(shop)}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Modal Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-2">
          {modalTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setModalTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
                modalTab === t.id
                  ? "bg-emerald-500/15 text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5",
              )}
            >
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {/* ── INFO TAB ─── */}
          {modalTab === "info" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Shop Name</Label>
                  <Input
                    value={editInfo.name}
                    onChange={(e) => setEditInfo({ ...editInfo, name: e.target.value })}
                    className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Slug</Label>
                  <Input
                    value={editInfo.slug}
                    onChange={(e) => setEditInfo({ ...editInfo, slug: e.target.value })}
                    className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Niche</Label>
                  <select
                    value={editInfo.niche}
                    onChange={(e) => setEditInfo({ ...editInfo, niche: e.target.value })}
                    className="h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    {NICHES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <InfoField label="Business ID" value={shopBusinessId(shop)} />
                <InfoField label="Owner ID" value={shop.owner_id.slice(0, 8) + "…"} />
                <InfoField label="Created Date" value={formatDate(shop.created_at)} />
                <InfoField
                  label="Plan Started"
                  value={formatDate(shop.plan_started_at || shop.created_at)}
                />
                <InfoField label="Plan Expires" value={formatDate(shop.plan_expires_at)} />
                <InfoField label="Account Status" value={shop.status} />
                <InfoField label="Subscription State" value={subscriptionStateLabel(subState)} />
                <InfoField label="Shop ID" value={shop.id.slice(0, 8) + "…"} />
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-slate-400 text-xs">Google Review Link</Label>
                  {shopGoogleReviewLink(shop) ? (
                    <a
                      href={shopGoogleReviewLink(shop)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-amber-400 hover:underline break-all"
                    >
                      <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      {shopGoogleReviewLink(shop)}
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Not set — owner can add this in Shop Settings.
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={saveInfo}
                disabled={busy}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 w-full sm:w-auto font-semibold"
              >
                Save Changes
              </Button>
            </div>
          )}

          {/* ── CUSTOMER LOGIN TAB ─── */}
          {modalTab === "customer" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2 text-sm">
                      <UserCheck className="size-4 text-emerald-400" /> Customer & Account Info
                    </h4>
                    <p className="text-xs text-slate-400">
                      Owner registration details and login identity.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">
                    Verified Owner
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoField label="Shop Name" value={shop.name} />
                  <InfoField
                    label="Owner User ID"
                    value={
                      <span className="font-mono text-xs text-emerald-300">{shop.owner_id}</span>
                    }
                  />
                  <InfoField
                    label="Primary Phone"
                    value={shop.phone || shop.whatsapp || "Not set"}
                  />
                  <InfoField label="WhatsApp Contact" value={shop.whatsapp || "Not set"} />
                  <InfoField label="Created Date" value={formatDate(shop.created_at)} />
                  <InfoField label="Platform Role" value="Shop Owner" />
                </div>
              </div>

              {/* Login Password & Auth Details */}
              <div className="rounded-xl border border-white/10 bg-slate-950 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white flex items-center gap-2 text-sm">
                    <Lock className="size-4 text-amber-400" /> Customer Login Credentials
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Visible to Super Admin
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Customer Login Email</Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={ownerEmail}
                        className="h-9 border-white/10 bg-slate-900 font-mono text-xs text-emerald-300"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
                        onClick={() => {
                          navigator.clipboard.writeText(ownerEmail);
                          toast.success("Login email copied to clipboard!");
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Customer Account Password</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        readOnly
                        value={ownerPassword}
                        className="h-9 border-white/10 bg-slate-900 font-mono text-xs text-amber-300"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent text-slate-200 hover:bg-white/10"
                        onClick={() => {
                          navigator.clipboard.writeText(ownerPassword);
                          toast.success("Password copied to clipboard!");
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const { data: signUpData, error } = await supabase.auth.signUp({
                          email: ownerEmail,
                          password: ownerPassword,
                          options: {
                            data: {
                              full_name: shop.name,
                              business_name: shop.name,
                            },
                          },
                        });
                        if (signUpData?.user) {
                          await supabase
                            .from("shops")
                            .update({ owner_id: signUpData.user.id })
                            .eq("id", shop.id);
                        }
                        toast.success(`Login credentials for ${ownerEmail} are now active!`);
                      } catch (err: any) {
                        toast.error(err.message || "Failed to activate account");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-400" /> Activate & Sync
                    Login Account
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs"
                    onClick={() => {
                      toast.success(`Password reset trigger sent for ${ownerEmail}`);
                    }}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" /> Send Password Reset Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs"
                    onClick={() => {
                      const fullDetails = `MY LINK QR CUSTOMER LOGIN
Shop Name: ${shop.name}
Public URL: ${window.location.origin}/shop/${shop.slug}
Login Email: ${ownerEmail}
Password: ${ownerPassword}
Dashboard: ${window.location.origin}/auth`;
                      navigator.clipboard.writeText(fullDetails);
                      toast.success("Full login details copied!");
                    }}
                  >
                    <Copy className="mr-1.5 size-3.5" /> Copy Full Login Info
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURE ACCESS TAB ─── */}
          {modalTab === "features" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <div>
                    <h4 className="font-medium text-white flex items-center gap-2 text-sm">
                      <Shield className="size-4 text-emerald-400" /> Feature Access Overrides
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toggle features on/off for this shop, overriding the plan defaults.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-xs font-semibold capitalize">
                    {shop.plan} plan
                  </span>
                </div>

                <div className="space-y-2">
                  {FEATURE_KEYS.map((key) => {
                    const planDefault = planOf(shop.plan)[key];
                    const currentOverride = shop.features?.[key];
                    const effectiveValue =
                      typeof currentOverride === "boolean" ? currentOverride : planDefault;

                    async function toggleFeature(val: boolean) {
                      setBusy(true);
                      const updatedFeatures = {
                        ...(shop.features ?? {}),
                        [key]: val,
                      };
                      const { error } = await supabase
                        .from("shops")
                        .update({ features: updatedFeatures })
                        .eq("id", shop.id);
                      if (error) {
                        toast.error(error.message);
                      } else {
                        await logAction(
                          "feature_override",
                          `${key}: ${effectiveValue}`,
                          `${key}: ${val}`,
                        );
                        toast.success(`${FEATURE_LABELS[key]} ${val ? "enabled" : "disabled"}`);
                        qc.invalidateQueries({ queryKey: ["admin-shops"] });
                        qc.invalidateQueries({ queryKey: ["my-shop"] });
                        onRefresh();
                      }
                      setBusy(false);
                    }

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/60 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{FEATURE_LABELS[key]}</p>
                          <p
                            className={`text-[11px] mt-0.5 ${
                              typeof currentOverride === "boolean"
                                ? currentOverride
                                  ? "text-emerald-400"
                                  : "text-red-400"
                                : "text-slate-500"
                            }`}
                          >
                            {typeof currentOverride === "boolean"
                              ? `Admin override: ${currentOverride ? "enabled" : "disabled"}`
                              : `Plan default: ${planDefault ? "enabled" : "disabled"}`}
                          </p>
                        </div>
                        <Switch
                          checked={effectiveValue}
                          onCheckedChange={toggleFeature}
                          disabled={busy}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/10 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-slate-500/40 text-slate-400 hover:bg-slate-500/10 text-xs"
                    onClick={async () => {
                      setBusy(true);
                      const cleanedFeatures = { ...(shop.features ?? {}) };
                      FEATURE_KEYS.forEach((k) => delete cleanedFeatures[k]);
                      const { error } = await supabase
                        .from("shops")
                        .update({ features: cleanedFeatures })
                        .eq("id", shop.id);
                      if (error) {
                        toast.error(error.message);
                      } else {
                        toast.success("All feature overrides reset to plan defaults");
                        qc.invalidateQueries({ queryKey: ["admin-shops"] });
                        qc.invalidateQueries({ queryKey: ["my-shop"] });
                        onRefresh();
                      }
                      setBusy(false);
                    }}
                  >
                    <RefreshCw className="size-3 mr-1.5" /> Reset All to Plan Defaults
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTION TAB ─── */}
          {modalTab === "subscription" && (
            <div className="space-y-4">
              {/* Plan & Billing Cycle */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Current Plan</Label>
                  <select
                    value={localShop.plan}
                    onChange={(e) => changePlan(e.target.value)}
                    disabled={busy}
                    className="h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    {dynamicPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Payment Status</Label>
                  <select
                    value={billingForm.payStatus}
                    onChange={(e) => setBillingForm({ ...billingForm, payStatus: e.target.value })}
                    disabled={busy}
                    className="h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={billingForm.startDate}
                    onChange={(e) => setBillingForm({ ...billingForm, startDate: e.target.value })}
                    disabled={busy}
                    className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={billingForm.endDate}
                    onChange={(e) => setBillingForm({ ...billingForm, endDate: e.target.value })}
                    disabled={busy}
                    className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              {/* Quick-set months */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  className="border-white/10 text-slate-300 hover:bg-white/10 text-xs"
                  onClick={() => {
                    const base = billingForm.startDate
                      ? new Date(billingForm.startDate)
                      : new Date();
                    const end = addMonths(base, billingForm.quickMonths);
                    setBillingForm({
                      ...billingForm,
                      endDate: toDateInput(end.toISOString()),
                    });
                  }}
                >
                  <CalendarPlus className="size-3.5 mr-1" />
                  Set {billingForm.quickMonths} month{billingForm.quickMonths !== 1 ? "s" : ""}
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={billingForm.quickMonths}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      quickMonths: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  disabled={busy}
                  className="w-20 h-9 border-white/10 bg-slate-800 text-white text-center text-sm"
                />
                <Button
                  size="sm"
                  disabled={busy}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold text-xs"
                  onClick={async () => {
                    setBusy(true);
                    const startIso = billingForm.startDate
                      ? new Date(billingForm.startDate).toISOString()
                      : null;
                    const endIso = billingForm.endDate
                      ? new Date(billingForm.endDate).toISOString()
                      : null;

                    const patch: any = {
                      payment_status: billingForm.payStatus,
                      plan_started_at: startIso,
                      plan_expires_at: endIso,
                      next_billing_date: endIso,
                    };
                    if (billingForm.payStatus === "paid") {
                      patch.status = "active";
                      patch.amount_paid = planAmount(
                        localShop.plan,
                        localShop.billing_cycle ?? "monthly",
                      );
                    } else if (["unpaid", "pending"].includes(billingForm.payStatus)) {
                      patch.status = "suspended";
                    }
                    const { error } = await supabase
                      .from("shops")
                      .update(patch)
                      .eq("id", localShop.id);
                    if (error) {
                      toast.error(error.message);
                    } else {
                      await logAction(
                        "billing_updated",
                        `${localShop.payment_status} / ${formatDate(localShop.plan_expires_at)}`,
                        `${billingForm.payStatus} / ${billingForm.endDate || "—"}`,
                      );
                      toast.success("Billing saved");
                      qc.invalidateQueries({ queryKey: ["admin-shops"] });
                      qc.invalidateQueries({ queryKey: ["my-shop"] });
                      // Update local state so UI reflects changes without closing
                      setLocalShop({ ...localShop, ...patch });
                    }
                    setBusy(false);
                  }}
                >
                  Save Billing
                </Button>
              </div>

              <p className="text-[11px] text-slate-500">
                An expired shop is automatically suspended and no longer appears publicly.
              </p>

              {/* Summary footer */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-slate-400">
                <span
                  className={
                    localShop.payment_status === "paid" ? "text-emerald-400" : "text-red-400"
                  }
                >
                  {localShop.payment_status === "unpaid" || !localShop.payment_status
                    ? "unpaid"
                    : (PAYMENT_STATUSES.find((s) => s.value === localShop.payment_status)?.label ??
                      localShop.payment_status)}
                </span>
                <span>₹{localShop.amount_paid ?? 0} recorded</span>
                <span
                  className={`flex items-center gap-1 ${
                    subscriptionState(localShop) === "active" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {subscriptionState(localShop) === "active" ? "✓" : "✗"} Public access
                  {subscriptionState(localShop) === "active" ? " available" : " unavailable"}
                </span>
              </div>

              {/* Remaining read-only info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoField label="Billing Cycle" value={shop.billing_cycle ?? "monthly"} />
                <InfoField label="Next Billing" value={formatDate(shop.next_billing_date)} />
                <InfoField
                  label="Days Remaining"
                  value={
                    daysRemaining(shop) === Infinity
                      ? "No expiry set"
                      : `${daysRemaining(shop)} days`
                  }
                />
                <InfoField label="Grace Period" value={`${shop.grace_period_days ?? 7} days`} />
                <InfoField label="Auto Renew" value={shop.auto_renew !== false ? "Yes" : "No"} />
                <InfoField
                  label="Subscription State"
                  value={subscriptionStateLabel(subscriptionState(shop))}
                />
              </div>

              {/* Renewal & Grace Settings */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Renewal &amp; Grace Settings
                </h4>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Auto Renew</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automatically renew subscription on expiry
                    </p>
                  </div>
                  <Switch
                    checked={renewalForm.autoRenew}
                    disabled={busy}
                    className="data-[state=checked]:bg-emerald-500"
                    onCheckedChange={(val) => setRenewalForm({ ...renewalForm, autoRenew: val })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/60 px-4 py-3 gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Grace Period (days)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Days the shop stays active after expiry before suspension
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={renewalForm.gracePeriod}
                    onChange={(e) =>
                      setRenewalForm({
                        ...renewalForm,
                        gracePeriod: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    disabled={busy}
                    className="w-20 h-9 border-white/10 bg-slate-800 text-white text-center text-sm"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold text-xs"
                    onClick={async () => {
                      if (renewalForm.autoRenew !== localShop.auto_renew) {
                        await updateShop(
                          { auto_renew: renewalForm.autoRenew },
                          "auto_renew_changed",
                          String(localShop.auto_renew !== false),
                          String(renewalForm.autoRenew),
                        );
                      }
                      if (renewalForm.gracePeriod !== (localShop.grace_period_days ?? 7)) {
                        await updateShop(
                          { grace_period_days: renewalForm.gracePeriod },
                          "grace_period_changed",
                          String(localShop.grace_period_days ?? 7),
                          String(renewalForm.gracePeriod),
                        );
                      }
                      toast.success("Settings saved");
                    }}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── PAYMENT TAB ─── */}
          {modalTab === "payment" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoField
                  label="Payment Status"
                  value={<PaymentBadge status={shop.payment_status ?? "not_paid"} />}
                />
                <InfoField
                  label="Amount"
                  value={money(
                    Number(
                      shop.amount_paid ?? planAmount(shop.plan, shop.billing_cycle ?? "monthly"),
                    ),
                  )}
                />
                <InfoField label="Plan" value={shop.plan} />
                <InfoField label="Billing Cycle" value={shop.billing_cycle ?? "monthly"} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Admin Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for this action…"
                  className="border-white/10 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Payment History */}
              <div className="mt-6">
                <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
                  Payment History
                </h3>
                {(payHistory ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No payment records yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(payHistory ?? []).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-white">{p.invoice_id}</span>
                          <span className="ml-2 text-slate-400">{money(Number(p.amount))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentBadge status={p.payment_status} />
                          <span className="text-slate-500">{formatDate(p.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIONS TAB ─── */}
          {modalTab === "actions" && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Payment Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  icon={CheckCircle2}
                  label="Mark as Paid"
                  color="emerald"
                  onClick={() => markPayment("paid")}
                  disabled={busy}
                />
                <ActionBtn
                  icon={Clock}
                  label="Mark as Pending"
                  color="yellow"
                  onClick={() => markPayment("pending")}
                  disabled={busy}
                />
              </div>

              <h3 className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                Subscription Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  icon={CalendarPlus}
                  label="Extend Subscription"
                  color="blue"
                  onClick={() => setExtendOpen(true)}
                  disabled={busy}
                />
                <ActionBtn
                  icon={localShop.status === "active" ? Pause : Play}
                  label={
                    localShop.status === "active"
                      ? "Suspend Shop"
                      : localShop.status === "pending"
                        ? "Approve Shop"
                        : "Activate Shop"
                  }
                  color={localShop.status === "active" ? "orange" : "emerald"}
                  onClick={toggleStatus}
                  disabled={busy}
                />
                <ActionBtn
                  icon={XCircle}
                  label="Cancel Subscription"
                  color="red"
                  onClick={cancelSubscription}
                  disabled={busy}
                />
                <ActionBtn
                  icon={RotateCcw}
                  label="Reset Analytics"
                  color="orange"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await supabase.from("analytics_events").delete().eq("shop_id", shop.id);
                      await logAction(
                        "analytics_reset",
                        "active_events",
                        "cleared",
                        "Analytics reset via Manage modal",
                      );
                      toast.success(`Analytics reset for "${shop.name}".`);
                      onRefresh();
                    } catch (err: any) {
                      toast.error(err instanceof Error ? err.message : "Failed to reset analytics");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-xs font-medium uppercase tracking-wider text-red-400 mb-2">
                  Danger Zone
                </h3>
                <ActionBtn
                  icon={Trash2}
                  label="Delete Shop Permanently"
                  color="red"
                  onClick={() => {
                    onClose();
                    onDeleteClick(shop);
                  }}
                  disabled={busy}
                />
              </div>

              <div className="mt-4 space-y-1.5">
                <Label className="text-slate-400 text-xs">Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for this action…"
                  className="border-white/10 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ─── */}
          {modalTab === "history" && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Activity Timeline
              </h3>
              {(subHistory ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No activity yet.</p>
              ) : (
                <div className="relative space-y-0 max-h-80 overflow-y-auto pl-4">
                  {(subHistory ?? []).map((h, idx) => (
                    <div key={h.id} className="relative pb-4">
                      {idx < (subHistory?.length ?? 0) - 1 && (
                        <span className="absolute left-[-12px] top-3 h-full w-px bg-white/10" />
                      )}
                      <span className="absolute left-[-16px] top-1 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                      <p className="text-xs text-slate-500">{formatDate(h.created_at)}</p>
                      <p className="mt-0.5 text-sm text-white">
                        {h.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                      {h.previous_value && h.new_value && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {h.previous_value} → {h.new_value}
                        </p>
                      )}
                      {h.notes && (
                        <p className="mt-0.5 text-xs text-slate-500 italic">"{h.notes}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* ── Extend Subscription Dialog ─── */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="bg-slate-900 text-slate-100 border-white/10 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Extend Subscription</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Extend {shop.name}'s subscription from {formatDate(shop.plan_expires_at)}.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: "+7 days", days: 7 },
              { label: "+15 days", days: 15 },
              { label: "+30 days", days: 30 },
              { label: "+3 months", days: 90 },
              { label: "+6 months", days: 180 },
              { label: "+1 year", days: 365 },
            ].map((opt) => (
              <Button
                key={opt.days}
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => extendSubscription(opt.days)}
                disabled={busy}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: typeof Play;
  label: string;
  color: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10",
    yellow: "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10",
    red: "border-red-500/30 text-red-400 hover:bg-red-500/10",
    blue: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10",
    orange: "border-orange-500/30 text-orange-400 hover:bg-orange-500/10",
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("bg-transparent", colors[color])}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="mr-1.5 size-3.5" /> {label}
    </Button>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white capitalize">{value}</p>
    </div>
  );
}

// ─── Staff Table ────────────────────────────────────────────────
function StaffTable({
  staff,
}: {
  staff: ReturnType<typeof useAllStaff>["data"] extends infer T ? NonNullable<T> : never;
}) {
  const qc = useQueryClient();

  async function setStaffStatus(id: string, status: string) {
    const { error } = await supabase.from("staff").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["all-staff"] });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-sm text-slate-200">
        <thead className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Shop</th>
            <th className="p-3">Role</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((m) => (
            <tr key={m.id} className="border-b border-white/5 last:border-0">
              <td className="p-3 font-medium text-white">{m.name}</td>
              <td className="p-3">{m.shops?.name ?? "—"}</td>
              <td className="p-3">{m.role}</td>
              <td className="p-3 text-slate-400">{m.phone ?? m.email ?? "—"}</td>
              <td className="p-3">{m.status}</td>
              <td className="p-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() =>
                    setStaffStatus(m.id, m.status === "active" ? "inactive" : "active")
                  }
                >
                  {m.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td className="p-4 text-slate-400" colSpan={6}>
                No staff added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Admin Frame ────────────────────────────────────────────────
function AdminFrame({
  tab,
  setTab,
  onSignOut,
  children,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "shops", label: "Shops", icon: Building2 },
    { id: "staff", label: "Staff", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "reviews", label: "Reviews", icon: Star },
  ];
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-slate-950">
              <Shield className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">
                MY Link QR Admin Console
              </p>
              <p className="text-xs text-slate-400">Platform control centre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/dashboard">My dashboard</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:bg-white/10"
              onClick={onSignOut}
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-5 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white",
                tab === t.id && "bg-emerald-500/15 text-emerald-400",
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main>
    </div>
  );
}

function AdminStat({
  label,
  value,
  prefix,
  color,
}: {
  label: string;
  value: number;
  prefix?: string;
  color?: string;
}) {
  const textColors: Record<string, string> = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-semibold text-white",
          color && textColors[color],
        )}
      >
        {prefix}
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Payment Management Table & Custom Plans Setting ──────────────────────────
function PaymentManagement({ isAdmin }: { isAdmin?: boolean | undefined }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "plans">("plans");
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Dynamic Custom Plans hook
  const { data: plansData = PLANS } = useCustomPlans();
  const [localPlans, setLocalPlans] = useState<PlanItem[]>([]);
  const [isSavingPlans, setIsSavingPlans] = useState(false);

  // Add Custom Plan Dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanTagline, setNewPlanTagline] = useState("");

  // Payment Settings
  const { data: paymentSettings } = usePaymentSettings();
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (paymentSettings) {
      setRazorpayEnabled(paymentSettings.razorpay_enabled);
      setUpiId(paymentSettings.upi_id);
    }
  }, [paymentSettings]);

  async function handleToggleRazorpay(newValue: boolean) {
    setRazorpayEnabled(newValue);
    setIsSavingSettings(true);
    try {
      const { data: settingsShop } = await supabase
        .from("shops")
        .select("id, features")
        .eq("slug", "platform-settings-internal")
        .maybeSingle();

      const newSettings = { razorpay_enabled: newValue, upi_id: upiId };
      const newFeatures = settingsShop
        ? { ...(settingsShop.features as any), payment_settings: newSettings }
        : { payment_settings: newSettings };

      if (!settingsShop) {
        const { error } = await supabase.from("shops").insert({
          name: "Platform Settings",
          slug: "platform-settings-internal",
          niche: "System",
          features: newFeatures,
          status: "active",
          owner_id: user?.id ?? "",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shops")
          .update({ features: newFeatures })
          .eq("id", settingsShop.id);
        if (error) throw error;
      }

      toast.success(newValue ? "Razorpay Gateway Enabled!" : "Manual UPI Payment Enabled!");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err: any) {
      setRazorpayEnabled(!newValue); // Revert on failure
      toast.error(err.message || "Failed to update payment settings");
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSavePaymentSettings() {
    setIsSavingSettings(true);
    try {
      const { data: settingsShop } = await supabase
        .from("shops")
        .select("id, features")
        .eq("slug", "platform-settings-internal")
        .maybeSingle();

      const newSettings = { razorpay_enabled: razorpayEnabled, upi_id: upiId };
      const newFeatures = settingsShop
        ? { ...(settingsShop.features as any), payment_settings: newSettings }
        : { payment_settings: newSettings };

      if (!settingsShop) {
        const { error } = await supabase.from("shops").insert({
          name: "Platform Settings",
          slug: "platform-settings-internal",
          niche: "System",
          features: newFeatures,
          status: "active",
          owner_id: user?.id ?? "",
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("shops")
          .update({ features: newFeatures })
          .eq("id", settingsShop.id);
        if (error) throw error;
      }

      toast.success("Payment Gateway settings updated globally!");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update payment settings");
    } finally {
      setIsSavingSettings(false);
    }
  }

  useEffect(() => {
    if (plansData && plansData.length > 0) {
      setLocalPlans(plansData);
    }
  }, [plansData]);

  const {
    data: payments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-payments"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const allLogItems: any[] = [];

      // 1. Fetch from payments table
      try {
        const { data: manualPayments } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });
        if (manualPayments && manualPayments.length > 0) {
          allLogItems.push(...manualPayments);
        }
      } catch (e) {
        console.warn("Payments table fetch error:", e);
      }

      // 2. Fetch from payment_history table with shops info
      try {
        const { data: historyLogs } = await supabase
          .from("payment_history")
          .select("*, shops(name, slug, niche)")
          .order("created_at", { ascending: false });

        if (historyLogs && historyLogs.length > 0) {
          historyLogs.forEach((ph: any) => {
            // Avoid duplicate if transaction ID matches

            if (
              !allLogItems.some(
                (m: any) =>
                  m.id === ph.id || (ph.transaction_id && m.transaction_id === ph.transaction_id),
              )
            ) {
              const shopInfo = ph.shops;
              allLogItems.push({
                id: ph.id,
                business_name: shopInfo?.name || "Shop #" + ph.shop_id.slice(0, 6),
                owner_name: shopInfo?.slug || "Shop Owner",
                plan_name: ph.plan,
                amount: ph.amount,
                mobile: "-",
                email: shopInfo?.slug ? `${shopInfo.slug}@mylinkqr.com` : "Registered Owner",
                business_address: shopInfo?.niche || "Restaurant",
                created_at: ph.payment_date || ph.created_at,
                screenshot_url: null,
                status: ph.payment_status === "paid" ? "Approved" : ph.payment_status,
                transaction_id: ph.transaction_id,
              });
            }
          });
        }
      } catch (e) {
        console.warn("Payment history fetch error:", e);
      }

      // 3. Fallback: Include all shops with payment_status = 'paid' or non-trial plans
      try {
        const { data: paidShops } = await supabase
          .from("shops")
          .select("*")
          .eq("payment_status", "paid")
          .order("updated_at", { ascending: false });

        if (paidShops && paidShops.length > 0) {
          paidShops.forEach((s: any) => {
            const shopIdStr = s.id;

            const exists = allLogItems.some(
              (m: any) => m.business_name === s.name || (m.id && m.id.includes(shopIdStr)),
            );
            if (!exists) {
              const amt =
                s.amount_paid && Number(s.amount_paid) > 0
                  ? Number(s.amount_paid)
                  : planAmount(s.plan, "monthly", plansData);
              allLogItems.push({
                id: "shop-pay-" + s.id,
                business_name: s.name,
                owner_name: s.slug || "Owner",
                plan_name: s.plan,
                amount: amt,
                mobile: "-",
                email: (s.slug || "shop") + "@mylinkqr.com",
                business_address: s.niche || "Business",
                created_at: s.plan_started_at || s.updated_at || s.created_at,
                screenshot_url: null,
                status: "Approved",
                transaction_id: "SHOP-" + s.id.slice(0, 8),
              });
            }
          });
        }
      } catch (e) {
        console.warn("Paid shops fallback error:", e);
      }

      return allLogItems;
    },
  });

  async function handleSavePlans(updatedList: PlanItem[]) {
    setIsSavingPlans(true);
    try {
      await savePlatformPlans(updatedList, user?.id);
      toast.success("Platform subscription plans & ₹ prices updated and synced real-time!");
      qc.invalidateQueries({ queryKey: ["custom-plans"] });
      qc.invalidateQueries({ queryKey: ["admin-shops"] });
      qc.invalidateQueries({ queryKey: ["my-shop"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save plan prices.");
    } finally {
      setIsSavingPlans(false);
    }
  }

  function updateLocalPlanPrice(planId: string, newPriceStr: string) {
    const num = parseInt(newPriceStr.replace(/[^0-9]/g, ""), 10) || 0;
    const updated = localPlans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          priceNumber: num,
          price: num === 0 ? "Free" : `₹${num}/mo`,
        };
      }
      return p;
    });
    setLocalPlans(updated);
  }

  function updateLocalPlanTagline(planId: string, tagline: string) {
    const updated = localPlans.map((p) => (p.id === planId ? { ...p, tagline } : p));
    setLocalPlans(updated);
  }

  function handleDeleteCustomPlan(planId: string) {
    const updated = localPlans.filter((p) => p.id !== planId);
    setLocalPlans(updated);
    handleSavePlans(updated);
  }

  function handleCreateCustomPlan() {
    if (!newPlanName.trim()) {
      toast.error("Please enter a plan name.");
      return;
    }
    const priceNum = parseInt(newPlanPrice.replace(/[^0-9]/g, ""), 10) || 0;
    const id = newPlanName.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const createdPlan: PlanItem = {
      id,
      name: newPlanName.trim(),
      price: priceNum === 0 ? "Free" : `₹${priceNum}/mo`,
      priceNumber: priceNum,
      tagline: newPlanTagline.trim() || "Custom business subscription plan",
      features: [
        "Digital QR menu page",
        "WhatsApp ordering & cart",
        "Full analytics dashboard",
        "AI menu generator",
        "PNG / SVG / PDF QR downloads",
      ],
      isCustom: true,
    };

    const updated = [...localPlans, createdPlan];
    setLocalPlans(updated);
    handleSavePlans(updated);
    setShowAddModal(false);
    setNewPlanName("");
    setNewPlanPrice("");
    setNewPlanTagline("");
  }

  async function updatePaymentStatus(payment: any, status: string) {
    const { error } = await supabase.from("payments").update({ status }).eq("id", payment.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment set to ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-payments"] });

    if (status === "Approved") {
      const now = new Date();
      const exp = addMonths(now, 1);
      const planLower = (payment.plan_name || "basic").toLowerCase();

      // Find matching shop by business name or mobile number
      const { data: matchedShops } = await supabase
        .from("shops")
        .select("*")
        .or(`name.ilike.${payment.business_name},whatsapp.eq.${payment.mobile}`);

      if (matchedShops && matchedShops.length > 0) {
        for (const targetShop of matchedShops) {
          await supabase
            .from("shops")
            .update({
              payment_status: "paid",
              status: "active",
              plan: planLower,
              amount_paid: Number(payment.amount),
              plan_expires_at: exp.toISOString(),
              next_billing_date: exp.toISOString(),
            })
            .eq("id", targetShop.id);

          await supabase.from("payment_history").insert({
            shop_id: targetShop.id,
            amount: Number(payment.amount),
            plan: planLower,
            billing_cycle: "monthly",
            payment_status: "paid",
            payment_date: now.toISOString(),
            due_date: exp.toISOString(),
          });
        }
        qc.invalidateQueries({ queryKey: ["admin-shops"] });
        qc.invalidateQueries({ queryKey: ["my-shop"] });
        toast.success(`Active subscription enabled for ${payment.business_name}!`);
      }
    } else if (status === "Rejected") {
      const { data: matchedShops } = await supabase
        .from("shops")
        .select("*")
        .or(`name.ilike.${payment.business_name},whatsapp.eq.${payment.mobile}`);

      if (matchedShops && matchedShops.length > 0) {
        for (const targetShop of matchedShops) {
          await supabase
            .from("shops")
            .update({
              payment_status: "unpaid",
              status: "suspended",
            })
            .eq("id", targetShop.id);
        }
        qc.invalidateQueries({ queryKey: ["admin-shops"] });
        qc.invalidateQueries({ queryKey: ["my-shop"] });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Sub Header / Sub Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab("plans")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer",
              activeSubTab === "plans"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <CreditCard className="size-4" /> Subscription Plans & Price Settings (₹)
          </button>
          <button
            onClick={() => setActiveSubTab("logs")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer",
              activeSubTab === "logs"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <DollarSign className="size-4" /> Razorpay & Manual Payment Logs ({payments.length})
          </button>
        </div>

        {activeSubTab === "plans" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md"
            >
              + Add Custom Plan
            </Button>
            <Button
              size="sm"
              disabled={isSavingPlans}
              onClick={() => handleSavePlans(localPlans)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md"
            >
              {isSavingPlans ? "Saving..." : "Save All Prices & Real-Time Sync"}
            </Button>
          </div>
        )}
      </div>

      {/* ── 1. CUSTOM PLANS & RUPEES (₹) SETTINGS TAB ── */}
      {activeSubTab === "plans" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
            <h3 className="font-display text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
              <RotateCcw className="size-5 text-amber-400" /> Platform Plans & Rupee (₹) Price
              Management
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Set custom plan prices in Rupees (₹), edit plan details, or add new subscription
              tiers. Updates automatically synchronize in real-time across the{" "}
              <strong>User Dashboard</strong>, <strong>Website Pricing Page</strong>, and{" "}
              <strong>Razorpay Payment Gateway</strong>.
            </p>
          </div>

          {/* Payment Gateway Toggle */}
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard className="size-4 text-emerald-400" /> Gateway & Manual Payment Settings
            </h4>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between max-w-sm">
                  <div>
                    <Label className="text-sm text-white">Enable Razorpay Integration</Label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Toggle live Razorpay checkout. When OFF, users will see manual UPI payment
                      instructions.
                    </p>
                  </div>
                  <Switch
                    checked={razorpayEnabled}
                    onCheckedChange={handleToggleRazorpay}
                    disabled={isSavingSettings}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="max-w-sm space-y-1.5">
                  <Label className="text-xs text-slate-400">
                    Manual UPI ID (Used when Razorpay is OFF)
                  </Label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    disabled={isSavingSettings}
                    placeholder="e.g. 9392318135-2@axl"
                    className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleSavePaymentSettings}
                disabled={isSavingSettings}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              >
                {isSavingSettings ? "Saving..." : "Save Gateway Settings"}
              </Button>
            </div>
          </div>

          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {localPlans.map((p) => {
              const currentPriceNum = p.priceNumber ?? parsePriceNumber(p.price);

              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative rounded-2xl border p-5 bg-slate-900/90 shadow-xl flex flex-col justify-between transition-all",
                    p.highlight
                      ? "border-amber-500/60 ring-1 ring-amber-500/30"
                      : p.isCustom
                        ? "border-emerald-500/50"
                        : "border-white/10",
                  )}
                >
                  {p.highlight && (
                    <span className="absolute -top-2.5 right-4 bg-amber-500 text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  {p.isCustom && (
                    <span className="absolute -top-2.5 right-4 bg-emerald-500 text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Custom Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <h4 className="font-display text-lg font-bold text-white">{p.name}</h4>
                      <span className="text-xs text-slate-400 uppercase font-mono">{p.id}</span>
                    </div>

                    {/* Price Input in Rupees */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs font-semibold">
                        Plan Price in Rupees (₹ / month)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-amber-400 font-bold text-sm">
                          ₹
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={currentPriceNum}
                          onChange={(e) => updateLocalPlanPrice(p.id, e.target.value)}
                          className="h-10 pl-7 font-bold text-amber-300 bg-slate-950 border-white/15 text-sm"
                          placeholder="249"
                        />
                      </div>
                    </div>

                    {/* Tagline Input */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs font-semibold">Tagline</Label>
                      <Input
                        value={p.tagline}
                        onChange={(e) => updateLocalPlanTagline(p.id, e.target.value)}
                        className="h-8 text-xs bg-slate-950 border-white/10 text-slate-200"
                        placeholder="Plan description tagline"
                      />
                    </div>

                    {/* Features list */}
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs font-semibold">
                        Features Included
                      </Label>
                      <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {p.features.map((f, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-1.5 text-xs text-slate-300"
                          >
                            <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      disabled={isSavingPlans}
                      onClick={() => handleSavePlans(localPlans)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex-1 h-8"
                    >
                      Save ₹{currentPriceNum}
                    </Button>

                    {p.isCustom && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCustomPlan(p.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 px-2.5 text-xs"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. PAYMENTS LOG TAB ── */}
      {activeSubTab === "logs" && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
              <Loader2 className="mx-auto size-6 animate-spin text-emerald-400 mb-2" />
              Loading platform payments...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
              <AlertTriangle className="mx-auto size-6 text-red-400 mb-2" />
              Failed to load payments: {(error as Error).message}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
              <table className="w-full text-sm text-slate-200">
                <thead className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Business & Owner</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Contact Info</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Proof</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {}
                  {(payments ?? []).map((p: any) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="p-3">
                        <p className="font-bold text-white">{p.business_name}</p>
                        <p className="text-xs text-slate-400">{p.owner_name}</p>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-300">
                          {p.plan_name}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">₹{p.amount}</td>
                      <td className="p-3 text-xs text-slate-400">
                        <p className="text-slate-300 font-mono">{p.mobile}</p>
                        <p className="text-slate-400">{p.email}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-400 max-w-[150px] truncate">
                        {p.business_address || "N/A"}
                      </td>
                      <td className="p-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {p.screenshot_url ? (
                          <button
                            onClick={() => setSelectedProof(p.screenshot_url)}
                            className="text-emerald-400 hover:underline text-xs flex items-center font-medium cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View Proof
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Razorpay / UPI</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            p.status === "Approved"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : p.status === "Pending"
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-red-500/15 text-red-400",
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "Pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10 h-7 text-xs px-2.5 font-semibold"
                                onClick={() => updatePaymentStatus(p, "Approved")}
                              >
                                <CheckCircle2 className="size-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/20 bg-red-500/10 h-7 text-xs px-2.5 font-semibold"
                                onClick={() => updatePaymentStatus(p, "Rejected")}
                              >
                                <XCircle className="size-3 mr-1" /> Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(payments ?? []).length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-slate-400 font-medium" colSpan={9}>
                        No payment logs recorded yet. Automated Razorpay orders, direct activations,
                        and paid shop records will display here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD CUSTOM PLAN DIALOG ── */}
      {showAddModal && (
        <Dialog open onOpenChange={() => setShowAddModal(false)}>
          <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
                <CreditCard className="size-5 text-amber-400" /> Create Custom Subscription Plan
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs font-semibold">Plan Name</Label>
                <Input
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. VIP Business, Gold Tier"
                  className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs font-semibold">
                  Price in Rupees (₹ / month)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-amber-400 font-bold text-sm">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    placeholder="999"
                    className="h-9 pl-7 font-bold text-amber-300 bg-slate-800 border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs font-semibold">Tagline</Label>
                <Input
                  value={newPlanTagline}
                  onChange={(e) => setNewPlanTagline(e.target.value)}
                  placeholder="e.g. Complete VIP solution with 24/7 dedicated support"
                  className="h-9 border-white/10 bg-slate-800 text-sm text-white"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomPlan}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
              >
                Create Custom Plan & Sync Real-Time
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Proof Dialog */}
      {selectedProof && (
        <Dialog open onOpenChange={() => setSelectedProof(null)}>
          <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-base font-bold">
                Payment Proof Screenshot
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-2">
              <img
                src={selectedProof}
                alt="Payment Proof"
                className="max-h-96 rounded-xl object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// --- Reviews Panel ----------------------------------------------
function ReviewsPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: reviews = [], isLoading } = useAllReviews(isAdmin);
  const stats = useReviewStats(reviews);
  const [filterRating, setFilterRating] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterShop, setFilterShop] = useState<string>("");

  const filtered = reviews.filter((r) => {
    if (filterRating && r.rating !== Number(filterRating)) return false;
    if (filterType && r.review_type !== filterType) return false;
    if (filterShop && !r.shop_name?.toLowerCase().includes(filterShop.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
        <Loader2 className="mx-auto size-6 animate-spin text-emerald-400 mb-2" />
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Total Reviews</p>
          <p className="mt-2 font-display text-3xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Average Rating</p>
          <p className="mt-2 font-display text-3xl font-semibold text-amber-400">
            {stats.avgRating.toFixed(1)} <span className="text-lg">&#11088;</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Positive (4-5 Star)</p>
          <p className="mt-2 font-display text-3xl font-semibold text-emerald-400">
            {stats.positive}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-slate-400">Redirected to Google</p>
          <p className="mt-2 font-display text-3xl font-semibold text-blue-400">
            {stats.redirected}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {stats.counts.map(({ star, count }) => {
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-14 text-slate-400 shrink-0">{star} Star</span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${star >= 4 ? "bg-emerald-500" : star === 3 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-400 shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Review Trend</h3>
          <div className="flex items-end gap-2 h-28">
            {stats.monthlyTrend.map(({ month, count }) => {
              const maxCount = Math.max(...stats.monthlyTrend.map((m) => m.count), 1);
              const pct = (count / maxCount) * 100;
              return (
                <div key={month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-slate-400">{count}</span>
                  <div
                    className="w-full rounded-t-md bg-emerald-500/80 transition-all duration-700"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                  <span className="text-[10px] text-slate-500">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Filter by shop..."
          value={filterShop}
          onChange={(e) => setFilterShop(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-slate-500 w-48"
        />
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} Stars
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white"
        >
          <option value="">All Types</option>
          <option value="positive">Positive</option>
          <option value="negative">Feedback</option>
        </select>
        {(filterRating || filterType || filterShop) && (
          <button
            onClick={() => {
              setFilterRating("");
              setFilterType("");
              setFilterShop("");
            }}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} of {reviews.length}
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm text-slate-300">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Shop
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rating
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Comment
              </th>
              <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.id} className="transition hover:bg-white/5">
                <td className="p-3 font-medium text-white">{r.shop_name ?? "Unknown"}</td>
                <td className="p-3 text-slate-400">
                  <div>{r.customer_name ?? "Anonymous"}</div>
                  {r.customer_phone && (
                    <div className="text-xs text-slate-600">{r.customer_phone}</div>
                  )}
                </td>
                <td className="p-3">
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star
                        key={v}
                        className={`size-3.5 ${v <= r.rating ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
                      />
                    ))}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      r.review_type === "positive"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400",
                    )}
                  >
                    {r.review_type === "positive" ? "Positive" : "Feedback"}
                  </span>
                </td>
                <td className="p-3 max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 shrink-0 text-slate-500" />
                    <p className="text-xs text-slate-400 truncate">
                      {(r.review_type === "positive" ? r.review_comment : r.feedback_comment) ??
                        "No comment"}
                    </p>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-8 text-center text-slate-500" colSpan={6}>
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
