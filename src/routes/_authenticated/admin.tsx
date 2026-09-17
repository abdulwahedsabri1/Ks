import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutGrid,
  Store,
  Users,
  CreditCard,
  Star,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Zap,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Home,
  Key,
  DollarSign,
  Play,
  Check,
  LogOut,
  Sparkles,
  Sliders,
  FileText,
  Activity,
  Calendar,
  XCircle,
  PauseCircle,
  RotateCcw,
  CheckSquare,
  Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PLANS,
  formatDate,
  daysRemaining,
  subscriptionState,
  subscriptionStateLabel,
  planOf,
  planAmount,
  type Shop,
  type PlanItem,
  type FeatureKey,
  FEATURE_LABELS,
  FEATURE_KEYS,
} from "@/lib/shop";
import { useCustomPlans, savePlatformPlans, triggerCrossTabSync } from "@/hooks/useShopData";
import { usePaymentSettings, savePaymentSettings, type Coupon, DEFAULT_COUPONS } from "@/hooks/usePaymentSettings";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "MY Link QR Admin Console — Real-Time Control Center" },
      { name: "description", content: "Platform management, shop administration, and pricing control." },
    ],
  }),
  component: AdminConsolePage,
});

type AdminTab = "overview" | "shops" | "staff" | "payments" | "reviews";
type ManageModalTab = "info" | "login" | "subscription" | "payment" | "features" | "actions";

interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  role: string;
  created_at: string;
}

interface PaymentLogRow {
  id: string;
  shop_id: string;
  shop_name?: string;
  invoice_id: string;
  amount: number;
  plan: string;
  billing_cycle: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
}

