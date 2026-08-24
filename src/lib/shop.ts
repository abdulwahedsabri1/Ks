export type Plan = "trial" | "basic" | "pro" | "premium";
export type ShopStatus = "active" | "suspended" | "expired";
export type PaymentStatus =
  "paid" | "pending" | "overdue" | "not_paid" | "refunded" | "partially_paid";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionState =
  "active" | "payment_pending" | "grace_period" | "expired" | "suspended" | "cancelled";

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: "paid", label: "Paid", color: "emerald" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "not_paid", label: "Not Paid", color: "slate" },
  { value: "refunded", label: "Refunded", color: "blue" },
  { value: "partially_paid", label: "Partially Paid", color: "orange" },
];

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const PLAN_PRICE_YEARLY: Record<string, number> = { basic: 1999, pro: 4999, premium: 9999 };

export type Shop = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  niche: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  theme_color: string;
  plan: string;
  status: string;
  created_at: string;
  plan_started_at?: string | null;
  plan_expires_at?: string | null;
  payment_status?: string | null;
  amount_paid?: number | null;
  features?: Record<string, any> | null;
  billing_cycle?: string | null;
  grace_period_days?: number | null;
  next_billing_date?: string | null;
  auto_renew?: boolean | null;
};

export function shopTiming(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.["timing"] as string | undefined;
}

export function shopSocialLink(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.["social_link"] as string | undefined;
}

export function shopDeliveryEnabled(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.["delivery"] !== false;
}

export function shopTakeawayEnabled(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.["takeaway"] !== false;
}

export function shopOnTableEnabled(shop?: Pick<Shop, "features"> | null) {
  return shop?.features?.["on_table"] !== false;
}

export type ThemeId =
  | "luxury_dark"
  | "minimalist_light"
  | "warm_amber"
  | "emerald_bistro"
  | "neon_cyber"
  | "rose_gold";

export function shopTheme(shop?: Pick<Shop, "features"> | null): ThemeId {
  return (shop?.features?.["theme"] as ThemeId) || "luxury_dark";
}

export const THEME_CONFIG: Record<
  ThemeId,
  {
    bg: string;
    card: string;
    text: string;
    textMuted: string;
    textMutedHover: string;
    accent: string;
    accentText: string;
    border: string;
    selection: string;
    cartBg: string;
    cartText: string;
    cartBtn: string;
    cartBtnHover: string;
    addBtn: string;
    addBtnHover: string;
    headerGradient: string;
  }
