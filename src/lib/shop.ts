export type Plan = "trial" | "basic" | "pro" | "premium";
export type ShopStatus = "active" | "suspended" | "expired";
export type PaymentStatus = "paid" | "pending" | "unpaid";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionState =
  "active" | "payment_pending" | "grace_period" | "expired" | "suspended" | "cancelled";

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string }[] = [
  { value: "paid", label: "Paid", color: "emerald" },
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "unpaid", label: "Unpaid", color: "red" },
];

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export type Shop = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  niche: string;
  business_id?: string | null;
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
  const val = shop?.features?.["timing"] as string | undefined;
  return val && val.trim() ? val.trim() : undefined;
}

export function shopSocialLinks(shop?: Pick<Shop, "plan" | "features"> | null) {
  const ig = (shop?.features?.["instagram_url"] || shop?.features?.["social_link"] || "") as string;
  const fb = (shop?.features?.["facebook_url"] || "") as string;
  const tw = (shop?.features?.["twitter_url"] || "") as string;
  const web = (shop?.features?.["website_url"] || "") as string;
  return {
    instagram: ig.trim(),
    facebook: fb.trim(),
    twitter: tw.trim(),
    website: web.trim(),
  };
}

export function shopMapUrl(shop?: Pick<Shop, "features"> | null) {
  const val = shop?.features?.["map_url"] as string | undefined;
  return val && val.trim() ? val.trim() : undefined;
}

export function shopGoogleReviewLink(shop?: Pick<Shop, "plan" | "features"> | null) {
  const val = shop?.features?.["google_review_link"] as string | undefined;
  return val && val.trim() ? val.trim() : undefined;
}

export function shopCartEnabled(shop?: Pick<Shop, "plan" | "features"> | null) {
  if (!shopFeatures(shop).ordering) return false;
  const val1 = shop?.features?.["cart_enabled"];
  const val2 = shop?.features?.["ordering_enabled"];
  if (val1 === false || val2 === false) return false;
  return true;
}

export function shopDeliveryEnabled(shop?: Pick<Shop, "plan" | "features"> | null) {
  if (!shopFeatures(shop).delivery) return false;
  return shop?.features?.["delivery"] !== false;
}

export function shopTakeawayEnabled(shop?: Pick<Shop, "plan" | "features"> | null) {
  if (!shopFeatures(shop).take_away) return false;
  const val1 = shop?.features?.["takeaway"];
  const val2 = shop?.features?.["take_away"];
  if (val1 === false || val2 === false) return false;
  return true;
}

export function shopOnTableEnabled(shop?: Pick<Shop, "plan" | "features"> | null) {
  if (!shopFeatures(shop).on_table) return false;
  return shop?.features?.["on_table"] !== false;
}

export function shopEnquiryEnabled(shop?: Pick<Shop, "plan" | "features"> | null) {
  if (!shopFeatures(shop).enquiry) return false;
  return shop?.features?.["enquiry"] !== false;
}

export function shopCatalogLabel(shop?: Pick<Shop, "niche" | "features"> | null): string {
  const f = shop?.features as Record<string, any> | undefined;
  const custom = f?.["catalog_label"];
  if (custom && String(custom).trim()) return String(custom).trim();

  const niche = (shop?.niche || "").toLowerCase();
  if (
    niche.includes("salon") ||
    niche.includes("spa") ||
    niche.includes("gym") ||
    niche.includes("clinic") ||
    niche.includes("medical")
  ) {
    return "Services";
  }
  if (
    niche.includes("boutique") ||
    niche.includes("textile") ||
    niche.includes("jewelry") ||
    niche.includes("grocery") ||
    niche.includes("electronics") ||
    niche.includes("real estate")
  ) {
    return "Catalog";
  }
  return "Menu";
}

export function shopItemLabel(shop?: Pick<Shop, "niche" | "features"> | null): string {
  const f = shop?.features as Record<string, any> | undefined;
  const custom = f?.["item_label"];
  if (custom && String(custom).trim()) return String(custom).trim();

  const catalog = shopCatalogLabel(shop).toLowerCase();
  if (catalog === "services" || catalog.includes("service")) return "Service";
  if (catalog === "catalog" || catalog.includes("catalog") || catalog.includes("product"))
    return "Product";
  return "Item";
}

export type OrderLabels = {
  delivery: string;
  takeaway: string;
  on_table: string;
  enquiry: string;
};

