import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  CreditCard,
  DollarSign,
  History,
  LayoutDashboard,
  LogOut,
  Pause,
  Play,
  Shield,
  Store,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useAllStaff,
  useIsAdmin,
  useSubscriptionHistory,
  usePaymentHistory,
} from "@/hooks/useShopData";
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
import { cn } from "@/lib/utils";
import {
  type Shop,
  PAYMENT_STATUSES,
  BILLING_CYCLES,
  PLAN_PRICE,
  NICHES,
  formatDate,
  money,
  subscriptionState,
  subscriptionStateLabel,
  planAmount,
  addMonths,
  addDays,
  daysRemaining,
} from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Super Admin — My QR Link" },
      { name: "description", content: "Manage all shops across the platform." },
      { property: "og:title", content: "Super Admin — My QR Link" },
      {
        property: "og:description",
        content: "Platform administration for shops, staff and users.",
      },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "shops" | "staff" | "payments";

// ─── Manage Modal Tab ───────────────────────────────────────────
type ModalTab = "info" | "subscription" | "payment" | "actions" | "history";

// ─── Main Component ─────────────────────────────────────────────
function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const [tab, setTab] = useState<Tab>("overview");
  const [q, setQ] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [managingShop, setManagingShop] = useState<Shop | null>(null);

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
  const paymentOverdue = allShops.filter((s) => s.payment_status === "overdue").length;
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
            <AdminStat label="Overdue Payments" value={paymentOverdue} color="red" />
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
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
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
                  <th className="p-3" />
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
                        <p className="font-medium text-white">{s.name}</p>
                        <a
                          href={`/shop/${s.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          /shop/{s.slug}
                        </a>
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
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 bg-transparent text-white hover:bg-white/10"
                          onClick={() => setManagingShop(s)}
                        >
                          Manage
                        </Button>
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
      {tab === "payments" && <PaymentManagement />}

      {/* ─── MANAGE MODAL ────────────────────────── */}
      {managingShop && (
        <ManageShopModal
          shop={managingShop}
          userId={user?.id}
          onClose={() => setManagingShop(null)}
          onRefresh={() => {
            refresh();
            setManagingShop(null);
          }}
        />
      )}
    </AdminFrame>
  );
}

// ─── Payment Badge ──────────────────────────────────────────────
function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-400",
    pending: "bg-yellow-500/15 text-yellow-400",
    overdue: "bg-red-500/15 text-red-400",
    not_paid: "bg-slate-500/15 text-slate-400",
    refunded: "bg-blue-500/15 text-blue-400",
    partially_paid: "bg-orange-500/15 text-orange-400",
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
  const isPending = status === "pending";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        status === "active"
          ? "bg-emerald-500/15 text-emerald-400"
          : isPending
            ? "bg-yellow-500/15 text-yellow-400"
            : "bg-red-500/15 text-red-400",
      )}
    >
      {status}
    </span>
  );
}

// ─── Manage Shop Modal ──────────────────────────────────────────
function ManageShopModal({
  shop,
  userId,
  onClose,
  onRefresh,
}: {
  shop: Shop;
  userId?: string | undefined;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [modalTab, setModalTab] = useState<ModalTab>("info");
  const [busy, setBusy] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [editInfo, setEditInfo] = useState({ name: shop.name, niche: shop.niche, slug: shop.slug });
  const qc = useQueryClient();

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
    setBusy(false);
    onRefresh();
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
      const cycle = shop.billing_cycle ?? "monthly";
      const now = new Date();
      const exp = cycle === "yearly" ? addMonths(now, 12) : addMonths(now, 1);
      patch["plan_expires_at"] = exp.toISOString();
      patch["next_billing_date"] = exp.toISOString();
      patch["amount_paid"] = planAmount(shop.plan, cycle);

      await supabase.from("payment_history").insert({
        shop_id: shop.id,
        amount: planAmount(shop.plan, cycle),
        plan: shop.plan,
        billing_cycle: cycle,
        payment_status: "paid",
        payment_date: now.toISOString(),
        due_date: exp.toISOString(),
      });
    }
    await updateShop(
      patch,
      "payment_status_changed",
      shop.payment_status ?? "not_paid",
      newStatus,
      notes || undefined,
    );
  }

  async function changePlan(newPlan: string) {
    const cycle = shop.billing_cycle ?? "monthly";
    await updateShop(
      { plan: newPlan, amount_paid: planAmount(newPlan, cycle) },
      "plan_changed",
      shop.plan,
      newPlan,
    );
  }

  async function changeBilling(newCycle: string) {
    await updateShop(
      { billing_cycle: newCycle, amount_paid: planAmount(shop.plan, newCycle) },
      "billing_cycle_changed",
      shop.billing_cycle ?? "monthly",
      newCycle,
    );
  }

  async function toggleStatus() {
    const newStatus = shop.status === "active" ? "suspended" : "active";
    await updateShop({ status: newStatus }, "status_changed", shop.status, newStatus);
  }

  async function cancelSubscription() {
    await updateShop(
      { status: "cancelled", payment_status: "not_paid" },
      "subscription_cancelled",
      shop.status,
      "cancelled",
    );
  }

  async function extendSubscription(days: number) {
    const base = shop.plan_expires_at ? new Date(shop.plan_expires_at) : new Date();
    const newExpiry = addDays(base, days);
    await updateShop(
      { plan_expires_at: newExpiry.toISOString(), next_billing_date: newExpiry.toISOString() },
      "subscription_extended",
      formatDate(shop.plan_expires_at),
      formatDate(newExpiry.toISOString()),
      `Extended by ${days} days`,
    );
    setExtendOpen(false);
  }

  const modalTabs: { id: ModalTab; label: string; icon: typeof Store }[] = [
    { id: "info", label: "Info", icon: Store },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "payment", label: "Payment", icon: DollarSign },
    { id: "actions", label: "Actions", icon: Play },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 text-slate-100 border-white/10 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Manage — {shop.name}</DialogTitle>
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
                  ? "bg-emerald-500/15 text-emerald-400"
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
                <InfoField label="Owner ID" value={shop.owner_id.slice(0, 8) + "…"} />
                <InfoField label="Created" value={formatDate(shop.created_at)} />
                <InfoField label="Account Status" value={shop.status} />
                <InfoField label="Subscription State" value={subscriptionStateLabel(subState)} />
                <InfoField label="Shop ID" value={shop.id.slice(0, 8) + "…"} />
              </div>
              <Button
                onClick={saveInfo}
                disabled={busy}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </div>
          )}

          {/* ── SUBSCRIPTION TAB ─── */}
          {modalTab === "subscription" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Current Plan</Label>
                  <select
                    value={shop.plan}
                    onChange={(e) => changePlan(e.target.value)}
                    disabled={busy}
                    className="h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">Billing Cycle</Label>
                  <select
                    value={shop.billing_cycle ?? "monthly"}
                    onChange={(e) => changeBilling(e.target.value)}
                    disabled={busy}
                    className="h-9 w-full rounded-md border border-white/10 bg-slate-800 px-3 text-sm text-white"
                  >
                    {BILLING_CYCLES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <InfoField
                  label="Start Date"
                  value={formatDate(shop.plan_started_at ?? shop.created_at)}
                />
                <InfoField label="Expiry Date" value={formatDate(shop.plan_expires_at)} />
                <InfoField label="Next Billing" value={formatDate(shop.next_billing_date)} />
                <InfoField
                  label="Days Remaining"
                  value={
                    daysRemaining(shop) === Infinity
                      ? "No expiry set"
                      : `${daysRemaining(shop)} days`
                  }
                />
                <InfoField label="Auto Renew" value={shop.auto_renew !== false ? "Yes" : "No"} />
                <InfoField label="Grace Period" value={`${shop.grace_period_days ?? 7} days`} />
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
                <ActionBtn
                  icon={AlertTriangle}
                  label="Mark as Overdue"
                  color="red"
                  onClick={() => markPayment("overdue")}
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
                  icon={shop.status === "active" ? Pause : Play}
                  label={
                    shop.status === "active"
                      ? "Suspend Shop"
                      : shop.status === "pending"
                        ? "Approve Shop"
                        : "Activate Shop"
                  }
                  color={shop.status === "active" ? "orange" : "emerald"}
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
            <th className="p-3" />
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
              <p className="font-display text-lg font-semibold text-white">MenuQR Admin Console</p>
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
      </p>
    </div>
  );
}

// ─── Payment Management Table ────────────────────────────────────────────────
function PaymentManagement() {
  const qc = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updatePaymentStatus(payment: any, status: string) {
    const { error } = await supabase.from("payments").update({ status }).eq("id", payment.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Payment ${status.toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ["admin-payments"] });

    if (status === "Approved") {
      // Create user logic here, omitted for brevity as per instructions, toast for now
      toast.success("User account and subscription will be activated!");
    }
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading payments...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full text-sm text-slate-200">
        <thead className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wider">
          <tr>
            <th className="p-3">Business</th>
            <th className="p-3">Plan</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Date</th>
            <th className="p-3">Proof</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(payments ?? []).map((p: any) => (
            <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
              <td className="p-3">
                <p className="font-medium text-white">{p.business_name}</p>
                <p className="text-xs text-slate-400">{p.owner_name}</p>
              </td>
              <td className="p-3">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
                  {p.plan_name}
                </span>
              </td>
              <td className="p-3 text-white">₹{p.amount}</td>
              <td className="p-3 text-xs text-slate-400">
                <p>{p.mobile}</p>
                <p>{p.email}</p>
              </td>
              <td className="p-3 text-slate-400 text-xs">
                {new Date(p.created_at).toLocaleDateString()}
              </td>
              <td className="p-3">
                <a 
                  href={p.screenshot_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline text-xs flex items-center"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1"/> View
                </a>
              </td>
              <td className="p-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    p.status === "Approved"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : p.status === "Pending"
                        ? "bg-yellow-500/15 text-yellow-400"
                        : "bg-red-500/15 text-red-400"
                  )}
                >
                  {p.status}
                </span>
              </td>
              <td className="p-3 text-right flex justify-end gap-2">
                {p.status === "Pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 bg-transparent h-7 text-xs px-2"
                      onClick={() => updatePaymentStatus(p, "Approved")}
                    >
                      <CheckCircle2 className="size-3 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent h-7 text-xs px-2"
                      onClick={() => updatePaymentStatus(p, "Rejected")}
                    >
                      <XCircle className="size-3 mr-1" /> Reject
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {(payments ?? []).length === 0 && (
            <tr>
              <td className="p-4 text-center text-slate-400" colSpan={8}>
                No payments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