> = {
  luxury_dark: {
    bg: "bg-[#100C09]",
    card: "bg-[#18120D]",
    text: "text-white",
    textMuted: "text-white/70",
    textMutedHover: "hover:text-white",
    accent: "bg-[#FFC45A]",
    accentText: "text-[#FFC45A]",
    border: "border-white/10",
    selection: "selection:bg-[#FFC45A] selection:text-[#100C09]",
    cartBg: "bg-[#FFC45A]",
    cartText: "text-[#100C09]",
    cartBtn: "bg-[#100C09]/10",
    cartBtnHover: "hover:bg-[#100C09]/20",
    addBtn: "bg-transparent border border-[#FFC45A]/30 text-[#FFC45A]",
    addBtnHover: "hover:bg-[#FFC45A]/10",
    headerGradient: "from-[#100C09] via-[#100C09]/60",
  },
  minimalist_light: {
    bg: "bg-[#F5F0E7]",
    card: "bg-white",
    text: "text-[#100C09]",
    textMuted: "text-[#3A2818]/70",
    textMutedHover: "hover:text-[#100C09]",
    accent: "bg-[#100C09]",
    accentText: "text-[#100C09]",
    border: "border-black/5",
    selection: "selection:bg-[#100C09] selection:text-white",
    cartBg: "bg-[#100C09]",
    cartText: "text-white",
    cartBtn: "bg-white/20",
    cartBtnHover: "hover:bg-white/30",
    addBtn: "bg-transparent border border-black/10 text-[#059669]",
    addBtnHover: "hover:bg-black/5",
    headerGradient: "from-[#F5F0E7] via-[#F5F0E7]/60",
  },
  warm_amber: {
    bg: "bg-[#FFFAF5]",
    card: "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
    text: "text-[#100C09]",
    textMuted: "text-[#100C09]/60",
    textMutedHover: "hover:text-[#100C09]",
    accent: "bg-[#D99A2B]",
    accentText: "text-[#D99A2B]",
    border: "border-[#D99A2B]/15",
    selection: "selection:bg-[#D99A2B]/20 selection:text-[#D99A2B]",
    cartBg: "bg-[#D99A2B]",
    cartText: "text-white",
    cartBtn: "bg-white/20",
    cartBtnHover: "hover:bg-white/30",
    addBtn: "bg-[#D99A2B] border-transparent text-white",
    addBtnHover: "hover:bg-[#D99A2B]/90",
    headerGradient: "from-[#FFFAF5] via-[#FFFAF5]/60",
  },
  emerald_bistro: {
    bg: "bg-[#062319]",
    card: "bg-[#0B3325]",
    text: "text-emerald-50",
    textMuted: "text-emerald-200/70",
    textMutedHover: "hover:text-white",
    accent: "bg-[#F59E0B]",
    accentText: "text-[#F59E0B]",
    border: "border-emerald-500/20",
    selection: "selection:bg-[#F59E0B] selection:text-[#062319]",
    cartBg: "bg-[#F59E0B]",
    cartText: "text-[#062319]",
    cartBtn: "bg-[#062319]/20",
    cartBtnHover: "hover:bg-[#062319]/30",
    addBtn: "bg-transparent border border-[#F59E0B]/40 text-[#F59E0B]",
    addBtnHover: "hover:bg-[#F59E0B]/10",
    headerGradient: "from-[#062319] via-[#062319]/60",
  },
  neon_cyber: {
    bg: "bg-[#0D0E15]",
    card: "bg-[#161926]",
    text: "text-cyan-50",
    textMuted: "text-cyan-200/70",
    textMutedHover: "hover:text-cyan-100",
    accent: "bg-[#06B6D4]",
    accentText: "text-[#06B6D4]",
    border: "border-cyan-500/20",
    selection: "selection:bg-[#06B6D4] selection:text-[#0D0E15]",
    cartBg: "bg-[#06B6D4]",
    cartText: "text-[#0D0E15]",
    cartBtn: "bg-[#0D0E15]/20",
    cartBtnHover: "hover:bg-[#0D0E15]/30",
    addBtn: "bg-transparent border border-[#06B6D4]/40 text-[#06B6D4]",
    addBtnHover: "hover:bg-[#06B6D4]/10",
    headerGradient: "from-[#0D0E15] via-[#0D0E15]/60",
  },
  rose_gold: {
    bg: "bg-[#FFF5F5]",
    card: "bg-white shadow-sm",
    text: "text-[#4A1D24]",
    textMuted: "text-[#8C4A54]/70",
    textMutedHover: "hover:text-[#4A1D24]",
    accent: "bg-[#E11D48]",
    accentText: "text-[#E11D48]",
    border: "border-[#E11D48]/15",
    selection: "selection:bg-[#E11D48]/20 selection:text-[#E11D48]",
    cartBg: "bg-[#E11D48]",
    cartText: "text-white",
    cartBtn: "bg-white/20",
    cartBtnHover: "hover:bg-white/30",
    addBtn: "bg-[#E11D48] border-transparent text-white",
    addBtnHover: "hover:bg-[#E11D48]/90",
    headerGradient: "from-[#FFF5F5] via-[#FFF5F5]/60",
  },
};

export type Category = {
  id: string;
  shop_id: string;
  name: string;
  position: number;
};