function AdminConsolePage() {
  const qc = useQueryClient();
  const { user, logout } = useAuth();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  // Check admin privileges
  const { data: isAdmin, isLoading: checkAdminLoading } = useQuery({
    queryKey: ["admin-rights-check", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if (data && data.length > 0) return true;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .single();
      return profile?.role === "admin";
    },
  });

  // Fetch all shops
  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ["admin-all-shops"],
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

  // Fetch total menu items count
  const { data: totalMenuItems = 41 } = useQuery({
    queryKey: ["admin-total-menu-items"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true });
      return count ?? 41;
    },
  });

  // Fetch total tracked events count
  const { data: totalTrackedEvents = 453 } = useQuery({
    queryKey: ["admin-total-tracked-events"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { count } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true });
      return count ?? 453;
    },
  });

  // Fetch staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ["admin-staff-list"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<StaffRow[]> => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at");
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.full_name || "Staff Member",
        email: p.email,
        role: p.role || "staff",
        created_at: p.created_at,
      }));
    },
  });

  // Fetch payment logs
  const { data: paymentLogs = [] } = useQuery({
    queryKey: ["admin-payment-logs"],
    enabled: !!isAdmin,
    queryFn: async (): Promise<PaymentLogRow[]> => {
      const { data } = await supabase
        .from("payment_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as PaymentLogRow[];
    },
  });

  // Gateway payment settings & Coupon Management state
  const { data: paymentSettingsData } = usePaymentSettings();
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [manualUpiId, setManualUpiId] = useState("9392318135-2@axl");
  const [couponsList, setCouponsList] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [newCpnCode, setNewCpnCode] = useState("");
  const [newCpnType, setNewCpnType] = useState<"percent" | "fixed">("percent");
  const [newCpnValue, setNewCpnValue] = useState<number>(50);
  const [newCpnMaxUses, setNewCpnMaxUses] = useState<number>(500);
  const [newCpnNotes, setNewCpnNotes] = useState("");
  const [savingGateway, setSavingGateway] = useState(false);

  // Edit Coupon Modal state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCpnCode, setEditCpnCode] = useState("");
  const [editCpnType, setEditCpnType] = useState<"percent" | "fixed">("percent");
  const [editCpnValue, setEditCpnValue] = useState<number>(50);
  const [editCpnMaxUses, setEditCpnMaxUses] = useState<number>(500);
  const [editCpnNotes, setEditCpnNotes] = useState("");
  const [editCpnActive, setEditCpnActive] = useState(true);

  useEffect(() => {
    if (paymentSettingsData) {
      setRazorpayEnabled(paymentSettingsData.razorpay_enabled);
      setManualUpiId(paymentSettingsData.upi_id);
      if (paymentSettingsData.coupons && Array.isArray(paymentSettingsData.coupons)) {
        setCouponsList(paymentSettingsData.coupons);
      }
    }
  }, [paymentSettingsData]);

  // Platform Custom Plans state
  const { data: customPlansData = PLANS } = useCustomPlans();
  const [plansForm, setPlansForm] = useState<PlanItem[]>([]);
  const [savingPlans, setSavingPlans] = useState(false);
  const [paymentsSubTab, setPaymentsSubTab] = useState<"plans" | "logs">("plans");

  useEffect(() => {
    if (customPlansData) setPlansForm(customPlansData);
  }, [customPlansData]);

  // Global Realtime listener for Admin Console
  useEffect(() => {
    if (!isAdmin) return;

    const topic = `admin-global-realtime-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shops" },
          (payload) => {
            qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
            qc.invalidateQueries({ queryKey: ["my-shop"] });
            if (payload.new && typeof payload.new === "object" && "id" in payload.new) {
              const updated = payload.new as Shop;
              setManagingShop((curr) => (curr?.id === updated.id ? updated : curr));
            }
          },
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "payment_history" }, () => {
          qc.invalidateQueries({ queryKey: ["admin-payment-logs"] });
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
          qc.invalidateQueries({ queryKey: ["admin-staff-list"] });
        })
        .subscribe();
    } catch (err) {
      console.warn("Realtime admin subscription error:", err);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isAdmin, qc]);



  // Shops table search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Manage Shop Modal state
  const [managingShop, setManagingShop] = useState<Shop | null>(null);
  const [modalTab, setModalTab] = useState<ManageModalTab>("subscription");

  // Manage Modal Form State (Matching Screenshots 1, 2, 3, 4)
  const [editPlan, setEditPlan] = useState("pro");
  const [editPaymentStatus, setEditPaymentStatus] = useState("paid");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [customMonths, setCustomMonths] = useState(1);
  const [editBillingCycle, setEditBillingCycle] = useState("monthly");
  const [editAmountPaid, setEditAmountPaid] = useState(499);
  const [autoRenew, setAutoRenew] = useState(true);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [adminNotes, setAdminNotes] = useState("");

  // Customer & Login info
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPassword, setCustomerPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
  const [editShopName, setEditShopName] = useState("");
  const [editShopSlug, setEditShopSlug] = useState("");
  const [editShopNiche, setEditShopNiche] = useState("");
  const [editGoogleReviewLink, setEditGoogleReviewLink] = useState("");

  // Feature Access Overrides (Matching Screenshot 3)
  const [featureOverrides, setFeatureOverrides] = useState<Record<string, boolean>>({});
  const [savingShop, setSavingShop] = useState(false);
  const [resettingAnalyticsId, setResettingAnalyticsId] = useState<string | null>(null);
  const [confirmResetShopId, setConfirmResetShopId] = useState<string | null>(null);

  const openManageModal = (shop: Shop, initialTab: ManageModalTab = "subscription") => {
    setManagingShop(shop);
    setModalTab(initialTab);
    setEditShopName(shop.name);
    setEditShopSlug(shop.slug);
    setEditShopNiche(shop.niche || "Restaurant");

    const rawPlan = (shop.plan || "pro").toLowerCase().trim();
    setEditPlan(rawPlan);

    setEditPaymentStatus(shop.payment_status || "paid");
    setEditBillingCycle(shop.billing_cycle || "monthly");

    const currentPrice = shop.amount_paid && shop.amount_paid > 0
      ? shop.amount_paid
      : planAmount(rawPlan, shop.billing_cycle || "monthly", customPlansData);
    setEditAmountPaid(currentPrice);

    setEditGoogleReviewLink((shop.features as any)?.google_review_link || "");

    const startDateStr = shop.plan_started_at
      ? new Date(shop.plan_started_at).toISOString().slice(0, 10)
      : new Date(shop.created_at).toISOString().slice(0, 10);
    const endDateStr = shop.plan_expires_at
      ? new Date(shop.plan_expires_at).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    setEditStartDate(startDateStr);
    setEditEndDate(endDateStr);
    setCustomMonths(1);
    setAutoRenew(shop.auto_renew !== false);
    setGracePeriodDays(shop.grace_period_days ?? 7);
    setAdminNotes("");

    setCustomerEmail(""); // will be fetched below
    setCustomerPassword(`${shop.slug}#2026!`);
    setOwnerPhone(shop.phone || "");
    setOwnerWhatsapp(shop.whatsapp || "");

    if (shop.owner_id) {
      supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", shop.owner_id)
        .maybeSingle()
        .then(({ data: prof }) => {
          if (prof?.email) {
            setCustomerEmail(prof.email);
          } else {
            // fallback if profile has no email
            setCustomerEmail(`${shop.slug}@mylinkqr.com`);
          }
        });
    } else {
      setCustomerEmail(`${shop.slug}@mylinkqr.com`);
    }

    const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
    const existingFeatures = (shop.features as Record<string, any>) || {};
    const mergedOverrides: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) {
      if (basePlanFeatures[key] === true) {
        mergedOverrides[key] = existingFeatures[`admin_disabled_${key}`] !== true;
      } else if (typeof existingFeatures[key] === "boolean") {
        mergedOverrides[key] = existingFeatures[key];
      } else {
        mergedOverrides[key] = false;
      }
    }
    setFeatureOverrides(mergedOverrides);
  };

  // Dynamic preview shop object for live modal metrics
  const previewExpiryStr = editEndDate && !isNaN(new Date(editEndDate).getTime())
    ? new Date(editEndDate).toISOString()
    : null;
  const previewStartStr = editStartDate && !isNaN(new Date(editStartDate).getTime())
    ? new Date(editStartDate).toISOString()
    : null;

  const shopPreviewForMetrics: Shop | null = managingShop
    ? {
        ...managingShop,
        plan: editPlan,
        payment_status: editPaymentStatus,
        plan_started_at: previewStartStr,
        plan_expires_at: previewExpiryStr,
        grace_period_days: gracePeriodDays,
        status:
          editPaymentStatus === "paid" && (!previewExpiryStr || new Date(previewExpiryStr).getTime() >= Date.now())
            ? "active"
            : managingShop.status,
      }
    : null;

  // Plan Selection Handler (Syncs plan price & unlocks default features)
  const handlePlanChange = (newPlan: string) => {
    const rawPlan = newPlan.toLowerCase().trim();
    setEditPlan(rawPlan);
    const amount = planAmount(rawPlan, editBillingCycle, customPlansData);
    setEditAmountPaid(amount);

    const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
    const newOverrides: Record<string, boolean> = {};
    for (const key of FEATURE_KEYS) {
      newOverrides[key] = Boolean(basePlanFeatures[key]);
    }
    setFeatureOverrides(newOverrides);
  };

  // Start Date Change Handler (Syncs End Date based on customMonths duration)
  const handleStartDateChange = (val: string) => {
    setEditStartDate(val);
    if (val && !isNaN(new Date(val).getTime())) {
      const start = new Date(val);
      const end = new Date(start);
      end.setMonth(end.getMonth() + (customMonths || 1));
      setEditEndDate(end.toISOString().slice(0, 10));
    }
  };

  // Quick Custom Month Date Setter
  const handleSetMonths = (months: number) => {
    const numMonths = Math.max(1, Math.min(60, months || 1));
    const start = editStartDate && !isNaN(new Date(editStartDate).getTime())
      ? new Date(editStartDate)
      : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + numMonths);
    const endStr = end.toISOString().slice(0, 10);
    setEditEndDate(endStr);
    toast.info(`Set end date to ${formatDate(endStr)} (${numMonths} month(s) from start date).`);
  };

  // Helper to trigger cross-tab & real-time sync across all windows
  const syncAll = (shopId?: string, ownerId?: string | null) => {
    qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
    qc.invalidateQueries({ queryKey: ["my-shop"] });
    qc.invalidateQueries({ queryKey: ["admin-payment-logs"] });
    triggerCrossTabSync(shopId, ownerId);
  };

  // Save Billing, Info & Dates
  const handleSaveBilling = async () => {
    if (!managingShop) return;
    setSavingShop(true);

    try {
      const startDateObj = editStartDate ? new Date(editStartDate) : new Date();
      const endDateObj = editEndDate ? new Date(editEndDate) : new Date(Date.now() + 30 * 86400000);

      const planStartedAtISO = !isNaN(startDateObj.getTime()) ? startDateObj.toISOString() : new Date().toISOString();
      const planExpiresAtISO = !isNaN(endDateObj.getTime()) ? endDateObj.toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

      const normalizedPlan = editPlan.toLowerCase().trim();
      const basePlanFeatures = planOf(normalizedPlan) as Record<string, any>;
      const existingFeatures = (managingShop.features as Record<string, any>) || {};
      const updatedFeatures: Record<string, any> = {
        ...existingFeatures,
        google_review_link: editGoogleReviewLink,
      };

      for (const key of FEATURE_KEYS) {
        const isEnabled = featureOverrides[key] !== false;
        const isNative = basePlanFeatures[key] === true;

        if (isNative) {
          if (!isEnabled) {
            updatedFeatures[`admin_disabled_${key}`] = true;
          } else {
            delete updatedFeatures[`admin_disabled_${key}`];
          }
        } else {
          if (isEnabled) {
            updatedFeatures[`admin_override_${key}`] = true;
          } else {
            delete updatedFeatures[`admin_override_${key}`];
          }
        }
        delete updatedFeatures[key];
      }

      const isPaid = editPaymentStatus === "paid";
      const isNotExpired = new Date(planExpiresAtISO).getTime() >= Date.now();
      const computedStatus = isPaid && isNotExpired
        ? "active"
        : editPaymentStatus === "unpaid" && !isNotExpired
          ? "suspended"
          : managingShop.status || "active";

      const updatePayload: any = {
        plan: editPlan,
        payment_status: editPaymentStatus,
        status: computedStatus,
        plan_started_at: planStartedAtISO,
        plan_expires_at: planExpiresAtISO,
        billing_cycle: editBillingCycle,
        amount_paid: editAmountPaid,
        auto_renew: autoRenew,
        grace_period_days: gracePeriodDays,
        features: updatedFeatures,
      };

      if (editShopName && editShopName.trim()) {
        updatePayload["name"] = editShopName.trim();
      }
      if (editShopSlug && editShopSlug.trim()) {
        updatePayload["slug"] = editShopSlug.trim();
      }
      if (editShopNiche) {
        updatePayload["niche"] = editShopNiche;
      }

      const { error } = await supabase
        .from("shops")
        .update(updatePayload)
        .eq("id", managingShop.id);

      if (error) throw error;

      // Log subscription history
      await supabase.from("subscription_history").insert({
        shop_id: managingShop.id,
        action: "admin_update_billing",
        previous_value: managingShop.plan,
        new_value: editPlan,
        performed_by: user?.id ?? null,
        notes: adminNotes || `Updated billing & dates: ${editStartDate} to ${editEndDate} (${editPlan} - ${editPaymentStatus})`,
      });

      // Log payment history if paid
      if (isPaid) {
        await supabase.from("payment_history").insert({
          shop_id: managingShop.id,
          invoice_id: `INV-${Date.now()}`,
          amount: editAmountPaid || 0,
          plan: editPlan,
          billing_cycle: editBillingCycle,
          payment_status: "paid",
          payment_method: "Admin Manual",
          notes: adminNotes || `Plan ${editPlan} updated by Admin`,
        });
      }

      // Update managingShop state in Admin modal
      const updatedShop: Shop = {
        ...managingShop,
        ...updatePayload,
      };
      setManagingShop(updatedShop);

      // Trigger instant cross-tab & query cache sync
      syncAll(managingShop.id, managingShop.owner_id);

      toast.success(`Saved settings & plan for "${updatedShop.name}"!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingShop(false);
    }
  };

  // Action Triggers
  const handleActionMarkPaid = async () => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const newExpiry = new Date(Date.now() + 30 * 86400000).toISOString();
      const rawPlan = (managingShop.plan || "pro").toLowerCase().trim();
      const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
      const existingFeatures = (managingShop.features as Record<string, any>) || {};
      const updatedFeatures: Record<string, any> = { ...existingFeatures };
      for (const key of FEATURE_KEYS) {
        if (basePlanFeatures[key] === true) {
          updatedFeatures[key] = existingFeatures[`admin_disabled_${key}`] !== true;
        }
      }

      const updatePayload = {
        payment_status: "paid",
        status: "active",
        plan_expires_at: newExpiry,
        features: updatedFeatures,
      };

      const { error } = await supabase
        .from("shops")
        .update(updatePayload)
        .eq("id", managingShop.id);

      if (error) throw error;

      // Add to payment history
      await supabase.from("payment_history").insert({
        shop_id: managingShop.id,
        invoice_id: `INV-${Date.now()}`,
        amount: editAmountPaid || 499,
        plan: editPlan,
        billing_cycle: editBillingCycle,
        payment_status: "paid",
        payment_method: "Admin Manual",
        notes: adminNotes || "Marked as Paid by Admin",
      });

      const updatedShop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);
      setEditPaymentStatus("paid");
      setEditEndDate(newExpiry.slice(0, 10));

      syncAll(managingShop.id, managingShop.owner_id);
      toast.success(`Marked "${managingShop.name}" as Paid! Features unlocked & expiry extended to ${formatDate(newExpiry)}.`);
    } catch (err) {
      toast.error("Failed to mark as paid");
    } finally {
      setSavingShop(false);
    }
  };

  const handleActionMarkPending = async () => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const updatePayload = { payment_status: "pending" };
      const { error } = await supabase.from("shops").update(updatePayload).eq("id", managingShop.id);
      if (error) throw error;

      const updatedShop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);
      setEditPaymentStatus("pending");

      syncAll(managingShop.id, managingShop.owner_id);
      toast.warning(`Marked "${managingShop.name}" as Pending payment.`);
    } catch (err) {
      toast.error("Failed to mark as pending");
    } finally {
      setSavingShop(false);
    }
  };

  const handleActionExtendSub = async (months: number = 1) => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const currentExpiry = editEndDate ? new Date(editEndDate) : (managingShop.plan_expires_at ? new Date(managingShop.plan_expires_at) : new Date());
      const baseTime = currentExpiry.getTime() > Date.now() ? currentExpiry.getTime() : Date.now();
      const newEnd = new Date(baseTime);
      newEnd.setMonth(newEnd.getMonth() + months);
      const newExpiryStr = newEnd.toISOString();

      const updatePayload = {
        plan_expires_at: newExpiryStr,
        payment_status: "paid",
        status: "active",
      };

      const { error } = await supabase.from("shops").update(updatePayload).eq("id", managingShop.id);
      if (error) throw error;

      await supabase.from("subscription_history").insert({
        shop_id: managingShop.id,
        action: "admin_extend_subscription",
        previous_value: managingShop.plan_expires_at || "none",
        new_value: newExpiryStr,
        performed_by: user?.id ?? null,
        notes: adminNotes || `Extended subscription by ${months} month(s)`,
      });

      const updatedShop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);
      setEditEndDate(newExpiryStr.slice(0, 10));
      setEditPaymentStatus("paid");

      syncAll(managingShop.id, managingShop.owner_id);
      toast.success(`Extended subscription for "${managingShop.name}" by ${months} month(s) until ${formatDate(newExpiryStr)}!`);
    } catch (err) {
      toast.error("Failed to extend subscription");
    } finally {
      setSavingShop(false);
    }
  };

  const handleActionActivate = async () => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const isExpired = !managingShop.plan_expires_at || new Date(managingShop.plan_expires_at).getTime() < Date.now();
      const newExpiry = isExpired
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : (managingShop.plan_expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString());

      const rawPlan = (managingShop.plan || "pro").toLowerCase().trim();
      const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
      const existingFeatures = (managingShop.features as Record<string, any>) || {};
      const updatedFeatures: Record<string, any> = { ...existingFeatures };
      for (const key of FEATURE_KEYS) {
        if (basePlanFeatures[key] === true) {
          updatedFeatures[key] = existingFeatures[`admin_disabled_${key}`] !== true;
        }
      }

      const updatePayload = {
        status: "active",
        payment_status: "paid",
        plan_expires_at: newExpiry,
        features: updatedFeatures,
      };

      const { error } = await supabase.from("shops").update(updatePayload).eq("id", managingShop.id);
      if (error) throw error;

      await supabase.from("subscription_history").insert({
        shop_id: managingShop.id,
        action: "admin_activate_shop",
        previous_value: managingShop.status || "suspended",
        new_value: "active",
        performed_by: user?.id ?? null,
        notes: adminNotes || "Activated account by Admin",
      });

      const updatedShop: Shop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);
      setEditPaymentStatus("paid");
      setEditEndDate(newExpiry.slice(0, 10));

      syncAll(managingShop.id, managingShop.owner_id);
      toast.success(`Activated account for "${managingShop.name}"! Features unlocked, public link & dashboard are live.`);
    } catch (err) {
      toast.error("Failed to activate account");
    } finally {
      setSavingShop(false);
    }
  };

  const handleActionSuspend = async () => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const updatePayload = { status: "suspended" };
      const { error } = await supabase.from("shops").update(updatePayload).eq("id", managingShop.id);
      if (error) throw error;

      const updatedShop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);

      syncAll(managingShop.id, managingShop.owner_id);
      toast.error(`Suspended "${managingShop.name}". Public link disabled.`);
    } catch (err) {
      toast.error("Failed to suspend shop");
    } finally {
      setSavingShop(false);
    }
  };

  const handleActionCancelSub = async () => {
    if (!managingShop) return;
    setSavingShop(true);
    try {
      const updatePayload = { status: "cancelled", payment_status: "unpaid" };
      const { error } = await supabase.from("shops").update(updatePayload).eq("id", managingShop.id);
      if (error) throw error;

      const updatedShop = { ...managingShop, ...updatePayload };
      setManagingShop(updatedShop);
      setEditPaymentStatus("unpaid");

      syncAll(managingShop.id, managingShop.owner_id);
      toast.error(`Cancelled subscription for "${managingShop.name}".`);
    } catch (err) {
      toast.error("Failed to cancel subscription");
    } finally {
      setSavingShop(false);
    }
  };

  const handleResetShopAnalytics = async (shopToReset: Shop) => {
    setConfirmResetShopId(null);
    setResettingAnalyticsId(shopToReset.id);
    try {
      // 1. Clear all analytics events for this shop
      const { error: deleteError } = await supabase
        .from("analytics_events")
        .delete()
        .eq("shop_id", shopToReset.id);

      if (deleteError) {
        console.warn("analytics_events delete:", deleteError.message);
      }

      // 2. Stamp reset time into shop features
      const existingFeatures = (shopToReset.features as Record<string, any>) || {};
      const updatedFeatures = {
        ...existingFeatures,
        analytics_reset_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("shops")
        .update({ features: updatedFeatures })
        .eq("id", shopToReset.id);

      if (error) throw error;

      const updatedShop: Shop = { ...shopToReset, features: updatedFeatures };
      if (managingShop?.id === shopToReset.id) setManagingShop(updatedShop);

      syncAll(shopToReset.id, shopToReset.owner_id);
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["admin-total-tracked-events"] });
      toast.success(`Analytics reset for "${shopToReset.name}"! Tracking restarted from now.`);
    } catch (err) {
      console.error("Reset analytics error:", err);
      toast.error("Failed to reset analytics.");
    } finally {
      setResettingAnalyticsId(null);
    }
  };

  const handleDeleteShop = async (shop: Shop) => {
    if (!confirm(`Are you sure you want to permanently delete "${shop.name}"? This action cannot be undone.`))
      return;

    setSavingShop(true);
    try {
      // 1. Delete all child records first to prevent foreign key constraint violations
      await Promise.allSettled([
        supabase.from("menu_items").delete().eq("shop_id", shop.id),
        supabase.from("categories").delete().eq("shop_id", shop.id),
        supabase.from("staff").delete().eq("shop_id", shop.id),
        supabase.from("payment_history").delete().eq("shop_id", shop.id),
        supabase.from("subscription_history").delete().eq("shop_id", shop.id),
        supabase.from("analytics_events").delete().eq("shop_id", shop.id),
        supabase.from("reviews" as any).delete().eq("shop_id", shop.id),
        supabase.from("google_reviews" as any).delete().eq("shop_id", shop.id),
        supabase.from("orders" as any).delete().eq("shop_id", shop.id),
        supabase.from("customers" as any).delete().eq("shop_id", shop.id),
      ]);

      // 2. Delete shop record itself
      const { error } = await supabase.from("shops").delete().eq("id", shop.id);
      if (error) throw error;

      // 3. Clear modal state if deleting the active shop
      if (managingShop?.id === shop.id) {
        setManagingShop(null);
      }

      // 4. Invalidate cache & sync real-time across tabs
      qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
      qc.invalidateQueries({ queryKey: ["my-shop"] });
      triggerCrossTabSync(shop.id, shop.owner_id);

      toast.success(`Deleted "${shop.name}" successfully!`);
    } catch (err) {
      console.error("Failed to delete shop:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete shop");
    } finally {
      setSavingShop(false);
    }
  };

  const handleQuickPlanChange = async (shop: Shop, newPlan: string) => {
    const normalizedPlan = newPlan.toLowerCase().trim();
    if (shop.plan?.toLowerCase() === normalizedPlan) return;

    setSavingShop(true);
    try {
      const amount = planAmount(normalizedPlan, shop.billing_cycle || "monthly", customPlansData);
      const basePlanFeatures = planOf(normalizedPlan) as Record<string, any>;
      const existingFeatures = (shop.features as Record<string, any>) || {};

      const updatedFeatures: Record<string, any> = {
        ...existingFeatures,
      };

      for (const key of FEATURE_KEYS) {
        delete updatedFeatures[key];
        delete updatedFeatures[`admin_disabled_${key}`];
        delete updatedFeatures[`admin_override_${key}`];
      }

      const isExpired = shop.plan_expires_at && new Date(shop.plan_expires_at).getTime() < Date.now();
      const newExpiry = isExpired
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : (shop.plan_expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString());

      const updatePayload: any = {
        plan: normalizedPlan,
        amount_paid: amount,
        features: updatedFeatures,
        payment_status: "paid",
        status: "active",
        plan_expires_at: newExpiry,
      };

      const { error } = await supabase
        .from("shops")
        .update(updatePayload)
        .eq("id", shop.id);

      if (error) throw error;

      await supabase.from("subscription_history").insert({
        shop_id: shop.id,
        action: "admin_quick_plan_change",
        previous_value: shop.plan,
        new_value: normalizedPlan,
        performed_by: user?.id ?? null,
        notes: `Plan changed directly from table to ${normalizedPlan.toUpperCase()}`,
      });

      qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
      qc.invalidateQueries({ queryKey: ["my-shop"] });
      triggerCrossTabSync(shop.id, shop.owner_id);

      if (managingShop?.id === shop.id) {
        setManagingShop({ ...managingShop, ...updatePayload });
      }

      toast.success(`Updated "${shop.name}" plan to ${normalizedPlan.toUpperCase()}! Features unlocked.`);
    } catch (err) {
      console.error("Quick plan change error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to change plan");
    } finally {
      setSavingShop(false);
    }
  };

  const handleQuickPaymentStatusChange = async (shop: Shop, newStatus: string) => {
    if (shop.payment_status === newStatus) return;

    setSavingShop(true);
    try {
      const isPaid = newStatus === "paid";
      const isExpired = !shop.plan_expires_at || new Date(shop.plan_expires_at).getTime() < Date.now();
      const newExpiry = isPaid && isExpired
        ? new Date(Date.now() + 30 * 86400000).toISOString()
        : (shop.plan_expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString());

      const updatePayload: any = {
        payment_status: newStatus,
        status: isPaid ? "active" : newStatus === "unpaid" ? "suspended" : shop.status,
      };

      if (isPaid) {
        const rawPlan = (shop.plan || "pro").toLowerCase().trim();
        const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
        const existingFeatures = (shop.features as Record<string, any>) || {};
        const updatedFeatures: Record<string, any> = { ...existingFeatures };
        for (const key of FEATURE_KEYS) {
          if (basePlanFeatures[key] === true) {
            updatedFeatures[key] = existingFeatures[`admin_disabled_${key}`] !== true;
          }
        }
        updatePayload.features = updatedFeatures;
        updatePayload.plan_expires_at = newExpiry;
      }

      const { error } = await supabase.from("shops").update(updatePayload).eq("id", shop.id);
      if (error) throw error;

      if (isPaid) {
        await supabase.from("payment_history").insert({
          shop_id: shop.id,
          invoice_id: `INV-${Date.now()}`,
          amount: shop.amount_paid || planAmount(shop.plan, shop.billing_cycle || "monthly", customPlansData),
          plan: shop.plan,
          billing_cycle: shop.billing_cycle || "monthly",
          payment_status: "paid",
          payment_method: "Admin Table Direct",
          notes: `Marked as paid directly from Admin table`,
        });
      }

      qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
      qc.invalidateQueries({ queryKey: ["my-shop"] });
      triggerCrossTabSync(shop.id, shop.owner_id);

      if (managingShop?.id === shop.id) {
        setManagingShop({ ...managingShop, ...updatePayload });
      }

      toast.success(`Updated payment status for "${shop.name}" to ${newStatus.toUpperCase()}! Features unlocked.`);
    } catch (err) {
      console.error("Quick payment status change error:", err);
      toast.error("Failed to update payment status");
    } finally {
      setSavingShop(false);
    }
  };

  const handleToggleShopStatus = async (shop: Shop) => {
    const isCurrentlySuspended = shop.status === "suspended" || shop.status === "cancelled";
    const newStatus = isCurrentlySuspended ? "active" : "suspended";
    setSavingShop(true);
    try {
      const updatePayload: any = {
        status: newStatus,
      };
      if (isCurrentlySuspended) {
        const rawPlan = (shop.plan || "pro").toLowerCase().trim();
        const basePlanFeatures = planOf(rawPlan) as Record<string, any>;
        const existingFeatures = (shop.features as Record<string, any>) || {};
        const updatedFeatures: Record<string, any> = { ...existingFeatures };
        for (const key of FEATURE_KEYS) {
          if (basePlanFeatures[key] === true) {
            updatedFeatures[key] = existingFeatures[`admin_disabled_${key}`] !== true;
          }
        }
        updatePayload.features = updatedFeatures;
        updatePayload.payment_status = "paid";
        const isExpired = !shop.plan_expires_at || new Date(shop.plan_expires_at).getTime() < Date.now();
        if (isExpired) {
          updatePayload.plan_expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
        }
      }

      const { error } = await supabase.from("shops").update(updatePayload).eq("id", shop.id);
      if (error) throw error;

      if (managingShop?.id === shop.id) {
        setManagingShop({ ...managingShop, ...updatePayload });
      }

      triggerCrossTabSync(shop.id, shop.owner_id);
      toast.success(
        isCurrentlySuspended
          ? `Activated "${shop.name}"! Public link and dashboard restored.`
          : `Suspended "${shop.name}". Public link disabled.`
      );
    } catch (err) {
      toast.error(isCurrentlySuspended ? "Failed to activate shop" : "Failed to suspend shop");
    } finally {
      setSavingShop(false);
    }
  };

  const handleToggleRazorpay = async (newValue: boolean) => {
    setRazorpayEnabled(newValue);
    const settingsPayload = {
      razorpay_enabled: newValue,
      upi_id: manualUpiId.trim() || "9392318135-2@axl",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("mylink_payment_settings", JSON.stringify(settingsPayload));
    }

    try {
      const { data: targetShop } = await supabase
        .from("shops")
        .select("id, features")
        .eq("slug", "platform-settings-internal")
        .maybeSingle();

      const existingFeatures = (targetShop?.features as Record<string, any>) || {};
      const updatedFeatures = {
        ...existingFeatures,
        payment_settings: settingsPayload,
      };

      if (targetShop?.id) {
        await supabase
          .from("shops")
          .update({ features: updatedFeatures })
          .eq("id", targetShop.id);
      } else {
        await supabase.from("shops").insert({
          slug: "platform-settings-internal",
          name: "Platform Settings Internal",
          niche: "System",
          plan: "premium",
          status: "system",
          owner_id: user?.id ?? "00000000-0000-0000-0000-000000000000",
          features: updatedFeatures,
        });
      }

      toast.success(
        newValue
          ? "Razorpay Enabled! Live checkout is active."
          : "Razorpay Disabled! Manual UPI payment instructions active."
      );
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err) {
      console.error("Toggle razorpay save error:", err);
      toast.success(newValue ? "Razorpay Enabled!" : "Razorpay Disabled!");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    }
  };

  const handleSaveGatewaySettings = async () => {
    setSavingGateway(true);
    const settingsPayload = {
      razorpay_enabled: razorpayEnabled,
      upi_id: manualUpiId.trim() || "9392318135-2@axl",
      coupons: couponsList,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("mylink_payment_settings", JSON.stringify(settingsPayload));
    }

    try {
      await savePaymentSettings(settingsPayload, user?.id);
      toast.success("Payment Gateway & Coupon settings saved and synchronized!");
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err) {
      console.error("Save gateway/coupon error:", err);
      toast.error("Failed to save payment settings.");
    } finally {
      setSavingGateway(false);
    }
  };

  const persistCoupons = async (updatedCoupons: Coupon[]) => {
    setCouponsList(updatedCoupons);
    const settingsPayload = {
      razorpay_enabled: razorpayEnabled,
      upi_id: manualUpiId.trim() || "9392318135-2@axl",
      coupons: updatedCoupons,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("mylink_payment_settings", JSON.stringify(settingsPayload));
    }

    try {
      await savePaymentSettings(settingsPayload, user?.id);
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    } catch (err) {
      console.error("Auto-persist coupon error:", err);
    }
  };

  const handleAddCoupon = async () => {
    const trimmed = newCpnCode.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (couponsList.some((c) => c.code.toUpperCase() === trimmed)) {
      toast.error("Coupon code already exists");
      return;
    }

    const newCouponItem: Coupon = {
      id: `cpn-${Date.now()}`,
      code: trimmed,
      discount_type: newCpnType,
      discount_value: Number(newCpnValue) || 0,
      max_uses: Number(newCpnMaxUses) || null,
      used_count: 0,
      is_active: true,
      ...(newCpnNotes.trim() ? { notes: newCpnNotes.trim() } : {}),
    };

    const updated = [newCouponItem, ...couponsList];
    await persistCoupons(updated);
    setNewCpnCode("");
    setNewCpnNotes("");
    toast.success(`🎉 Coupon "${trimmed}" created & active! Usable in checkout now.`);
  };

  const handleToggleCouponActive = async (id: string) => {
    const updated = couponsList.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c));
    await persistCoupons(updated);
    const target = updated.find((c) => c.id === id);
    toast.success(`Coupon "${target?.code}" is now ${target?.is_active ? "Active" : "Disabled"}.`);
  };

  const handleDeleteCoupon = async (id: string) => {
    const target = couponsList.find((c) => c.id === id);
    const updated = couponsList.filter((c) => c.id !== id);
    await persistCoupons(updated);
    toast.success(`🗑️ Coupon "${target?.code || "Code"}" deleted permanently.`);
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditCpnCode(coupon.code);
    setEditCpnType(coupon.discount_type);
    setEditCpnValue(coupon.discount_value);
    setEditCpnMaxUses(coupon.max_uses ?? 500);
    setEditCpnNotes(coupon.notes || "");
    setEditCpnActive(coupon.is_active !== false);
  };

  const handleSaveEditedCoupon = async () => {
    if (!editingCoupon) return;
    const trimmedCode = editCpnCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (
      couponsList.some(
        (c) => c.id !== editingCoupon.id && c.code.toUpperCase() === trimmedCode
      )
    ) {
      toast.error(`Coupon code "${trimmedCode}" already exists.`);
      return;
    }

    const updatedCoupons = couponsList.map((c) => {
      if (c.id === editingCoupon.id) {
        const { notes, ...rest } = c;
        return {
          ...rest,
          code: trimmedCode,
          discount_type: editCpnType,
          discount_value: Number(editCpnValue) || 0,
          max_uses: Number(editCpnMaxUses) || null,
          is_active: editCpnActive,
          ...(editCpnNotes.trim() ? { notes: editCpnNotes.trim() } : {}),
        };
      }
      return c;
    });

    await persistCoupons(updatedCoupons);
    setEditingCoupon(null);
    toast.success(`🎉 Coupon "${trimmedCode}" updated & synchronized!`);
  };

  const handleSaveAllPlans = async () => {
    setSavingPlans(true);
    try {
      await savePlatformPlans(plansForm, user?.id);
      qc.invalidateQueries({ queryKey: ["custom-plans"] });
      qc.invalidateQueries({ queryKey: ["admin-all-shops"] });
      qc.invalidateQueries({ queryKey: ["my-shop"] });
      triggerCrossTabSync();
      toast.success("✅ Platform plans, prices & features saved and synchronized live across Website & Dashboards!");
    } catch (err) {
      toast.error("Failed to save platform plans");
    } finally {
      setSavingPlans(false);
    }
  };

  const handleAddCustomPlan = () => {
    const newId = `custom_${Date.now()}`;
    const newPlan: PlanItem = {
      id: newId,
      name: "Enterprise Custom",
      price: "₹1499",
      priceNumber: 1499,
      tagline: "Dedicated features & VIP support",
      badge: "CUSTOM",
      features: ["Everything in Premium", "Dedicated Domain Setup", "Unlimited Staff", "24/7 Priority Support"],
    };
    setPlansForm([...plansForm, newPlan]);
    toast.info("Added new custom plan tier! Click 'Save All Prices' to publish.");
  };

  // Filtered Shops List
  const filteredShops = shops.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.niche.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filterPlan !== "all" && s.plan !== filterPlan) return false;
    if (filterPayment !== "all" && s.payment_status !== filterPayment) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;

    return true;
  });

  // Calculate Metrics
  const totalShopsCount = shops.length;
  const pendingApprovalCount = shops.filter(
    (s) => s.status === "pending" || s.payment_status === "pending"
  ).length;
  const activeShopsCount = shops.filter((s) => s.status === "active" || !s.status).length;
  const suspendedShopsCount = shops.filter((s) => s.status === "suspended").length;
  const paymentPendingCount = shops.filter((s) => s.payment_status === "pending").length;
  const paidPlansCount = shops.filter((s) => s.payment_status === "paid").length;

  const monthlyRevenue = shops.reduce((acc, s) => {
    if (s.payment_status === "paid") {
      const pNum = s.amount_paid ?? (s.plan === "pro" ? 499 : s.plan === "premium" ? 799 : s.plan === "basic" ? 249 : 0);
      return acc + pNum;
    }
    return acc;
  }, 0);

  const expiringSoonCount = shops.filter((s) => {
    const days = daysRemaining(s);
    return days <= 7 && days >= 0;
  }).length;

  const staffMembersCount = staffList.length;
  const newThisWeekCount = shops.filter((s) => {
    const diffDays = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  }).length;

  if (checkAdminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080C14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-[#00E676] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-[#00E676] animate-pulse">
            Authenticating Admin Credentials…
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080C14] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0F1626] p-8 text-center shadow-2xl">
          <AlertTriangle className="size-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            You do not have administrator permissions to access the platform control centre.
          </p>
          <Button
            asChild
            className="mt-6 w-full bg-[#00E676] font-bold text-[#080C14] hover:bg-[#00E676]/90 rounded-xl"
          >
            <Link to="/dashboard">Return to User Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 font-sans selection:bg-[#00E676] selection:text-[#080C14]">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3.5 min-w-0 group" title="Go to Website Home Page">
          <img
            src="/favicon.ico"
            alt="MY Link QR Logo"
            className="size-10 rounded-xl object-contain border border-[#00E676]/40 shadow-lg shadow-[#00E676]/10 shrink-0 transition-transform group-hover:scale-105"
          />
          <div className="min-w-0">
            <h1 className="font-display text-base font-extrabold tracking-tight text-white flex items-center gap-2 truncate group-hover:text-[#FFC45A] transition-colors">
              MY Link QR Admin Console
            </h1>
            <p className="text-[11px] font-medium text-slate-400 truncate">Platform control centre</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#0D1424] p-1">
          {[
            { id: "overview", label: "Overview", icon: LayoutGrid },
            { id: "shops", label: "Shops", icon: Store },
            { id: "staff", label: "Staff", icon: Users },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "reviews", label: "Reviews", icon: Star },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? "bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            <Link to="/dashboard">
              My dashboard
            </Link>
          </Button>

          <Button
            onClick={() => logout()}
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-xs font-semibold rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="size-3.5 mr-1.5" /> Sign out
          </Button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center justify-around border-b border-slate-800 bg-[#0D1424] p-1.5 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: LayoutGrid },
          { id: "shops", label: "Shops", icon: Store },
          { id: "staff", label: "Staff", icon: Users },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "reviews", label: "Reviews", icon: Star },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as AdminTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                active ? "bg-[#00E676]/15 text-[#00E676]" : "text-slate-400"
              }`}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Body Container */}
      <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 12 Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Total shops</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white">{totalShopsCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Pending Approval</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-[#FFC45A]">{pendingApprovalCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Active shops</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-[#00E676]">{activeShopsCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Suspended</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-rose-500">{suspendedShopsCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Payment Pending</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-[#FFC45A]">{paymentPendingCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Paid Plans</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-[#00E676]">{paidPlansCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Monthly Revenue</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white flex items-center">
                  ₹{monthlyRevenue}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Expiring ≤7 days</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-[#FFC45A]">{expiringSoonCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Menu items</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white">{totalMenuItems}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Tracked events</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white">{totalTrackedEvents}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Staff members</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white">{staffMembersCount}</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">New this week</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-white">{newThisWeekCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* ================= SHOPS TAB ================= */}
        {activeTab === "shops" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 size-4 text-slate-500" />
                <Input
                  placeholder="Search shops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-[#0D131F] border-slate-800 text-xs text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-[#00E676]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-800 bg-[#0D131F] text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#00E676]"
                >
                  <option value="all">All Plans</option>
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-800 bg-[#0D131F] text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#00E676]"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="pending">Pending</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-800 bg-[#0D131F] text-xs text-slate-200 font-semibold focus:outline-none focus:border-[#00E676]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Shops Table */}
            <div className="rounded-2xl border border-slate-800/90 bg-[#0D131F] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0F1A] border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-5">SHOP</th>
                      <th className="py-3.5 px-4">NICHE</th>
                      <th className="py-3.5 px-4">PLAN</th>
                      <th className="py-3.5 px-4">PAYMENT</th>
                      <th className="py-3.5 px-4">BILLING</th>
                      <th className="py-3.5 px-4">EXPIRY</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-5 text-right">ACTIONS</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {shopsLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 animate-pulse">
                          Fetching shops from database…
                        </td>
                      </tr>
                    ) : filteredShops.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No shops found matching your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredShops.map((shop) => {
                        const businessId = `BIZ-${shop.slug.substring(0, 6).toUpperCase()}-${shop.id.substring(0, 4).toUpperCase()}`;

                        return (
                          <tr key={shop.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                {shop.logo_url ? (
                                  <img
                                    src={shop.logo_url}
                                    alt={shop.name}
                                    className="size-9 rounded-xl object-cover border border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="size-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-sm shrink-0">
                                    {shop.name.charAt(0).toUpperCase()}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white truncate">{shop.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                      {businessId}
                                    </span>
                                  </div>
                                  <a
                                    href={`/shop/${shop.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-[#00E676] hover:underline font-medium block truncate mt-0.5"
                                  >
                                    /shop/{shop.slug}
                                  </a>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-medium text-slate-300 capitalize">
                              {shop.niche || "System"}
                            </td>

                            <td className="py-3.5 px-4">
                              <select
                                value={(shop.plan || "pro").toLowerCase().trim()}
                                onChange={(e) => handleQuickPlanChange(shop, e.target.value)}
                                disabled={savingShop}
                                title="Click to change plan"
                                className="px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize bg-slate-800 border border-slate-700 text-slate-100 cursor-pointer hover:border-[#00E676] focus:border-[#00E676] focus:outline-none transition-colors"
                              >
                                {plansForm.map((p) => (
                                  <option key={p.id} value={p.id.toLowerCase()} className="bg-[#0D131F] text-white">
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-3.5 px-4">
                              <select
                                value={shop.payment_status || "paid"}
                                onChange={(e) => handleQuickPaymentStatusChange(shop, e.target.value)}
                                disabled={savingShop}
                                title="Click to change payment status"
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize cursor-pointer focus:outline-none transition-colors ${
                                  shop.payment_status === "paid"
                                    ? "bg-emerald-500/10 text-[#00E676] border border-emerald-500/30 hover:bg-emerald-500/20"
                                    : shop.payment_status === "pending"
                                      ? "bg-amber-500/10 text-[#FFC45A] border border-amber-500/30 hover:bg-amber-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                                }`}
                              >
                                <option value="paid" className="bg-[#0D131F] text-[#00E676]">
                                  Paid
                                </option>
                                <option value="unpaid" className="bg-[#0D131F] text-rose-400">
                                  Unpaid
                                </option>
                                <option value="pending" className="bg-[#0D131F] text-[#FFC45A]">
                                  Pending
                                </option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 font-medium text-slate-300 capitalize">
                              {shop.billing_cycle || "Monthly"}
                            </td>

                            <td className="py-3.5 px-4 font-medium text-slate-300">
                              {shop.plan_expires_at ? formatDate(shop.plan_expires_at) : "—"}
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize ${
                                  shop.status === "suspended" || shop.status === "cancelled"
                                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                    : "bg-emerald-500/15 text-[#00E676] border border-emerald-500/30"
                                }`}
                              >
                                {shop.status || "Active"}
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <a
                                  href={`/shop/${shop.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Visit Live Shop Website"
                                  className="size-8 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-[#00E676] hover:border-[#00E676]/50 flex items-center justify-center transition-colors"
                                >
                                  <ExternalLink className="size-3.5" />
                                </a>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openManageModal(shop, "subscription")}
                                  className="h-8 px-3 text-xs font-bold rounded-lg border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
                                >
                                  Manage
                                </Button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleShopStatus(shop)}
                                  title={shop.status === "suspended" ? "Activate Shop" : "Suspend Shop"}
                                  className={`size-8 rounded-lg border flex items-center justify-center transition-colors ${
                                    shop.status === "suspended"
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-[#00E676] hover:bg-emerald-500/20"
                                      : "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                  }`}
                                >
                                  {shop.status === "suspended" ? (
                                    <Play className="size-3.5 fill-current" />
                                  ) : (
                                    <PauseCircle className="size-3.5" />
                                  )}
                                </button>

                                {confirmResetShopId === shop.id ? (
                                  /* Inline confirm strip */
                                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1">
                                    <span className="text-[10px] text-amber-300 font-semibold whitespace-nowrap">Reset?</span>
                                    <button
                                      type="button"
                                      onClick={() => handleResetShopAnalytics(shop)}
                                      className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-400 px-2 py-0.5 rounded transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmResetShopId(null)}
                                      className="text-[10px] font-bold text-slate-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmResetShopId(shop.id)}
                                    title="Reset Shop Analytics"
                                    disabled={resettingAnalyticsId === shop.id}
                                    className="size-8 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                                  >
                                    {resettingAnalyticsId === shop.id ? (
                                      <div className="size-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                                    ) : (
                                      <RotateCcw className="size-3.5" />
                                    )}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteShop(shop)}
                                  title="Delete Shop"
                                  className="size-8 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAFF TAB ================= */}
        {activeTab === "staff" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="font-display text-lg font-bold text-white">Staff Management</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#0D131F] overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0A0F1A] border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[11px]">
                  <tr>
                    <th className="p-4">NAME & EMAIL</th>
                    <th className="p-4">ROLE</th>
                    <th className="p-4">ASSIGNED SHOP</th>
                    <th className="p-4">CREATED DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-800/30">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{st.name}</p>
                          <p className="text-slate-400 text-xs">{st.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-[#FFC45A] border border-amber-500/30 capitalize">
                            {st.role}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 font-medium">All Platform Shops</td>
                        <td className="p-4 text-slate-400">{formatDate(st.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PAYMENTS TAB ================= */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentsSubTab("plans")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    paymentsSubTab === "plans"
                      ? "bg-amber-500/15 text-[#FFC45A] border-amber-500/40"
                      : "bg-[#0D131F] text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <CreditCard className="size-3.5 inline-block mr-1.5" />
                  Subscription Plans & Price Settings (₹)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentsSubTab("logs")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    paymentsSubTab === "logs"
                      ? "bg-amber-500/15 text-[#FFC45A] border-amber-500/40"
                      : "bg-[#0D131F] text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <DollarSign className="size-3.5 inline-block mr-1.5" />
                  Razorpay & Manual Payment Logs ({paymentLogs.length})
                </button>
              </div>

              {paymentsSubTab === "plans" && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAddCustomPlan}
                    size="sm"
                    className="h-9 px-3.5 text-xs font-extrabold rounded-xl bg-[#FFC45A] text-[#080C14] hover:bg-[#FFC45A]/90"
                  >
                    + Add Custom Plan
                  </Button>

                  <Button
                    onClick={handleSaveAllPlans}
                    disabled={savingPlans}
                    size="sm"
                    className="h-9 px-3.5 text-xs font-extrabold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                  >
                    {savingPlans ? "Syncing..." : "Save All Prices & Real-Time Sync"}
                  </Button>
                </div>
              )}
            </div>

            {paymentsSubTab === "plans" ? (
              <>
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0D131F] to-[#0D131F] p-4 sm:p-5">
                  <h3 className="font-display text-base font-extrabold text-[#FFC45A] flex items-center gap-2">
                    <RefreshCw className="size-4" /> Platform Plans & Rupee (₹) Price Management
                  </h3>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Set custom plan prices in Rupees (₹), edit plan details, or add new subscription tiers. Updates automatically synchronize in real-time across the User Dashboard, Website Pricing Page, and Razorpay Payment Gateway.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 space-y-4 shadow-xl">
                  <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="size-4 text-[#00E676]" /> Gateway & Manual Payment Settings
                  </h4>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                    <div>
                      <label className="text-xs font-bold text-white block">Enable Razorpay Integration</label>
                      <p className="text-[11px] text-slate-400">
                        Toggle live Razorpay checkout. When OFF, users will see manual UPI payment instructions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRazorpay(!razorpayEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        razorpayEnabled ? "bg-[#00E676]" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          razorpayEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-slate-300">
                      Manual UPI ID (Used when Razorpay is OFF)
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        value={manualUpiId}
                        onChange={(e) => setManualUpiId(e.target.value)}
                        className="h-10 max-w-md bg-[#080C14] border-slate-800 text-xs font-mono text-white rounded-xl"
                      />
                      <Button
                        onClick={handleSaveGatewaySettings}
                        disabled={savingGateway}
                        className="h-10 px-4 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                      >
                        {savingGateway ? "Syncing..." : "Save All Gateway & Coupon Settings"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Coupon Codes & Promotions Manager Section */}
                <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                        <Tag className="size-4 text-[#FFC45A]" /> Coupon Codes & Discount Promotions
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Create promo codes for plan purchases. Syncs automatically with user checkout, dashboard, and website pricing.
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveGatewaySettings}
                      disabled={savingGateway}
                      size="sm"
                      className="h-8 px-3 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                    >
                      {savingGateway ? "Syncing..." : "Save & Sync Coupons"}
                    </Button>
                  </div>

                  {/* Create New Coupon Form */}
                  <div className="p-4 rounded-xl border border-slate-800/80 bg-[#080C14] space-y-3">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      + Create New Promo Coupon
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400">Coupon Code</Label>
                        <Input
                          placeholder="e.g. SAVE50"
                          value={newCpnCode}
                          onChange={(e) => setNewCpnCode(e.target.value.toUpperCase())}
                          className="h-9 text-xs font-mono font-bold bg-[#0D131F] border-slate-800 text-white rounded-xl uppercase"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400">Discount Type</Label>
                        <select
                          value={newCpnType}
                          onChange={(e) => setNewCpnType(e.target.value as "percent" | "fixed")}
                          className="h-9 w-full px-3 text-xs font-bold bg-[#0D131F] border border-slate-800 text-white rounded-xl focus:border-[#00E676]"
                        >
                          <option value="percent">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400">
                          {newCpnType === "percent" ? "Discount (%)" : "Discount Amount (₹)"}
                        </Label>
                        <Input
                          type="number"
                          value={newCpnValue}
                          onChange={(e) => setNewCpnValue(Number(e.target.value))}
                          className="h-9 text-xs font-bold bg-[#0D131F] border-slate-800 text-white rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400">Max Usage Limit</Label>
                        <Input
                          type="number"
                          value={newCpnMaxUses}
                          onChange={(e) => setNewCpnMaxUses(Number(e.target.value))}
                          className="h-9 text-xs font-bold bg-[#0D131F] border-slate-800 text-white rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px] font-semibold text-slate-400">Notes / Description</Label>
                        <Input
                          placeholder="e.g. Festival Launch Offer"
                          value={newCpnNotes}
                          onChange={(e) => setNewCpnNotes(e.target.value)}
                          className="h-9 text-xs bg-[#0D131F] border-slate-800 text-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleAddCoupon}
                        className="h-9 px-4 text-xs font-bold rounded-xl bg-[#FFC45A] text-[#080C14] hover:bg-[#FFC45A]/90"
                      >
                        + Add Coupon Code
                      </Button>
                    </div>
                  </div>

                  {/* Active Coupons List */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0A0F1A]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#080C14] border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">COUPON CODE</th>
                          <th className="py-3 px-4">DISCOUNT</th>
                          <th className="py-3 px-4">REDEEMED / LIMIT</th>
                          <th className="py-3 px-4">NOTES</th>
                          <th className="py-3 px-4">STATUS</th>
                          <th className="py-3 px-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {couponsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500">
                              No coupon codes created yet. Create your first promo code above!
                            </td>
                          </tr>
                        ) : (
                          couponsList.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-mono font-extrabold text-white text-xs">
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[#FFC45A]">
                                  {c.code}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-extrabold text-[#00E676]">
                                {c.discount_type === "percent" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                              </td>

                              <td className="py-3 px-4 font-mono text-slate-300">
                                {c.used_count || 0} / {c.max_uses ? c.max_uses : "∞"}
                              </td>

                              <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[200px]">
                                {c.notes || "—"}
                              </td>

                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCouponActive(c.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize cursor-pointer transition-colors ${
                                    c.is_active
                                      ? "bg-emerald-500/15 text-[#00E676] border border-emerald-500/30"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                  }`}
                                >
                                  {c.is_active ? "Active" : "Disabled"}
                                </button>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCoupon(c)}
                                    className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
                                    title="Edit Coupon Parameters"
                                  >
                                    <Edit2 className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCoupon(c.id)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    title="Delete Coupon"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plansForm.map((p, idx) => {
                    const isPopular = Boolean(p.highlight || p.badge === "MOST POPULAR");

                    return (
                      <div
                        key={p.id}
                        className={`relative rounded-2xl border p-5 flex flex-col justify-between bg-[#0D131F] transition-all ${
                          isPopular ? "border-amber-500/80 shadow-lg shadow-amber-500/10" : "border-slate-800"
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#FFC45A] text-[#080C14] font-extrabold text-[10px] uppercase tracking-wider">
                            MOST POPULAR
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display text-xl font-bold text-white capitalize">{p.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              {p.id}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPlansForm((prev) =>
                                prev.map((item, i) => {
                                  const { badge, ...rest } = item;
                                  return i === idx
                                    ? { ...item, highlight: true, badge: "MOST POPULAR" }
                                    : { ...rest, highlight: false };
                                })
                              );
                            }}
                            className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isPopular
                                ? "bg-amber-500/15 text-[#FFC45A] border-amber-500/50"
                                : "bg-[#080C14] text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            {isPopular ? "⭐ MOST POPULAR Plan" : "Set as MOST POPULAR"}
                          </button>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-slate-400 font-medium">
                                Monthly (₹/mo)
                              </Label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2.5 font-bold text-white text-xs">₹</span>
                                <Input
                                  type="number"
                                  value={p.priceNumber ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPlansForm((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              priceNumber: val,
                                              price: `₹${val}`,
                                              yearlyPriceNumber: item.yearlyPriceNumber || val * 10,
                                              yearlyPrice: `₹${(item.yearlyPriceNumber || val * 10).toLocaleString("en-IN")}`,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="pl-6 h-9 text-xs font-bold bg-[#080C14] border-slate-800 text-white rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-slate-400 font-medium">
                                Annual (₹/yr)
                              </Label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-2.5 font-bold text-amber-400 text-xs">₹</span>
                                <Input
                                  type="number"
                                  value={p.yearlyPriceNumber ?? (p.priceNumber ? p.priceNumber * 10 : 0)}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPlansForm((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              yearlyPriceNumber: val,
                                              yearlyPrice: `₹${val.toLocaleString("en-IN")}`,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="pl-6 h-9 text-xs font-bold bg-[#080C14] border-slate-800 text-amber-400 rounded-xl"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-slate-400 font-medium">
                              Annual Bonus Extra Months (e.g. 2 Mos Free)
                            </Label>
                            <Input
                              type="number"
                              value={p.extraMonths ?? 2}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPlansForm((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, extraMonths: val } : item))
                                );
                              }}
                              className="h-9 text-xs font-bold bg-[#080C14] border-slate-800 text-emerald-400 rounded-xl"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-slate-400 font-medium">Tagline</Label>
                            <Input
                              value={p.tagline}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPlansForm((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, tagline: val } : item))
                                );
                              }}
                              className="h-9 text-xs bg-[#080C14] border-slate-800 text-slate-200 rounded-xl"
                            />
                          </div>

                          <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                                Features Included ({p.features.length})
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setPlansForm((prev) =>
                                    prev.map((item, i) =>
                                      i === idx
                                        ? { ...item, features: [...item.features, "New feature item"] }
                                        : item
                                    )
                                  );
                                }}
                                className="text-[10px] font-bold text-[#00E676] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="size-3" /> Add Feature
                              </button>
                            </div>

                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {p.features.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5">
                                  <Check className="size-3.5 text-[#00E676] shrink-0" />
                                  <Input
                                    value={feat}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPlansForm((prev) =>
                                        prev.map((item, i) => {
                                          if (i !== idx) return item;
                                          const newFeats = [...item.features];
                                          newFeats[fIdx] = val;
                                          return { ...item, features: newFeats };
                                        })
                                      );
                                    }}
                                    className="h-8 text-xs bg-[#080C14] border-slate-800 text-slate-200 rounded-lg focus:border-[#00E676]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPlansForm((prev) =>
                                        prev.map((item, i) => {
                                          if (i !== idx) return item;
                                          const newFeats = item.features.filter((_, fIndex) => fIndex !== fIdx);
                                          return { ...item, features: newFeats };
                                        })
                                      );
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                                    title="Delete Feature Line"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-[#0D131F] overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0F1A] border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[11px]">
                    <tr>
                      <th className="p-4">INVOICE ID</th>
                      <th className="p-4">SHOP</th>
                      <th className="p-4">AMOUNT</th>
                      <th className="p-4">PLAN</th>
                      <th className="p-4">METHOD</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paymentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No payment transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      paymentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="p-4 font-mono text-slate-300">{log.invoice_id}</td>
                          <td className="p-4 font-bold text-white">{log.shop_name || "Platform Shop"}</td>
                          <td className="p-4 font-extrabold text-[#00E676]">₹{log.amount}</td>
                          <td className="p-4 capitalize">{log.plan}</td>
                          <td className="p-4 uppercase text-slate-400">{log.payment_method || "Razorpay"}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-[#00E676] border border-emerald-500/30">
                              {log.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{formatDate(log.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= REVIEWS TAB ================= */}
        {activeTab === "reviews" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h2 className="font-display text-lg font-bold text-white">Google Review Links Manager</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#0D131F] p-5 shadow-xl space-y-3">
              {shops.map((shop) => {
                const googleLink = (shop.features as any)?.google_review_link;
                return (
                  <div
                    key={shop.id}
                    className="p-4 rounded-xl border border-slate-800 bg-[#080C14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{shop.name}</p>
                      <p className="text-slate-400 text-xs font-mono">/shop/{shop.slug}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        readOnly
                        value={googleLink || "Not configured by owner"}
                        className="h-9 w-full sm:w-72 bg-[#0D131F] border-slate-800 text-xs text-slate-300 rounded-xl"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openManageModal(shop, "info")}
                        className="h-9 px-3 text-xs font-bold rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ================= MANAGE SHOP MODAL (Matching Screenshots 1, 2, 3, 4) ================= */}
      <Dialog open={!!managingShop} onOpenChange={(open) => !open && setManagingShop(null)}>
        <DialogContent className="max-w-3xl rounded-2xl bg-[#0D131F] border border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl">
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0A0F1A]">
            <DialogTitle className="font-display text-xl font-bold text-white flex items-center gap-2">
              Manage — {managingShop?.name}
            </DialogTitle>

            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-[#FFC45A] font-extrabold text-xs font-mono">
              ID: BIZ-{managingShop?.slug.substring(0, 6).toUpperCase()}-{managingShop?.id.substring(0, 4).toUpperCase()}
            </span>
          </div>

          {/* Sub-Navigation Tabs Bar */}
          <div className="px-5 py-2.5 border-b border-slate-800 bg-[#080C14] flex items-center gap-2 overflow-x-auto">
            {[
              { id: "info", label: "Info", icon: Home },
              { id: "login", label: "Customer Login", icon: Key },
              { id: "subscription", label: "Subscription", icon: CreditCard },
              { id: "payment", label: "Payment", icon: DollarSign },
              { id: "features", label: "Feature Access", icon: Shield },
              { id: "actions", label: "Actions", icon: Play },
            ].map((t) => {
              const Icon = t.icon;
              const active = modalTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setModalTab(t.id as ManageModalTab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    active
                      ? "bg-[#00E676] text-[#080C14] shadow-md shadow-[#00E676]/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-5">
            {/* SUB-TAB 1: SUBSCRIPTION (Screenshot 1) */}
            {modalTab === "subscription" && (
              <div className="space-y-5 text-xs animate-in fade-in duration-150">
                {/* Plan & Payment Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 font-semibold">Current Plan</Label>
                    <select
                      value={editPlan}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="h-10 w-full px-3 bg-[#080C14] border border-slate-800 text-white rounded-xl font-bold focus:border-[#00E676] capitalize"
                    >
                      {plansForm.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300 font-semibold">Payment Status</Label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      className="h-10 w-full px-3 bg-[#080C14] border border-slate-800 text-white rounded-xl font-bold focus:border-[#00E676]"
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 font-semibold">Start Date</Label>
                    <Input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="h-10 bg-[#080C14] border-slate-800 text-white rounded-xl font-bold text-xs"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 font-semibold">End Date</Label>
                    <Input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="h-10 bg-[#080C14] border-slate-800 text-white rounded-xl font-bold text-xs"
                    />
                  </div>
                </div>

                {/* Quick Date Setter Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSetMonths(customMonths)}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-800 bg-[#080C14] text-slate-200 hover:bg-slate-800"
                  >
                    <Calendar className="size-3.5 mr-1.5" /> Set {customMonths} month{customMonths > 1 ? "s" : ""}
                  </Button>

                  <Input
                    type="number"
                    min={1}
                    max={36}
                    value={customMonths}
                    onChange={(e) => setCustomMonths(Number(e.target.value))}
                    className="h-9 w-16 text-center bg-[#080C14] border-slate-800 text-white font-bold rounded-xl text-xs"
                  />

                  <Button
                    type="button"
                    onClick={handleSaveBilling}
                    disabled={savingShop}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                  >
                    {savingShop ? "Saving..." : "Save Billing"}
                  </Button>
                </div>

                {/* Status Alert Banner */}
                {editPaymentStatus === "paid" ? (
                  <p className="text-xs font-semibold text-[#00E676] flex items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#00E676]">
                      Paid
                    </span>{" "}
                    ₹{editAmountPaid} recorded <CheckCircle2 className="size-3.5" /> Public access available
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-rose-400 pt-1">
                    An expired shop is automatically suspended and no longer appears publicly.
                  </p>
                )}

                {/* Subscription Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">BILLING CYCLE</p>
                    <p className="font-extrabold text-white text-sm mt-1 capitalize">{editBillingCycle}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">NEXT BILLING</p>
                    <p className="font-extrabold text-slate-300 text-sm mt-1">{editEndDate ? formatDate(editEndDate) : "—"}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">DAYS REMAINING</p>
                    <p className="font-extrabold text-[#00E676] text-sm mt-1">
                      {daysRemaining(shopPreviewForMetrics)} Days
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">GRACE PERIOD</p>
                    <p className="font-extrabold text-white text-sm mt-1">{gracePeriodDays} Days</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">AUTO RENEW</p>
                    <p className="font-extrabold text-white text-sm mt-1">{autoRenew ? "Yes" : "No"}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">SUBSCRIPTION STATE</p>
                    <p className="font-extrabold text-[#00E676] text-sm mt-1 capitalize">
                      {subscriptionStateLabel(subscriptionState(shopPreviewForMetrics))}
                    </p>
                  </div>
                </div>

                {/* Renewal & Grace Settings Box (Screenshot 1) */}
                <div className="rounded-2xl border border-slate-800 bg-[#080C14] p-5 space-y-4">
                  <h4 className="font-display text-xs font-bold text-slate-300 uppercase tracking-wider">
                    RENEWAL & GRACE SETTINGS
                  </h4>

                  <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0D131F] flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-xs">Auto Renew</p>
                      <p className="text-[11px] text-slate-400">Automatically renew subscription on expiry</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAutoRenew(!autoRenew)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        autoRenew ? "bg-[#00E676]" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition duration-200 ${
                          autoRenew ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#0D131F] flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-xs">Grace Period (days)</p>
                      <p className="text-[11px] text-slate-400">Days the shop stays active after expiry before suspension</p>
                    </div>

                    <Input
                      type="number"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                      className="h-9 w-20 text-center bg-[#080C14] border-slate-800 text-white font-bold text-xs rounded-xl"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveBilling}
                      disabled={savingShop}
                      className="h-9 px-4 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: PAYMENT (Screenshot 2) */}
            {modalTab === "payment" && (
              <div className="space-y-5 text-xs animate-in fade-in duration-150">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">PAYMENT STATUS</p>
                    <span
                      className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize ${
                        editPaymentStatus === "paid"
                          ? "bg-emerald-500/15 text-[#00E676] border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {editPaymentStatus}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">AMOUNT</p>
                    <p className="font-extrabold text-white text-base mt-1">₹{editAmountPaid}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">PLAN</p>
                    <p className="font-extrabold text-white text-sm mt-1 capitalize">{editPlan}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#080C14]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">BILLING CYCLE</p>
                    <p className="font-extrabold text-white text-sm mt-1 capitalize">{editBillingCycle}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-1.5 pt-1">
                  <Label className="text-slate-300 font-semibold">Admin Notes</Label>
                  <Textarea
                    placeholder="Optional notes for this action..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="bg-[#080C14] border-slate-800 text-white text-xs rounded-xl h-20"
                  />
                </div>

                {/* Payment History */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider">
                    PAYMENT HISTORY
                  </h4>
                  <p className="text-slate-500 text-xs italic">No payment records yet.</p>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: FEATURE ACCESS OVERRIDES (Screenshot 3) */}
            {modalTab === "features" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-150">
                {/* Header Banner */}
                <div className="rounded-2xl border border-slate-800 bg-[#080C14] p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="size-4 text-[#00E676]" /> Feature Access Overrides
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Toggle features on/off for this shop, overriding the plan defaults.
                    </p>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00E676] font-extrabold text-[11px] capitalize">
                    {editPlan} Plan
                  </span>
                </div>

                {/* 18 Toggles List */}
                <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                  {FEATURE_KEYS.map((key) => {
                    const label = FEATURE_LABELS[key];
                    const isEnabled = featureOverrides[key] !== false;

                    return (
                      <div
                        key={key}
                        className="p-3 rounded-xl border border-slate-800 bg-[#080C14] flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold text-white">{label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {isEnabled ? "Plan default enabled" : "Admin override disabled"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setFeatureOverrides((prev) => ({
                              ...prev,
                              [key]: !isEnabled,
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            isEnabled ? "bg-[#00E676]" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow transition duration-200 ${
                              isEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Reset Action */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const defaults = planOf(editPlan) as Record<string, any>;
                      const resetObj: Record<string, boolean> = {};
                      for (const key of FEATURE_KEYS) {
                        resetObj[key] = Boolean(defaults[key]);
                      }
                      setFeatureOverrides(resetObj);
                      toast.info(`Reset feature access to ${editPlan} plan defaults! All plan features unlocked.`);
                    }}
                    className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-800 bg-[#080C14] text-slate-300 hover:text-white"
                  >
                    <RotateCcw className="size-3.5 mr-1.5" /> Reset All to Plan Defaults
                  </Button>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: ACTIONS (Screenshot 4) */}
            {modalTab === "actions" && (
              <div className="space-y-5 text-xs animate-in fade-in duration-150">
                {/* Suspended Alert Banner */}
                {(managingShop?.status === "suspended" || managingShop?.status === "cancelled") && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="size-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white">Account is currently {managingShop.status}</p>
                        <p className="text-[11px] text-rose-200/80">Public menu & shop owner dashboard access are currently disabled.</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleActionActivate}
                      disabled={savingShop}
                      className="h-8 px-3.5 text-xs font-extrabold rounded-lg bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90 shadow-md shadow-[#00E676]/20 shrink-0"
                    >
                      <Play className="size-3 mr-1.5 fill-current" /> Activate Now
                    </Button>
                  </div>
                )}

                {/* Payment Actions */}
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider">
                    PAYMENT ACTIONS
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      onClick={handleActionMarkPaid}
                      disabled={savingShop}
                      className="h-9 px-4 text-xs font-extrabold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                    >
                      <CheckCircle2 className="size-3.5 mr-1.5" /> Mark as Paid
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleActionMarkPending}
                      disabled={savingShop}
                      className="h-9 px-4 text-xs font-extrabold rounded-xl border-amber-500/40 text-[#FFC45A] bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <Clock className="size-3.5 mr-1.5" /> Mark as Pending
                    </Button>
                  </div>
                </div>

                {/* Subscription Actions */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider">
                    SUBSCRIPTION ACTIONS
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      onClick={handleActionActivate}
                      disabled={savingShop}
                      className="h-9 px-4 text-xs font-extrabold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90 shadow-md shadow-[#00E676]/20"
                    >
                      <Play className="size-3.5 mr-1.5 fill-current" /> Activate Account
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleActionExtendSub(1)}
                      disabled={savingShop}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
                    >
                      <Calendar className="size-3.5 mr-1.5" /> Extend Subscription
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleActionSuspend}
                      disabled={savingShop}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-amber-500/40 text-[#FFC45A] bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <PauseCircle className="size-3.5 mr-1.5" /> Suspend Shop
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleActionCancelSub}
                      disabled={savingShop}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                    >
                      <XCircle className="size-3.5 mr-1.5" /> Cancel Subscription
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => managingShop && handleResetShopAnalytics(managingShop)}
                      disabled={savingShop}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-amber-500/40 text-[#FFC45A] bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" /> Reset Analytics
                    </Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-display text-xs font-bold text-rose-400 uppercase tracking-wider">
                    DANGER ZONE
                  </h4>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (managingShop) handleDeleteShop(managingShop);
                    }}
                    disabled={savingShop}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700"
                  >
                    <Trash2 className="size-3.5 mr-1.5" /> Delete Shop Permanently
                  </Button>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-slate-400 text-xs">Notes (optional)</Label>
                  <Input
                    placeholder="Reason for this action..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="h-10 bg-[#080C14] border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 5: INFO (Screenshot 3 of earlier turn) */}
            {modalTab === "info" && (
              <div className="space-y-4 text-xs animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-medium">Shop Name</Label>
                    <Input
                      value={editShopName}
                      onChange={(e) => setEditShopName(e.target.value)}
                      className="h-10 bg-[#080C14] border-slate-800 text-white rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-medium">Slug</Label>
                    <Input
                      value={editShopSlug}
                      onChange={(e) => setEditShopSlug(e.target.value)}
                      className="h-10 bg-[#080C14] border-slate-800 text-white rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-medium">Niche</Label>
                    <select
                      value={editShopNiche}
                      onChange={(e) => setEditShopNiche(e.target.value)}
                      className="h-10 w-full px-3 bg-[#080C14] border border-slate-800 text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-[#00E676]"
                    >
                      <option value="Restaurant">Restaurant</option>
                      <option value="Salon">Salon</option>
                      <option value="Retail">Retail</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Hotel">Hotel</option>
                      <option value="System">System</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-medium uppercase text-[10px]">BUSINESS ID</Label>
                    <div className="h-10 px-3 bg-[#080C14] border border-slate-800/80 rounded-xl flex items-center font-bold font-mono text-white text-xs">
                      BIZ-{managingShop?.slug.substring(0, 6).toUpperCase()}-{managingShop?.id.substring(0, 4).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label className="text-slate-300 font-semibold">Google Review Link</Label>
                  <Input
                    placeholder="Not set — owner can add this in Shop Settings."
                    value={editGoogleReviewLink}
                    onChange={(e) => setEditGoogleReviewLink(e.target.value)}
                    className="h-10 bg-[#080C14] border-slate-800 text-white text-xs rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB: CUSTOMER LOGIN */}
            {modalTab === "login" && (
              <div className="space-y-5 text-xs animate-in fade-in duration-150">
                {/* Customer & Account Info Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#080C14] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                        <Users className="size-4 text-[#00E676]" /> Customer & Account Info
                      </h4>
                      <p className="text-slate-400 text-[11px] mt-0.5">Owner registration details and login identity.</p>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00E676] font-extrabold text-[11px]">
                      Verified Owner
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">SHOP NAME</p>
                      <p className="font-extrabold text-white text-sm mt-1">{managingShop?.name}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">OWNER USER ID</p>
                      <p className="font-mono text-[#00E676] text-xs mt-1 truncate">{managingShop?.owner_id}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">PRIMARY PHONE</p>
                      <Input
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="h-8 mt-1 bg-[#080C14] border-slate-800 text-white font-bold text-xs rounded-lg"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">WHATSAPP CONTACT</p>
                      <Input
                        value={ownerWhatsapp}
                        onChange={(e) => setOwnerWhatsapp(e.target.value)}
                        className="h-8 mt-1 bg-[#080C14] border-slate-800 text-white font-bold text-xs rounded-lg"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CREATED DATE</p>
                      <p className="font-extrabold text-white text-xs mt-1">
                        {managingShop ? formatDate(managingShop.created_at) : "—"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0D131F] border border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">PLATFORM ROLE</p>
                      <p className="font-extrabold text-white text-xs mt-1">Shop Owner</p>
                    </div>
                  </div>
                </div>

                {/* Customer Login Credentials Card */}
                <div className="rounded-2xl border border-slate-800 bg-[#080C14] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <Key className="size-4 text-[#FFC45A]" /> Customer Login Credentials
                    </h4>

                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#FFC45A] font-extrabold text-[10px] uppercase tracking-wider">
                      VISIBLE TO SUPER ADMIN
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Customer Login Email */}
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs font-medium">Customer Login Email</Label>
                      <div className="flex gap-2">
                        <Input
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="h-10 bg-[#0D131F] border-slate-800 text-[#00E676] font-mono text-xs rounded-xl"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(customerEmail);
                            toast.success("Copied customer email to clipboard!");
                          }}
                          className="h-10 px-3 border-slate-800 bg-[#0D131F] text-slate-300 hover:text-white rounded-xl"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Customer Account Password */}
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs font-medium">Customer Account Password</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={customerPassword}
                            onChange={(e) => setCustomerPassword(e.target.value)}
                            className="h-10 pr-10 bg-[#0D131F] border-slate-800 text-amber-400 font-mono text-xs rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(customerPassword);
                            toast.success("Copied customer password to clipboard!");
                          }}
                          className="h-10 px-3 border-slate-800 bg-[#0D131F] text-slate-300 hover:text-white rounded-xl"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <Button
                      type="button"
                      disabled={savingShop}
                      onClick={async () => {
                        if (!managingShop) return;
                        setSavingShop(true);
                        try {
                          // Update shop phone & whatsapp
                          await supabase
                            .from("shops")
                            .update({
                              phone: ownerPhone,
                              whatsapp: ownerWhatsapp,
                            })
                            .eq("id", managingShop.id);

                          // Update profile email if changed
                          if (managingShop.owner_id && customerEmail && !customerEmail.endsWith("@mylinkqr.com")) {
                            await supabase
                              .from("profiles")
                              .update({ email: customerEmail })
                              .eq("id", managingShop.owner_id);
                          }

                          toast.success(`✅ Login account synced for "${managingShop.name}"!`);
                          syncAll(managingShop.id, managingShop.owner_id);
                        } catch (err) {
                          toast.error("Failed to sync customer account");
                        } finally {
                          setSavingShop(false);
                        }
                      }}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
                    >
                      <Check className="size-3.5 mr-1.5" /> Activate & Sync Login Account
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={savingShop}
                      onClick={async () => {
                        if (!customerEmail || customerEmail.endsWith("@mylinkqr.com")) {
                          toast.error("No real email found for this account. Update the email first.");
                          return;
                        }
                        setSavingShop(true);
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(customerEmail, {
                            redirectTo: `${window.location.origin}/auth/reset-password`,
                          });
                          if (error) throw error;
                          toast.success(`✅ Password reset email sent to ${customerEmail}!`);
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to send reset email");
                        } finally {
                          setSavingShop(false);
                        }
                      }}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-amber-500/40 text-[#FFC45A] bg-amber-500/10 hover:bg-amber-500/20"
                    >
                      <RefreshCw className="size-3.5 mr-1.5" /> Send Password Reset Email
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const fullInfo = `Shop: ${managingShop?.name}\nEmail: ${customerEmail}\nPassword: ${customerPassword}\nOwner ID: ${managingShop?.owner_id}`;
                        navigator.clipboard.writeText(fullInfo);
                        toast.success("Copied full customer login info!");
                      }}
                      className="h-9 px-3.5 text-xs font-bold rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
                    >
                      <Copy className="size-3.5 mr-1.5" /> Copy Full Login Info
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800 bg-[#0A0F1A] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagingShop(null)}
              className="h-10 px-4 text-xs font-bold rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSaveBilling}
              disabled={savingShop}
              className="h-10 px-5 text-xs font-extrabold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90 shadow-md shadow-[#00E676]/20"
            >
              {savingShop ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="sm:max-w-md bg-[#0D131F] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="size-4 text-[#FFC45A]" /> Edit Coupon — {editingCoupon?.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-slate-300 font-semibold">Coupon Code</Label>
              <Input
                value={editCpnCode}
                onChange={(e) => setEditCpnCode(e.target.value.toUpperCase())}
                className="h-10 bg-[#080C14] border-slate-800 text-white font-mono font-bold uppercase rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Discount Type</Label>
                <select
                  value={editCpnType}
                  onChange={(e) => setEditCpnType(e.target.value as "percent" | "fixed")}
                  className="h-10 w-full px-3 bg-[#080C14] border border-slate-800 text-white font-bold rounded-xl focus:border-[#00E676]"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">
                  {editCpnType === "percent" ? "Discount (%)" : "Discount Amount (₹)"}
                </Label>
                <Input
                  type="number"
                  value={editCpnValue}
                  onChange={(e) => setEditCpnValue(Number(e.target.value))}
                  className="h-10 bg-[#080C14] border-slate-800 text-white font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Max Usage Limit</Label>
                <Input
                  type="number"
                  value={editCpnMaxUses}
                  onChange={(e) => setEditCpnMaxUses(Number(e.target.value))}
                  className="h-10 bg-[#080C14] border-slate-800 text-white font-bold rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 font-semibold">Status</Label>
                <select
                  value={editCpnActive ? "active" : "disabled"}
                  onChange={(e) => setEditCpnActive(e.target.value === "active")}
                  className="h-10 w-full px-3 bg-[#080C14] border border-slate-800 text-white font-bold rounded-xl focus:border-[#00E676]"
                >
                  <option value="active">Active (Usable in Checkout)</option>
                  <option value="disabled">Disabled (Blocked)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 font-semibold">Notes / Description</Label>
              <Input
                placeholder="e.g. 50% OFF promotional offer"
                value={editCpnNotes}
                onChange={(e) => setEditCpnNotes(e.target.value)}
                className="h-10 bg-[#080C14] border-slate-800 text-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCoupon(null)}
                className="h-9 px-4 text-xs font-bold rounded-xl border-slate-800 bg-[#080C14] text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEditedCoupon}
                className="h-9 px-4 text-xs font-bold rounded-xl bg-[#00E676] text-[#080C14] hover:bg-[#00E676]/90"
              >
                Save Coupon Changes & Sync
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