export function shopOrderLabels(shop?: Pick<Shop, "features"> | null): OrderLabels {
  const f = shop?.features as Record<string, any> | undefined;
  const del = f?.["label_delivery"];
  const tak = f?.["label_takeaway"];
  const tab = f?.["label_on_table"];
  const enq = f?.["label_enquiry"];
  return {
    delivery: del && String(del).trim() ? String(del).trim() : "Delivery",
    takeaway: tak && String(tak).trim() ? String(tak).trim() : "Take Away",
    on_table: tab && String(tab).trim() ? String(tab).trim() : "On-Table Dining",
    enquiry: enq && String(enq).trim() ? String(enq).trim() : "General Enquiry / Quote",
  };
}

export type ThemeId =
  "luxury_dark" | "minimalist_light" | "warm_amber" | "emerald_bistro" | "neon_cyber" | "rose_gold";

export function shopTheme(shop?: Pick<Shop, "plan" | "features"> | null): ThemeId {
  if (!shopFeatures(shop).themes) return "luxury_dark";
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

export type PlanItem = {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  yearlyPrice?: string;
  yearlyPriceNumber?: number;
  extraMonths?: number;
  tagline: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
  isCustom?: boolean;
};

export function parsePriceNumber(priceStr?: string | number | null): number {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  const digits = String(priceStr).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export type PlanSavings = {
  monthlyPrice: number;
  monthly12x: number;
  yearlyPrice: number;
  savingsAmount: number;
  discountPercent: number;
  effectiveMonthly: number;
};

export function calculatePlanSavings(plan: PlanItem): PlanSavings {
  const monthlyPrice = plan.priceNumber ?? parsePriceNumber(plan.price);
  const monthly12x = monthlyPrice * 12;
  const yearlyPrice =
    typeof plan.yearlyPriceNumber === "number" && plan.yearlyPriceNumber > 0
      ? plan.yearlyPriceNumber
      : parsePriceNumber(plan.yearlyPrice) || (monthlyPrice > 0 ? monthlyPrice * 10 : 0);
  const savingsAmount = Math.max(0, monthly12x - yearlyPrice);
  const discountPercent = monthly12x > 0 ? Math.round((savingsAmount / monthly12x) * 100) : 0;
  const effectiveMonthly = yearlyPrice > 0 ? Math.round(yearlyPrice / 12) : 0;

  return {
    monthlyPrice,
    monthly12x,
    yearlyPrice,
    savingsAmount,
    discountPercent,
    effectiveMonthly,
  };
}

export const PLANS: PlanItem[] = [
  {
    id: "trial",
    name: "Trial",
    price: "Free",
    priceNumber: 0,
    yearlyPrice: "Free",
    yearlyPriceNumber: 0,
    extraMonths: 0,
    tagline: "7-day limited trial",
    features: [
      "1 QR code (Standard Theme)",
      "Up to 5 menu items",
      "Up to 2 categories",
      "Mobile menu page",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "₹249/mo",
    priceNumber: 249,
    yearlyPrice: "₹2,739/yr",
    yearlyPriceNumber: 2739,
    extraMonths: 2,
    tagline: "Get your first QR menu live",
    features: [
      "Digital QR menu page",
      "6 Standard QR Code Themes",
      "Business Logo & Cover photo",
      "Instagram link",
      "Opening hours display",
      "Up to 50 menu items",
      "Basic view counter",
      "Multiple languages support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499/mo",
    priceNumber: 499,
    yearlyPrice: "₹4,790/yr",
    yearlyPriceNumber: 4790,
    extraMonths: 2,
    tagline: "For growing shops",
    highlight: true,
    badge: "MOST POPULAR",
    features: [
      "Everything in Basic",
      "12 Pro & Category QR Themes",
      "All Social media links (Facebook, X, Website)",
      "WhatsApp ordering & cart",
      "On-Table dining",
      "Take-away orders",
      "General Enquiry / Quote mode",
      "Unlimited menu items",
      "AI menu generator",
      "PNG / SVG / PDF QR downloads",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹799/mo",
    priceNumber: 799,
    yearlyPrice: "₹8,789/yr",
    yearlyPriceNumber: 8789,
    extraMonths: 2,
    tagline: "The complete business toolkit",
    highlight: false,
    features: [
      "Everything in Pro",
      "Full analytics dashboard",
      "All 18 Luxury & Custom QR Themes",
      "Delivery options",
      "Google Reviews integration",
      "Custom domain",
      "Priority support",
      "Coupon codes",
      "UPI Payments",
    ],
  },
];

export const PLAN_PRICE: Record<string, number> = { trial: 0, basic: 249, pro: 499, premium: 799 };
export const PLAN_PRICE_YEARLY: Record<string, number> = { basic: 2490, pro: 4990, premium: 7990 };

export type PlanFeatures = {
  items: number;
  categories: number;
  ai: boolean;
  ordering: boolean;
  analytics: boolean;
  qr_downloads: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  on_table: boolean;
  take_away: boolean;
  delivery: boolean;
  enquiry: boolean;
  themes: boolean;
  google_reviews: boolean;
  logo_cover: boolean;
  social_link: boolean;
  advanced_social_links: boolean;
  opening_hours: boolean;
  multi_language: boolean;
  coupons: boolean;
  upi: boolean;
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
    on_table: false,
    take_away: false,
    delivery: false,
    enquiry: false,
    themes: false,
    google_reviews: false,
    logo_cover: false,
    social_link: false,
    advanced_social_links: false,
    opening_hours: false,
    multi_language: false,
    coupons: false,
    upi: false,
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
    on_table: false,
    take_away: false,
    delivery: false,
    enquiry: false,
    themes: false,
    google_reviews: false,
    logo_cover: true,
    social_link: true,
    advanced_social_links: false,
    opening_hours: true,
    multi_language: true,
    coupons: false,
    upi: false,
  },
  pro: {
    items: Infinity,
    categories: Infinity,
    ai: true,
    ordering: true,
    analytics: false,
    qr_downloads: true,
    custom_domain: false,
    priority_support: false,
    on_table: true,
    take_away: true,
    delivery: false,
    enquiry: true,
    themes: false,
    google_reviews: false,
    logo_cover: true,
    social_link: true,
    advanced_social_links: true,
    opening_hours: true,
    multi_language: true,
    coupons: false,
    upi: false,
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
    on_table: true,
    take_away: true,
    delivery: true,
    enquiry: true,
    themes: true,
    google_reviews: true,
    logo_cover: true,
    social_link: true,
    advanced_social_links: true,
    opening_hours: true,
    multi_language: true,
    coupons: true,
    upi: true,
  },
};

export type FeatureKey =
  | "ai"
  | "ordering"
  | "analytics"
  | "qr_downloads"
  | "custom_domain"
  | "priority_support"
  | "on_table"
  | "take_away"
  | "delivery"
  | "enquiry"
  | "themes"
  | "google_reviews"
  | "logo_cover"
  | "social_link"
  | "advanced_social_links"
  | "opening_hours"
  | "multi_language"
  | "coupons"
  | "upi";

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  logo_cover: "Business logo & cover photo",
  social_link: "Instagram link",
  advanced_social_links: "Facebook, Twitter & Website links",
  opening_hours: "Opening hours display",
  ai: "AI menu generator & photo scan",
  ordering: "WhatsApp ordering & cart",
  enquiry: "General enquiry & quote request",
  analytics: "Full analytics dashboard",
  qr_downloads: "PNG / SVG / PDF QR downloads",
  custom_domain: "Custom domain",
  priority_support: "Priority support",
  on_table: "On-Table dining",
  take_away: "Take-away orders",
  delivery: "Delivery options",
  themes: "Custom themes",
  google_reviews: "Google Reviews integration",
  multi_language: "Multiple languages support",
  coupons: "Discount & Coupon codes",
  upi: "UPI payments",
};

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

export function planOf(plan?: string | null): PlanFeatures {
  if (!plan) return PLAN_FEATURES["trial"]!;
  const normalized = plan.toLowerCase().trim();
  if (normalized.includes("basic")) return PLAN_FEATURES["basic"]!;
  if (normalized.includes("pro")) return PLAN_FEATURES["pro"]!;
  if (normalized.includes("premium")) return PLAN_FEATURES["premium"]!;
  return PLAN_FEATURES[normalized] ?? PLAN_FEATURES["trial"]!;
}

export function sanitizePlanItemFeatures(plans: PlanItem[]): PlanItem[] {
  return plans.map((p) => ({
    ...p,
    features: (p.features || [])
      .map((f) => (typeof f === "string" ? f.trim() : ""))
      .filter(Boolean),
  }));
}

/** Plan defaults merged with any per-shop feature switches set by an admin. */
export function shopFeatures(shop?: Pick<Shop, "plan" | "features"> | null): PlanFeatures {
  const base = planOf(shop?.plan);
  const overrides = (shop?.features as Record<string, any>) ?? {};
  const merged: PlanFeatures = { ...base };

  for (const key of FEATURE_KEYS) {
    if (base[key] === true) {
      // Plan natively grants feature: unlock unless explicitly disabled by admin override
      merged[key] =
        overrides[`admin_disabled_${key}`] !== true && overrides[`admin_disabled`] !== true;
    } else {
      // Plan does not natively grant feature: lock unless explicitly enabled by admin override
      merged[key] = overrides[`admin_override_${key}`] === true;
    }
  }

  if (typeof overrides["items"] === "number") merged.items = overrides["items"];
  if (typeof overrides["max_items"] === "number") merged.items = overrides["max_items"];
  if (typeof overrides["categories"] === "number") merged.categories = overrides["categories"];
  if (typeof overrides["max_categories"] === "number")
    merged.categories = overrides["max_categories"];

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

export function planTotalDays(
  shop?: Pick<
    Shop,
    "plan_started_at" | "plan_expires_at" | "created_at" | "plan" | "billing_cycle"
  > | null,
): number {
  if (!shop?.plan_expires_at) return shop?.plan === "trial" ? 7 : 30;
  const startMs = shop.plan_started_at
    ? new Date(shop.plan_started_at).getTime()
    : shop.created_at
      ? new Date(shop.created_at).getTime()
      : Date.now();
  const expiryMs = new Date(shop.plan_expires_at).getTime();
  const diffMs = expiryMs - startMs;
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays > 0) return diffDays;
  return shop?.billing_cycle === "yearly" ? 365 : shop?.plan === "trial" ? 7 : 30;
}

export function planProgressPercent(
  shop?: Pick<
    Shop,
    "plan_started_at" | "plan_expires_at" | "created_at" | "plan" | "billing_cycle"
  > | null,
): number {
  if (!shop?.plan_expires_at) return 100;

  const startMs = shop.plan_started_at
    ? new Date(shop.plan_started_at).getTime()
    : shop.created_at
      ? new Date(shop.created_at).getTime()
      : Date.now();
  const expiryMs = new Date(shop.plan_expires_at).getTime();
  const nowMs = Date.now();

  if (nowMs >= expiryMs) return 0;
  if (nowMs <= startMs) return 100;

  const totalMs = expiryMs - startMs;
  if (totalMs <= 0) return 100;

  const remainingMs = expiryMs - nowMs;
  const percent = Math.round((remainingMs / totalMs) * 100);

  return Math.min(100, Math.max(0, percent));
}

export function analyticsLastResetDate(
  shop?: Pick<Shop, "created_at" | "features"> | null,
): string {
  if (!shop) return new Date().toISOString();
  const resetAt = (shop.features as Record<string, unknown> | null)?.["analytics_reset_at"] as
    string | undefined;
  if (resetAt && !isNaN(new Date(resetAt).getTime())) {
    return resetAt;
  }
  return shop.created_at || new Date().toISOString();
}

export function analyticsRemainingDays(
  shop?: Pick<Shop, "created_at" | "features"> | null,
): number {
  const lastReset = new Date(analyticsLastResetDate(shop)).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastReset);
  const cycleMs = 30 * 86400000;
  const currentCycleElapsedMs = elapsedMs % cycleMs;
  const daysLeft = Math.ceil((cycleMs - currentCycleElapsedMs) / 86400000);
  return Math.max(1, Math.min(30, daysLeft));
}

export function subscriptionState(
  shop?: Pick<Shop, "status" | "plan_expires_at" | "payment_status" | "grace_period_days"> | null,
): SubscriptionState {
  if (!shop) return "expired";
  if (shop.status === "suspended") return "suspended";
  if (shop.status === "cancelled") return "cancelled";

  const ps = shop.payment_status ?? "unpaid";
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

export function planAmount(plan: string, cycle: string, customPlans?: PlanItem[]): number {
  const normPlan = (plan || "pro").toLowerCase().trim();
  let foundItem: PlanItem | undefined;

  if (customPlans && customPlans.length > 0) {
    foundItem = customPlans.find((p) => p.id.toLowerCase() === normPlan);
  }
  if (!foundItem && typeof window !== "undefined") {
    try {
      const local = localStorage.getItem("mylink_custom_plans");
      if (local) {
        const parsed = JSON.parse(local) as PlanItem[];
        foundItem = parsed.find((p) => p.id.toLowerCase() === normPlan);
      }
    } catch {}
  }

  if (cycle === "yearly") {
    if (foundItem) {
      if (foundItem.yearlyPriceNumber && foundItem.yearlyPriceNumber > 0) {
        return foundItem.yearlyPriceNumber;
      }
      const monthly = foundItem.priceNumber ?? parsePriceNumber(foundItem.price);
      return monthly > 0 ? monthly * 12 : 0;
    }
    return PLAN_PRICE_YEARLY[normPlan] ?? (PLAN_PRICE[normPlan] ? PLAN_PRICE[normPlan] * 12 : 0);
  }

  if (foundItem) {
    return foundItem.priceNumber ?? parsePriceNumber(foundItem.price);
  }

  return PLAN_PRICE[normPlan] ?? 0;
}

export function shopBusinessId(shop?: Pick<Shop, "id" | "slug" | "business_id"> | null): string {
  if (!shop) return "BIZ-0000";
  if (shop.business_id) return shop.business_id;
  const prefix = (shop.slug || "BIZ")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const suffix = (shop.id || "0000")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase();
  return `BIZ-${prefix}-${suffix}`;
}

/** Public, share-safe URL for a shop menu. */
export function publicShopUrl(slug: string) {
  const path = `/shop/${slug}`;
  if (typeof window === "undefined") return path;
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

export type Coupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order?: number;
  expires_at?: string;
};

export function buildWhatsAppOrder(
  shop: Shop,
  lines: CartLine[],
  details?: {
    name?: string;
    phone?: string;
    notes?: string;
    type?: "delivery" | "takeaway" | "on_table" | "enquiry";
    location?: string | null;
    coupon?: Coupon;
  },
) {
  const isEnquiry = details?.type === "enquiry";
  const rows = lines.map((l) => {
    const unit = l.item.discount_price ?? l.item.price;
    return `• ${l.item.name} x${l.qty} — ${money(unit * l.qty, shop.currency)}`;
  });
  const subtotal = lines.reduce(
    (sum, l) => sum + (l.item.discount_price ?? l.item.price) * l.qty,
    0,
  );

  let discountAmount = 0;
  if (details?.coupon && (!details.coupon.min_order || subtotal >= details.coupon.min_order)) {
    if (details.coupon.type === "percent") {
      discountAmount = subtotal * (details.coupon.value / 100);
    } else {
      discountAmount = details.coupon.value;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  const textParts = [
    `Hello ${shop.name},`,
    "",
    isEnquiry ? "I have an enquiry / quote request for:" : "I want to order:",
    ...rows,
    "",
    ...(discountAmount > 0
      ? [
          `Subtotal: ${money(subtotal, shop.currency)}`,
          `Discount (${details!.coupon!.code}): -${money(discountAmount, shop.currency)}`,
        ]
      : []),
    `Total: ${money(total, shop.currency)}`,
  ];

  const upiId = (shop.features as Record<string, unknown> | null)?.["upi_id"] as string | undefined;
  const upiEnabled = (shop.features as Record<string, unknown> | null)?.["upi_enabled"] as
    boolean | undefined;
  if (upiEnabled && upiId && !isEnquiry) {
    textParts.push("");
    textParts.push("💳 Payment Method: UPI");
    textParts.push(`Please pay ${money(total, shop.currency)} to the following UPI ID: ${upiId}`);
  }

  if (details?.type) {
    const labels = shopOrderLabels(shop);
    const typeLabel = labels[details.type] || details.type;
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
    textParts.push(`Notes / Enquiry details: ${details.notes}`);
  }

  const text = textParts.join("\n");
  const rawNumber = shop.whatsapp || shop.phone || "";
  const number = rawNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi (हिंदी)" },
  { code: "ur", name: "Urdu (اردو)" },
  { code: "te", name: "Telugu (తెలుగు)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "fr", name: "French (Français)" },
  { code: "ml", name: "Malayalam (മലയാളം)" },
];

export function shopLanguages(shop?: Shop | null): string[] {
  if (!shop) return ["en"];
  const features = shop.features as Record<string, unknown>;
  if (features && Array.isArray(features["languages"]) && features["languages"].length > 0) {
    return features["languages"] as string[];
  }
  return ["en"];
}