export type MenuItem = {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  discount_price: number | null;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller: boolean;
  position: number;
};

export const NICHES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Sweet Shop",
  "Food Truck",
  "Salon",
  "Spa",
  "Gym",
  "Hotel",
  "Resort",
  "Boutique",
  "Textile Store",
  "Jewelry Shop",
  "Grocery Store",
  "Medical Store",
  "Clinic",
  "Real Estate",
  "Electronics Store",
];

export const PLANS: {
  id: Plan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Free",
    tagline: "7-day limited trial",
    features: ["1 QR code", "Up to 5 menu items", "Up to 2 categories", "Mobile menu page"],
  },
  {
    id: "basic",
    name: "Basic",
    price: "₹99/7 days",
    tagline: "Get your first QR menu live",
    features: ["1 QR code", "Up to 50 menu items", "Mobile menu page", "Basic view counter"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹299/mo",
    tagline: "For growing shops",
    highlight: true,
    features: [
      "Unlimited categories",
      "Unlimited menu items",
      "Full analytics dashboard",
      "AI menu generator",
      "PNG / SVG / PDF QR downloads",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹499/mo",
    tagline: "Sell, not just show",
    features: [
      "Everything in Pro",
      "WhatsApp ordering",
      "Online ordering cart",
      "Custom domain",
      "Priority support",
    ],
  },
];

export const PLAN_PRICE: Record<string, number> = { trial: 0, basic: 99, pro: 299, premium: 499 };

export type PlanFeatures = {
  items: number;
  categories: number;
  ai: boolean;
  ordering: boolean;
  analytics: boolean;
  qr_downloads: boolean;
  custom_domain: boolean;
  priority_support: boolean;
};

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  trial: {
    items: 5,
    categories: 2,
    ai: false,
    ordering: false,
    analytics: false,
    qr_downloads: false,
    custom_domain: false,
    priority_support: false,
  },
  basic: {
    items: 50,
    categories: 5,
    ai: false,
    ordering: false,
    analytics: false,
    qr_downloads: false,
    custom_domain: false,
    priority_support: false,
  },
  pro: {
    items: Infinity,
    categories: Infinity,
    ai: true,
    ordering: false,
    analytics: true,
    qr_downloads: true,
    custom_domain: false,
    priority_support: false,
  },
  premium: {
    items: Infinity,
    categories: Infinity,
    ai: true,
    ordering: true,
    analytics: true,
    qr_downloads: true,
    custom_domain: true,
    priority_support: true,
  },
};

export type FeatureKey =
  "ai" | "ordering" | "analytics" | "qr_downloads" | "custom_domain" | "priority_support";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  ai: "AI menu generator & photo scan",
  ordering: "WhatsApp ordering & cart",
  analytics: "Full analytics dashboard",
  qr_downloads: "PNG / SVG / PDF QR downloads",
  custom_domain: "Custom domain",
  priority_support: "Priority support",
};

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

export function planOf(plan?: string | null): PlanFeatures {
  return PLAN_FEATURES[plan ?? "trial"] ?? PLAN_FEATURES["trial"]!;
}

/** Plan defaults merged with any per-shop feature switches set by an admin. */
export function shopFeatures(shop?: Pick<Shop, "plan" | "features"> | null): PlanFeatures {
  const base = planOf(shop?.plan);
  const overrides = shop?.features ?? {};
  const merged: PlanFeatures = { ...base };
  for (const key of FEATURE_KEYS) {
    const value = overrides[key];
    if (typeof value === "boolean") merged[key] = value;
  }
  return merged;
}

export function isExpired(shop?: Pick<Shop, "plan_expires_at"> | null) {
  if (!shop?.plan_expires_at) return false;
  return new Date(shop.plan_expires_at).getTime() < Date.now();
}

export function addMonths(from: Date, months: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function addDays(from: Date, days: number) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function daysRemaining(shop?: Pick<Shop, "plan_expires_at"> | null): number {
  if (!shop?.plan_expires_at) return Infinity;
  const diff = new Date(shop.plan_expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function subscriptionState(
  shop?: Pick<Shop, "status" | "plan_expires_at" | "payment_status" | "grace_period_days"> | null,
): SubscriptionState {
  if (!shop) return "expired";
  if (shop.status === "suspended") return "suspended";
  if (shop.status === "cancelled") return "cancelled";

  const ps = shop.payment_status ?? "not_paid";
  const expiry = shop.plan_expires_at ? new Date(shop.plan_expires_at).getTime() : null;
  const now = Date.now();
  const grace = (shop.grace_period_days ?? 7) * 86400000;

  if (ps === "pending" || ps === "overdue") return "payment_pending";

  if (expiry && expiry < now) {
    if (now - expiry < grace) return "grace_period";
    return "expired";
  }

  return "active";
}

export function subscriptionStateLabel(state: SubscriptionState): string {
  const labels: Record<SubscriptionState, string> = {
    active: "Active",
    payment_pending: "Payment Pending",
    grace_period: "Grace Period",
    expired: "Expired",
    suspended: "Suspended",
    cancelled: "Cancelled",
  };
  return labels[state];
}

export function paymentStatusColor(status?: string | null) {
  const found = PAYMENT_STATUSES.find((p) => p.value === status);
  return found?.color ?? "slate";
}

export function planAmount(plan: string, cycle: string): number {
  if (cycle === "yearly") return PLAN_PRICE_YEARLY[plan] ?? 0;
  return PLAN_PRICE[plan] ?? 0;
}

/** Public, share-safe URL for a shop menu (editor previews require a login). */
export function publicShopUrl(slug: string) {
  const path = `/shop/${slug}`;
  if (typeof window === "undefined") return path;
  const host = window.location.hostname;
  if (
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost"
  ) {
    return `https://myshop-link.lovable.app${path}`;
  }
  return `${window.location.origin}${path}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const PLAN_LIMITS: Record<string, { items: number; categories: number }> = {
  trial: { items: 5, categories: 2 },
  basic: { items: 50, categories: 5 },
  pro: { items: Infinity, categories: Infinity },
  premium: { items: Infinity, categories: Infinity },
};

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export function money(value: number, currency = "₹") {
  return `${currency}${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function detectDevice() {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export type CartLine = { item: MenuItem; qty: number };

export function buildWhatsAppOrder(
  shop: Shop,
  lines: CartLine[],
  details?: {
    name?: string;
    phone?: string;
    notes?: string;
    type?: "delivery" | "takeaway" | "on_table";
    location?: string | null;
  },
) {
  const rows = lines.map((l) => {
    const unit = l.item.discount_price ?? l.item.price;
    return `• ${l.item.name} x${l.qty} — ${money(unit * l.qty, shop.currency)}`;
  });
  const total = lines.reduce((sum, l) => sum + (l.item.discount_price ?? l.item.price) * l.qty, 0);

  const textParts = [
    `Hello ${shop.name},`,
    "",
    "I want to order:",
    ...rows,
    "",
    `Total: ${money(total, shop.currency)}`,
  ];

  if (details?.type) {
    const typeLabel =
      details.type === "delivery"
        ? "Delivery"
        : details.type === "takeaway"
          ? "Take Away"
          : "On Table";
    textParts.push(`\nOrder Type: ${typeLabel}`);
  }
  if (details?.location) {
    textParts.push(`Location: ${details.location}`);
  }
  if (details?.name) {
    textParts.push(`Name: ${details.name}`);
  }
  if (details?.phone) {
    textParts.push(`Phone: ${details.phone}`);
  }
  if (details?.notes) {
    textParts.push(`Notes: ${details.notes}`);
  }

  const text = textParts.join("\n");
  const rawNumber = shop.whatsapp || shop.phone || "";
  const number = rawNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
