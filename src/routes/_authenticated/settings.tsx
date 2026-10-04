import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UpiPaymentBox } from "@/components/UpiPaymentBox";
import { supabase } from "@/integrations/supabase/client";
import { updateShopSettings } from "@/lib/shop.functions";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop, uploadShopMedia, triggerCrossTabSync } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Lock,
  Copy,
  Check,
  Loader2,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  Store,
  MapPin,
  Phone,
  Palette,
  ShoppingBag,
  CreditCard,
  Tag,
  Languages,
  Upload,
  Trash2,
  Eye,
  Share2,
  Plus,
  Calendar,
} from "lucide-react";
import {
  NICHES,
  shopBusinessId,
  shopGoogleReviewLink,
  shopCartEnabled,
  shopDeliveryEnabled,
  shopTakeawayEnabled,
  shopOnTableEnabled,
  shopEnquiryEnabled,
  shopOrderLabels,
  shopCatalogLabel,
  shopItemLabel,
  shopTheme,
  shopFeatures,
  shopLanguages,
  shopSocialLinks,
  shopTiming,
  shopMapUrl,
  shopCustomDomain,
  publicShopUrl,
  slugify,
  AVAILABLE_LANGUAGES,
  type ThemeId,
  type Coupon,
  type Shop,
} from "@/lib/shop";
import { invalidatePublicShopCache } from "@/lib/menu.functions";

function safeStr(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  return "";
}

function computeLiveShop(shop: Shop, form: any): Shop {
  const currentFeatures = (shop.features as Record<string, any>) || {};
  const updatedFeatures = {
    ...currentFeatures,
    custom_domain: safeStr(form["custom_domain"]),
    timing: safeStr(form["timing"]),
    map_url: safeStr(form["map_url"]),
    social_link: safeStr(form["instagram_url"]),
    instagram_url: safeStr(form["instagram_url"]),
    facebook_url: safeStr(form["facebook_url"]),
    twitter_url: safeStr(form["twitter_url"]),
    website_url: safeStr(form["website_url"]),
    whatsapp_group_url: safeStr(form["whatsapp_group_url"]),
    whatsapp_group: safeStr(form["whatsapp_group_url"]),
    google_review_link: safeStr(form["google_review_link"]),
    cart_enabled: form["cart_enabled"],
    ordering_enabled: form["cart_enabled"],
    delivery: form["delivery"],
    takeaway: form["takeaway"],
    take_away: form["takeaway"],
    on_table: form["on_table"],
    enquiry: form["enquiry"],
    label_enquiry: safeStr(form["label_enquiry"]),
    catalog_label: safeStr(form["catalog_label"]),
    item_label: safeStr(form["item_label"]),
    theme: form["theme"],
    languages: form["languages"],
    multi_language_enabled: form["multi_language_enabled"],
    coupons: form["coupons"],
    cod_enabled: form["cod_enabled"],
    upi_enabled: form["upi_enabled"],
    upi_id: safeStr(form["upi_id"]),
    upi_qr_url: safeStr(form["upi_qr_url"]),
  };

  return {
    ...shop,
    slug: safeStr(form["slug"]) || shop.slug,
    name: safeStr(form["name"]) || shop.name,
    tagline: safeStr(form["tagline"]) || null,
    niche: safeStr(form["niche"]) || shop.niche,
    whatsapp: safeStr(form["whatsapp"]) || null,
    phone: safeStr(form["phone"]) || null,
    address: safeStr(form["address"]) || null,
    currency: safeStr(form["currency"]) || "₹",
    logo_url: safeStr(form["logo_url"]) || null,
    cover_url: safeStr(form["cover_url"]) || null,
    features: updatedFeatures,
  };
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — MY Link QR" },
      {
        name: "description",
        content: "Update your shop name, branding, WhatsApp number, theme, and payment settings.",
      },
      { property: "og:title", content: "Shop Settings — MY Link QR" },
      { property: "og:description", content: "Update your shop branding and contact details." },
    ],
  }),
  component: SettingsPage,
});

type TabId = "branding" | "domain" | "contact" | "ordering" | "payments" | "theme" | "coupons";

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const feat = shopFeatures(shop);

  const featOverrides = (shop?.features as Record<string, any>) || {};
  const couponsList = (Array.isArray(featOverrides["coupons"]) ? featOverrides["coupons"] : []) as Coupon[];
  const codEnabled = featOverrides["cod_enabled"] !== false;
  const upiEnabled = featOverrides["upi_enabled"] === true;
  const upiId = typeof featOverrides["upi_id"] === "string" ? featOverrides["upi_id"] : "";
  const upiQrUrl = typeof featOverrides["upi_qr_url"] === "string" ? featOverrides["upi_qr_url"] : "";
  const multiLangEnabled = featOverrides["multi_language_enabled"] !== false;

  const [activeTab, setActiveTab] = useState<TabId>("branding");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    custom_domain: "",
    tagline: "",
    niche: NICHES[0]!,
    whatsapp: "",
    phone: "",
    address: "",
    map_url: "",
    currency: "₹",
    timing: "",
    social_link: "",
    instagram_url: "",
    facebook_url: "",
    twitter_url: "",
    website_url: "",
    whatsapp_group_url: "",
    google_review_link: "",
    cart_enabled: true,
    delivery: true,
    takeaway: true,
    on_table: true,
    enquiry: true,
    label_enquiry: "General Enquiry / Quote",
    catalog_label: "Menu",
    item_label: "Item",
    theme: "luxury_dark" as ThemeId,
    languages: ["en"],
    multi_language_enabled: true,
    coupons: [] as Coupon[],
    cod_enabled: true,
    upi_enabled: false,
    upi_id: "",
    upi_qr_url: "",
    logo_url: "",
    cover_url: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<string | null>(null);
  const [testUpiAmount, setTestUpiAmount] = useState<number>(240);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedShopUrl, setCopiedShopUrl] = useState(false);

  const handleCopyBizId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Business ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyShopUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedShopUrl(true);
    toast.success("Public Shop Link copied!");
    setTimeout(() => setCopiedShopUrl(false), 2000);
  };

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    min_order: "",
    expires_at: "",
  });

  const updateForm = (updater: React.SetStateAction<typeof form>) => {
    setForm((prev) => (typeof updater === "function" ? updater(prev) : updater));
  };

  const syncCoupons = async (newCoupons: Coupon[]) => {
    if (!shop) return;
    updateForm((f) => ({ ...f, coupons: newCoupons }));

    const currentFeatures = (shop.features as Record<string, any>) || {};
    const updatedFeatures = {
      ...currentFeatures,
      coupons: newCoupons,
    };

    try {
      const { error } = await supabase
        .from("shops")
        .update({ features: updatedFeatures })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success("Discount coupons updated instantly!");
      await qc.invalidateQueries();
      invalidatePublicShopCache(shop.slug);
      triggerCrossTabSync(shop.id);
    } catch (err) {
      toast.error("Failed to sync coupons: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const addCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    const val = parseFloat(newCoupon.value);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    const created: Coupon = {
      code: newCoupon.code.trim().toUpperCase(),
      type: newCoupon.type,
      value: val,
      ...(newCoupon.min_order ? { min_order: parseFloat(newCoupon.min_order) } : {}),
      ...(newCoupon.expires_at ? { expires_at: newCoupon.expires_at } : {}),
    };

    if (form.coupons.some((c) => c.code === created.code)) {
      toast.error("A coupon with this code already exists");
      return;
    }

    const updated = [...form.coupons, created];
    setNewCoupon({ code: "", type: "percent", value: "", min_order: "", expires_at: "" });
    await syncCoupons(updated);
  };

  const removeCoupon = async (code: string) => {
    const updated = form.coupons.filter((c) => c.code !== code);
    await syncCoupons(updated);
  };

  useEffect(() => {
    if (!shop) return;
    const soc = shopSocialLinks(shop);

    setForm({
      name: shop.name || "",
      slug: shop.slug || "",
      custom_domain: shopCustomDomain(shop) || "",
      tagline: shop.tagline || "",
      niche: NICHES.includes(shop.niche as any) ? (shop.niche as any) : NICHES[0]!,
      whatsapp: shop.whatsapp || "",
      phone: shop.phone || "",
      address: shop.address || "",
      map_url: shopMapUrl(shop) || "",
      currency: shop.currency || "₹",
      timing: shopTiming(shop) || "",
      social_link: soc.instagram || "",
      instagram_url: soc.instagram || "",
      facebook_url: soc.facebook || "",
      twitter_url: soc.twitter || "",
      website_url: soc.website || "",
      whatsapp_group_url: soc.whatsapp_group || "",
      google_review_link: shopGoogleReviewLink(shop) || "",
      cart_enabled: shopCartEnabled(shop),
      delivery: shopDeliveryEnabled(shop),
      takeaway: shopTakeawayEnabled(shop),
      on_table: shopOnTableEnabled(shop),
      enquiry: shopEnquiryEnabled(shop),
      label_enquiry: shopOrderLabels(shop).enquiry || "General Enquiry / Quote",
      catalog_label: shopCatalogLabel(shop),
      item_label: shopItemLabel(shop),
      theme: shopTheme(shop),
      languages: shopLanguages(shop),
      multi_language_enabled: multiLangEnabled,
      coupons: couponsList,
      cod_enabled: codEnabled,
      upi_enabled: upiEnabled,
      upi_id: upiId,
      upi_qr_url: upiQrUrl,
      logo_url: shop.logo_url || "",
      cover_url: shop.cover_url || "",
    });
  }, [shop]);

  async function save() {
    if (!shop) return;
    try {
      setSaving(true);
      const liveShopData = computeLiveShop(shop, form);

      qc.setQueryData(["myShop", user?.id], liveShopData);
      qc.setQueryData(["publicShop", shop.slug], liveShopData);
      if (form.slug && form.slug !== shop.slug) {
        qc.setQueryData(["publicShop", form.slug], liveShopData);
      }

      await updateShopSettings({
        data: {
          shop_id: shop.id,
          updates: {
            name: form.name,
            slug: form.slug || undefined,
            custom_domain: form.custom_domain,
            tagline: form.tagline,
            niche: form.niche,
            whatsapp: form.whatsapp,
            phone: form.phone,
            address: form.address,
            map_url: form.map_url,
            currency: form.currency,
            timing: form.timing,
            social_link: form.instagram_url,
            instagram_url: form.instagram_url,
            facebook_url: form.facebook_url,
            twitter_url: form.twitter_url,
            website_url: form.website_url,
            whatsapp_group_url: form.whatsapp_group_url,
            google_review_link: form.google_review_link,
            cart_enabled: form.cart_enabled,
            delivery: form.delivery,
            takeaway: form.takeaway,
            on_table: form.on_table,
            enquiry: form.enquiry,
            label_enquiry: form.label_enquiry,
            catalog_label: form.catalog_label,
            item_label: form.item_label,
            theme: form.theme,
            languages: form.languages,
            multi_language_enabled: form.multi_language_enabled,
            coupons: form.coupons,
            cod_enabled: form.cod_enabled,
            upi_enabled: form.upi_enabled,
            upi_id: form.upi_id,
            upi_qr_url: form.upi_qr_url,
            logo_url: form.logo_url,
            cover_url: form.cover_url,
          },
        },
      });

      await qc.invalidateQueries({ queryKey: ["myShop", user?.id] });
      await qc.invalidateQueries({ queryKey: ["publicShop"] });

      invalidatePublicShopCache(shop.slug);
      if (form.slug && form.slug !== shop.slug) {
        invalidatePublicShopCache(form.slug);
      }
      triggerCrossTabSync(shop.id);

      toast.success("✨ Shop Settings saved & synchronized in real-time!");
    } catch (err) {
      console.error("Failed to save shop settings:", err);
      toast.error("Failed to save settings: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "logo_url" | "cover_url" | "upi_qr_url", file: File) {
    if (!shop) return;
    try {
      setUploadingMedia(kind);
      const url = await uploadShopMedia(file, shop.id);

      if (kind === "upi_qr_url") {
        setForm((f) => ({ ...f, upi_qr_url: url }));
        const currentFeatures = (shop.features as Record<string, any>) || {};
        const updatedFeatures = { ...currentFeatures, upi_qr_url: url };
        const { error } = await supabase
          .from("shops")
          .update({ features: updatedFeatures })
          .eq("id", shop.id);
        if (error) throw error;
        toast.success("UPI QR Code image updated!");
      } else {
        const patch = kind === "logo_url" ? { logo_url: url } : { cover_url: url };
        setForm((f) => ({ ...f, [kind]: url }));
        const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
        if (error) throw error;
        toast.success(kind === "logo_url" ? "Shop logo uploaded!" : "Cover banner uploaded!");
      }
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMedia(null);
    }
  }

  async function removeMedia(kind: "logo_url" | "cover_url") {
    if (!shop) return;
    try {
      setForm((f) => ({ ...f, [kind]: "" }));
      const patch = kind === "logo_url" ? { logo_url: null } : { cover_url: null };
      const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
      if (error) throw error;
      toast.success(kind === "logo_url" ? "Logo removed" : "Cover banner removed");
      await qc.invalidateQueries();
    } catch {
      toast.error("Failed to remove image");
    }
  }

  const TABS: { id: TabId; label: string; icon: any; badge?: string }[] = [
    { id: "branding", label: "General & Branding", icon: Store },
    { id: "domain", label: "Custom Handle & Link", icon: LinkIcon },
    { id: "contact", label: "Contact & Location", icon: MapPin },
    { id: "ordering", label: "Menu & Channels", icon: ShoppingBag },
    { id: "payments", label: "Payments & UPI", icon: CreditCard },
    { id: "theme", label: "Theme & Language", icon: Palette },
    {
      id: "coupons",
      label: "Coupons & Offers",
      icon: Tag,
      ...(form.coupons.length > 0 ? { badge: String(form.coupons.length) } : {}),
    },
  ];

  return (
    <DashboardShell
      title="Shop Settings"
      description="Manage business details, custom URL, theme, payment methods, and discount coupons."
      isAdmin={isAdmin}
      actions={
        shop && (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-semibold border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
            >
              <a
                href={publicShopUrl(form.slug || shop.slug, form.custom_domain)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5"
              >
                <Eye className="size-3.5" />
                <span className="hidden sm:inline">View Live Shop</span>
              </a>
            </Button>
            <Button
              onClick={save}
              disabled={saving || Boolean(uploadingMedia)}
              size="sm"
              className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs px-4 shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-black" />
                  <span className="hidden sm:inline">Saving…</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        )
      }
    >
      {/* Full Screen Saving Loader Overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-3.5 rounded-3xl bg-card/95 border border-amber-500/40 p-6 sm:p-8 shadow-2xl text-center max-w-xs mx-4">
            <div className="relative flex items-center justify-center size-14">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <Loader2 className="size-7 text-amber-500 animate-spin shrink-0" />
            </div>
            <div>
              <p className="font-bold text-base text-foreground">Saving Changes…</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Updating shop settings and syncing real-time data
              </p>
            </div>
          </div>
        </div>
      )}

      {!shop ? (
        <div className="rounded-2xl border bg-card p-6 sm:p-8 text-center max-w-md mx-auto my-8 sm:my-12">
          <Store className="size-12 text-amber-500 mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-lg text-foreground">No Shop Configured Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Please create your shop profile on the dashboard to access full settings.
          </p>
          <Button asChild className="bg-amber-500 text-black font-bold w-full sm:w-auto">
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6 pb-28 sm:pb-24">
          {/* Top Quick Status Bar */}
          <div className="rounded-2xl border bg-card/80 p-4 sm:p-5 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 w-full sm:w-auto">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt={form.name}
                  className="size-11 sm:size-12 rounded-xl object-cover border border-amber-500/30 shrink-0 shadow-sm"
                />
              ) : (
                <div className="size-11 sm:size-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-lg sm:text-xl shrink-0">
                  {form.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base sm:text-lg text-foreground truncate">
                    {form.name || "My Shop"}
                  </h2>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-emerald-500/30">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-Time Synced
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Handle: <span className="font-mono text-amber-500">/shop/{form.slug || shop.slug}</span> • Category: <span className="font-semibold">{form.niche}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-border/50">
              <span className="text-[11px] text-muted-foreground font-mono sm:hidden">Business Key</span>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-foreground text-xs font-mono font-semibold cursor-pointer hover:bg-muted transition-colors"
                onClick={() => handleCopyBizId(shopBusinessId(shop))}
                title="Click to copy Business ID"
              >
                {copiedId ? <Check className="size-3.5 text-emerald-500" /> : <Lock className="size-3.5 text-amber-500" />}
                <span>ID: {shopBusinessId(shop)}</span>
                {!copiedId && <Copy className="size-3 ml-0.5 opacity-60" />}
              </div>
            </div>
          </div>

          {/* Mobile Select Dropdown for quick navigation */}
          <div className="sm:hidden space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>SETTINGS SECTION ({TABS.findIndex((t) => t.id === activeTab) + 1} / {TABS.length})</span>
              <span className="text-amber-500 font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</span>
            </div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="h-11 w-full rounded-xl border border-amber-500/40 bg-card px-3 text-sm font-bold text-foreground shadow-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {TABS.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  {idx + 1}. {t.label} {t.badge ? `(${t.badge})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Touch-Friendly Navigation Segment Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth border-b border-border/60">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[44px] sm:min-h-0 ${
                    isActive
                      ? "bg-amber-500 text-black shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "bg-black text-amber-400" : "bg-amber-500/20 text-amber-500"
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: General & Branding */}
          {activeTab === "branding" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Store className="size-5 text-amber-500" /> Business Profile & Information
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Basic shop identity and category details shown across all public catalogs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="s-name"
                    label="Shop Name *"
                    value={form.name}
                    placeholder="e.g. Royal Spice Bistro"
                    onChange={(v) => updateForm((prev) => ({ ...prev, name: v }))}
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="s-niche" className="text-xs font-semibold text-foreground">
                      Business Type / Niche
                    </Label>
                    <select
                      id="s-niche"
                      className="h-11 sm:h-10 w-full rounded-xl border bg-background px-3 text-base sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      value={form.niche}
                      onChange={(e) => updateForm((prev) => ({ ...prev, niche: e.target.value }))}
                    >
                      {NICHES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <FormInput
                  id="s-tag"
                  label="Tagline / Short Description"
                  value={form.tagline}
                  placeholder="e.g. Authentic Wood-Fired Pizzas & Artisanal Pastas"
                  onChange={(v) => updateForm((prev) => ({ ...prev, tagline: v }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 sm:pt-2">
                  <FormInput
                    id="s-catalog-label"
                    label="Catalog / Menu Section Title"
                    value={form.catalog_label}
                    placeholder="e.g. Menu, Catalog, Services"
                    onChange={(v) => updateForm((prev) => ({ ...prev, catalog_label: v }))}
                  />

                  <FormInput
                    id="s-item-label"
                    label="Single Item Label"
                    value={form.item_label}
                    placeholder="e.g. Item, Dish, Product"
                    onChange={(v) => updateForm((prev) => ({ ...prev, item_label: v }))}
                  />
                </div>
              </div>

              {/* Media & Branding Images */}
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Upload className="size-5 text-amber-500" /> Branding Media & Imagery
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload high-resolution logo and cover banner for your digital storefront.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                    <Label className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      Shop Logo
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="size-16 sm:size-20 rounded-2xl border border-amber-500/20 overflow-hidden bg-background shrink-0 flex items-center justify-center shadow-xs relative">
                        {uploadingMedia === "logo_url" ? (
                          <div className="flex items-center justify-center size-full bg-muted/60">
                            <Loader2 className="size-6 animate-spin text-amber-500" />
                          </div>
                        ) : form.logo_url ? (
                          <img src={form.logo_url} alt="Logo" className="size-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">No Logo</span>
                        )}
                      </div>
                      <div className="space-y-2 flex-1 w-full min-w-0">
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={uploadingMedia === "logo_url"}
                          className="text-xs h-10 sm:h-9 cursor-pointer file:text-xs file:font-bold w-full"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void upload("logo_url", f);
                          }}
                        />
                        {form.logo_url && (
                          <button
                            type="button"
                            onClick={() => removeMedia("logo_url")}
                            className="text-xs text-red-500 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="size-3" /> Remove logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner Upload */}
                  <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                    <Label className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      Cover Banner Image
                    </Label>
                    <div className="space-y-3">
                      <div className="h-20 w-full rounded-xl border border-amber-500/20 overflow-hidden bg-background flex items-center justify-center shadow-xs relative">
                        {uploadingMedia === "cover_url" ? (
                          <div className="flex items-center justify-center size-full bg-muted/60">
                            <Loader2 className="size-6 animate-spin text-amber-500" />
                          </div>
                        ) : form.cover_url ? (
                          <img src={form.cover_url} alt="Banner" className="size-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">No Cover Banner</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={uploadingMedia === "cover_url"}
                          className="text-xs h-10 sm:h-9 cursor-pointer file:text-xs file:font-bold flex-1"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void upload("cover_url", f);
                          }}
                        />
                        {form.cover_url && (
                          <button
                            type="button"
                            onClick={() => removeMedia("cover_url")}
                            className="text-xs text-red-500 hover:underline font-semibold flex items-center gap-1 shrink-0"
                          >
                            <Trash2 className="size-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Handle & Domain */}
          {activeTab === "domain" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <LinkIcon className="size-5 text-amber-500" /> Custom Shop URL Handle
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure your custom public web handle. Changes sync instantly to customers.
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 shrink-0">
                    Real-Time Sync
                  </span>
                </div>

                <div className="space-y-3 rounded-2xl border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label htmlFor="s-slug" className="text-xs font-semibold flex items-center gap-2">
                      <span>Public Shop Slug Handle</span>
                      <span className="text-amber-500 font-mono font-bold">
                        /shop/{slugify(form.slug || form.name)}
                      </span>
                    </Label>
                    {!feat.custom_domain ? (
                      <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Lock className="size-3" /> Locked (Premium Plan)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check className="size-3" /> Unlocked (Premium Plan)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-3 sm:top-2.5 text-xs text-muted-foreground font-mono pointer-events-none">
                        /shop/
                      </span>
                      <Input
                        id="s-slug"
                        value={form.slug}
                        disabled={!feat.custom_domain}
                        onChange={(e) =>
                          updateForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                        }
                        placeholder="my-shop-name"
                        className={`pl-16 h-11 sm:h-10 font-mono text-base sm:text-sm font-bold ${
                          !feat.custom_domain
                            ? "bg-muted/60 opacity-70 cursor-not-allowed text-muted-foreground border-amber-500/20"
                            : "text-amber-600 dark:text-amber-400 border-amber-500/40"
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyShopUrl(publicShopUrl(form.slug || shop.slug, form.custom_domain))
                        }
                        className="h-11 sm:h-10 flex-1 sm:flex-initial px-3.5 text-xs font-semibold shrink-0"
                        title="Copy full public shop URL"
                      >
                        {copiedShopUrl ? (
                          <Check className="size-4 text-emerald-500 mr-1" />
                        ) : (
                          <Copy className="size-4 mr-1" />
                        )}
                        <span className="sm:hidden">Copy URL</span>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-11 sm:h-10 px-3.5 text-xs font-semibold shrink-0 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                      >
                        <a
                          href={publicShopUrl(form.slug || shop.slug, form.custom_domain)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="size-4" />
                          <span className="sm:hidden">Open</span>
                        </a>
                      </Button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground break-all">
                    Public customer link:{" "}
                    <code className="text-amber-500 font-mono font-bold">
                      {publicShopUrl(form.slug || shop.slug, form.custom_domain)}
                    </code>
                  </p>

                  {!feat.custom_domain && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                          <Lock className="size-3.5" /> Premium Custom Link Feature
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Upgrade to Premium to customize your shop handle URL.
                        </p>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                      >
                        <a href="/pricing">Upgrade to Premium</a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Reviews Integration */}
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Globe className="size-5 text-amber-500" /> Google Reviews Link
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Direct customers to your Google Business profile to boost ratings and reviews.
                  </p>
                </div>

                {!feat.google_reviews ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> Google Reviews Integration
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Unlock Google Review collection directly on your QR menu.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  <FormInput
                    id="s-google-review"
                    label="Google Business Review Link"
                    value={form.google_review_link}
                    placeholder="https://g.page/r/your-shop/review"
                    onChange={(v) => updateForm((prev) => ({ ...prev, google_review_link: v }))}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Contact & Location */}
          {activeTab === "contact" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Phone className="size-5 text-amber-500" /> Direct Contact & Location
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    WhatsApp number, direct phone, physical shop address, and Google Maps location.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="s-wa"
                    label="WhatsApp Ordering Number *"
                    value={form.whatsapp}
                    placeholder="e.g. +919876543210"
                    onChange={(v) => updateForm((prev) => ({ ...prev, whatsapp: v }))}
                  />

                  <FormInput
                    id="s-phone"
                    label="Direct Phone Number"
                    value={form.phone}
                    placeholder="e.g. +919876543210"
                    onChange={(v) => updateForm((prev) => ({ ...prev, phone: v }))}
                  />
                </div>

                <FormInput
                  id="s-addr"
                  label="Physical Address / Store Location"
                  value={form.address}
                  placeholder="e.g. 123 Main Street, MG Road, Bengaluru, Karnataka"
                  onChange={(v) => updateForm((prev) => ({ ...prev, address: v }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    id="s-map-url"
                    label="Google Maps URL"
                    value={form.map_url}
                    placeholder="https://maps.google.com/?q=..."
                    onChange={(v) => updateForm((prev) => ({ ...prev, map_url: v }))}
                  />

                  <FormInput
                    id="s-timing"
                    label="Operating Hours / Schedule"
                    value={form.timing}
                    placeholder="e.g. Mon - Sun: 9:00 AM - 11:00 PM"
                    onChange={(v) => updateForm((prev) => ({ ...prev, timing: v }))}
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Share2 className="size-5 text-amber-500" /> Social Media & Community Channels
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect your Instagram, Facebook, WhatsApp Community group, and website.
                  </p>
                </div>

                <FormInput
                  id="s-instagram"
                  label="Instagram URL"
                  value={form.instagram_url}
                  placeholder="https://instagram.com/yourshop"
                  onChange={(v) => updateForm((prev) => ({ ...prev, instagram_url: v }))}
                />

                {!feat.advanced_social_links ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> Advanced Social Channels
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Unlock WhatsApp Group, Facebook, Twitter / X, and Website links.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      id="s-whatsapp-group"
                      label="WhatsApp Group URL"
                      value={form.whatsapp_group_url}
                      placeholder="https://chat.whatsapp.com/..."
                      onChange={(v) => updateForm((prev) => ({ ...prev, whatsapp_group_url: v }))}
                    />

                    <FormInput
                      id="s-facebook"
                      label="Facebook Page URL"
                      value={form.facebook_url}
                      placeholder="https://facebook.com/yourshop"
                      onChange={(v) => updateForm((prev) => ({ ...prev, facebook_url: v }))}
                    />

                    <FormInput
                      id="s-twitter"
                      label="Twitter / X Profile URL"
                      value={form.twitter_url}
                      placeholder="https://x.com/yourshop"
                      onChange={(v) => updateForm((prev) => ({ ...prev, twitter_url: v }))}
                    />

                    <FormInput
                      id="s-website"
                      label="Official Website URL"
                      value={form.website_url}
                      placeholder="https://yourshop.com"
                      onChange={(v) => updateForm((prev) => ({ ...prev, website_url: v }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Menu & Channels */}
          {activeTab === "ordering" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <ShoppingBag className="size-5 text-amber-500" /> Catalog Currency & Toggles
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Currency formatting and master switches for customer ordering channels.
                  </p>
                </div>

                <div className="max-w-xs">
                  <FormInput
                    id="s-cur"
                    label="Currency Symbol"
                    value={form.currency}
                    placeholder="₹"
                    onChange={(v) => updateForm((prev) => ({ ...prev, currency: v }))}
                  />
                </div>

                {/* Master Cart Toggle */}
                <div className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-amber-500/10 via-card to-card p-3.5 sm:p-4 border-amber-500/30 shadow-xs">
                  <div className="space-y-0.5 pr-2">
                    <Label htmlFor="cart-toggle" className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
                      <span>Shopping Cart & Ordering Button</span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                        Real-Time Sync
                      </span>
                    </Label>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">
                      Enable or disable the Cart button and WhatsApp ordering on your public menu.
                    </p>
                  </div>
                  <Switch
                    id="cart-toggle"
                    checked={form.cart_enabled && feat.ordering}
                    disabled={!feat.ordering}
                    onCheckedChange={(v) => updateForm((prev) => ({ ...prev, cart_enabled: v }))}
                  />
                </div>

                {/* Individual Channel Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
                  <ChannelCard
                    id="delivery-toggle"
                    title="Delivery"
                    desc="Customers request delivery to their address."
                    checked={form.delivery && feat.delivery}
                    disabled={!feat.delivery}
                    onChange={(v) => updateForm((prev) => ({ ...prev, delivery: v }))}
                  />

                  <ChannelCard
                    id="takeaway-toggle"
                    title="Takeaway / Pickup"
                    desc="Customers pick up orders directly at store."
                    checked={form.takeaway && feat.take_away}
                    disabled={!feat.take_away}
                    onChange={(v) => updateForm((prev) => ({ ...prev, takeaway: v }))}
                  />

                  <ChannelCard
                    id="ontable-toggle"
                    title="On-Table Dining"
                    desc="Dine-in customers enter table number."
                    checked={form.on_table && feat.on_table}
                    disabled={!feat.on_table}
                    onChange={(v) => updateForm((prev) => ({ ...prev, on_table: v }))}
                  />
                </div>

                {/* General Enquiry Toggle */}
                <div className="space-y-3 rounded-xl border p-3.5 sm:p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="pr-2">
                      <Label htmlFor="enquiry-toggle" className="text-xs sm:text-sm font-bold">
                        General Enquiry / Quote Requests
                      </Label>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                        Allow visitors to send general inquiries or custom quote requests.
                      </p>
                    </div>
                    <Switch
                      id="enquiry-toggle"
                      checked={form.enquiry && feat.enquiry}
                      disabled={!feat.enquiry}
                      onCheckedChange={(v) => updateForm((prev) => ({ ...prev, enquiry: v }))}
                    />
                  </div>

                  {form.enquiry && feat.enquiry && (
                    <div className="pt-2 border-t border-border/50">
                      <FormInput
                        id="enquiry-label"
                        label="Enquiry Button Label"
                        value={form.label_enquiry}
                        placeholder="e.g. General Enquiry / Quote"
                        onChange={(v) => updateForm((prev) => ({ ...prev, label_enquiry: v }))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Payments & UPI */}
          {activeTab === "payments" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="size-5 text-amber-500" /> Checkout Payment Options
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure Cash on Delivery and Direct UPI Digital Payments for your store.
                  </p>
                </div>

                {/* COD Switch */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-card/60">
                  <div className="pr-2">
                    <Label htmlFor="s-cod" className="font-bold text-xs sm:text-sm cursor-pointer">
                      Cash on Delivery (COD)
                    </Label>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      Allow customers to pay cash when their order is fulfilled.
                    </p>
                  </div>
                  <Switch
                    id="s-cod"
                    checked={form.cod_enabled}
                    onCheckedChange={(v) => updateForm((prev) => ({ ...prev, cod_enabled: v }))}
                  />
                </div>

                {/* UPI Switch */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-card/60">
                  <div className="pr-2">
                    <Label htmlFor="s-upi-toggle" className="font-bold text-xs sm:text-sm cursor-pointer">
                      Direct UPI Payments (GPay, PhonePe, Paytm, QR)
                    </Label>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                      Accept instant UPI payments directly into your bank account.
                    </p>
                  </div>
                  {feat.upi && (
                    <Switch
                      id="s-upi-toggle"
                      checked={form.upi_enabled}
                      onCheckedChange={(v) => updateForm((prev) => ({ ...prev, upi_enabled: v }))}
                    />
                  )}
                </div>

                {!feat.upi ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> UPI Payments Integration
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upgrade to Premium plan to unlock direct UPI payment collection.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  form.upi_enabled && (
                    <div className="space-y-4 sm:space-y-5 pt-2 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          id="s-upi"
                          label="Merchant UPI ID"
                          value={form.upi_id}
                          placeholder="e.g. shopname@upi or 9876543210@paytm"
                          onChange={(v) => updateForm((prev) => ({ ...prev, upi_id: v }))}
                        />

                        <div className="space-y-1.5">
                          <Label htmlFor="s-upi-amount" className="text-xs font-semibold">
                            Test Amount (For Live Preview Below)
                          </Label>
                          <Input
                            id="s-upi-amount"
                            type="number"
                            min="1"
                            placeholder="240"
                            value={testUpiAmount}
                            onChange={(e) => setTestUpiAmount(parseFloat(e.target.value) || 0)}
                            className="h-11 sm:h-10 text-base sm:text-sm font-semibold rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Custom UPI QR Upload */}
                      <div className="space-y-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                        <Label className="font-semibold text-xs text-foreground uppercase tracking-wider">
                          Custom Store UPI QR Code Image (Optional)
                        </Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="size-20 rounded-xl border border-amber-500/20 overflow-hidden bg-background shrink-0 flex items-center justify-center relative">
                            {uploadingMedia === "upi_qr_url" ? (
                              <Loader2 className="size-6 animate-spin text-amber-500" />
                            ) : form.upi_qr_url ? (
                              <img src={form.upi_qr_url} alt="UPI QR" className="size-full object-contain p-1" />
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-semibold text-center">Auto Generated</span>
                            )}
                          </div>
                          <div className="space-y-2 flex-1 w-full">
                            <Input
                              type="file"
                              accept="image/*"
                              disabled={uploadingMedia === "upi_qr_url"}
                              className="text-xs h-10 sm:h-9 cursor-pointer w-full"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void upload("upi_qr_url", f);
                              }}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Upload your static store UPI QR code or let MY Link QR generate dynamic payment QRs automatically.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Live Customer UPI Preview */}
                      {form.upi_id.trim() && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs font-bold uppercase text-amber-500 tracking-wider">
                            Live Customer Payment Widget Preview
                          </Label>
                          <UpiPaymentBox
                            upiId={form.upi_id}
                            shopName={form.name || shop.name}
                            currency={form.currency}
                            amount={testUpiAmount}
                          />
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Theme & Language */}
          {activeTab === "theme" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Palette className="size-5 text-amber-500" /> Menu Theme & Aesthetics
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select a visual theme tailored to your brand identity.
                  </p>
                </div>

                {!feat.themes ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> Custom Themes
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upgrade to Premium plan to select luxury dark, bistro emerald, and neon themes.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <ThemeCard
                      id="luxury_dark"
                      title="Luxury Dark"
                      desc="Gold accents on charcoal black."
                      bgColor="#100C09"
                      accentColor="#FFC45A"
                      selected={form.theme === "luxury_dark"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "luxury_dark" }))}
                    />

                    <ThemeCard
                      id="minimalist_light"
                      title="Minimalist Light"
                      desc="Clean, crisp light layout for cafes."
                      bgColor="#F5F0E7"
                      accentColor="#100C09"
                      selected={form.theme === "minimalist_light"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "minimalist_light" }))}
                    />

                    <ThemeCard
                      id="warm_amber"
                      title="Warm Amber"
                      desc="Inviting warm tones for bakeries & bistros."
                      bgColor="#FFFAF5"
                      accentColor="#D99A2B"
                      selected={form.theme === "warm_amber"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "warm_amber" }))}
                    />

                    <ThemeCard
                      id="emerald_bistro"
                      title="Royal Emerald"
                      desc="Deep forest green with warm gold details."
                      bgColor="#062319"
                      accentColor="#F59E0B"
                      selected={form.theme === "emerald_bistro"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "emerald_bistro" }))}
                    />

                    <ThemeCard
                      id="neon_cyber"
                      title="Cyber Neon"
                      desc="Futuristic dark canvas with cyan glow."
                      bgColor="#0D0E15"
                      accentColor="#06B6D4"
                      selected={form.theme === "neon_cyber"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "neon_cyber" }))}
                    />

                    <ThemeCard
                      id="rose_gold"
                      title="Rose Gold"
                      desc="Soft blush rose for boutique shops."
                      bgColor="#FFF5F5"
                      accentColor="#E11D48"
                      selected={form.theme === "rose_gold"}
                      onClick={() => updateForm((prev) => ({ ...prev, theme: "rose_gold" }))}
                    />
                  </div>
                )}
              </div>

              {/* Multi-Language Support */}
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3 flex items-center justify-between">
                  <div className="pr-2">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Languages className="size-5 text-amber-500" /> Multi-Language Menu Support
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable language selection switcher on your public menu.
                    </p>
                  </div>
                  {feat.multi_language && (
                    <Switch
                      checked={form.multi_language_enabled}
                      onCheckedChange={(v) =>
                        updateForm((prev) => ({ ...prev, multi_language_enabled: v }))
                      }
                    />
                  )}
                </div>

                {!feat.multi_language ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> Multi-Language Support
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Unlock multilingual translation on your public catalog.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  form.multi_language_enabled && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <Label className="text-xs font-semibold text-foreground">Select Active Menu Languages</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        {AVAILABLE_LANGUAGES.map((lang) => (
                          <label
                            key={lang.code}
                            className="flex items-center gap-2.5 rounded-xl border p-2.5 sm:p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-input text-amber-500 focus:ring-amber-500 size-4"
                              checked={form.languages.includes(lang.code)}
                              onChange={(e) => {
                                const newLangs = e.target.checked
                                  ? [...form.languages, lang.code]
                                  : form.languages.filter((l) => l !== lang.code);
                                setForm({ ...form, languages: newLangs.length ? newLangs : ["en"] });
                              }}
                              disabled={lang.code === "en"}
                            />
                            <span className="text-xs font-semibold text-foreground">{lang.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 7: Coupons & Offers */}
          {activeTab === "coupons" && (
            <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border bg-card p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="border-b pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Tag className="size-5 text-amber-500" /> Discount & Coupon Management
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create percentage or flat monetary discount codes with real-time website sync.
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 shrink-0">
                    Real-Time Synced
                  </span>
                </div>

                {!feat.coupons ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <Lock className="size-3.5" /> Coupon & Discount System
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Upgrade to Premium plan to manage discount codes and promotional offers.
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0 font-bold text-xs w-full sm:w-auto"
                    >
                      <a href="/pricing">Upgrade</a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5 sm:space-y-6">
                    {/* Add Coupon Form */}
                    <div className="rounded-xl border bg-muted/20 p-3.5 sm:p-4 space-y-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Plus className="size-4" /> Create New Coupon Code
                      </h4>

                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-5 items-end">
                        <div className="sm:col-span-2">
                          <Label className="text-xs font-semibold">Coupon Code *</Label>
                          <Input
                            placeholder="e.g. SAVE20"
                            value={newCoupon.code}
                            onChange={(e) =>
                              setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                            }
                            className="h-11 sm:h-9 font-mono font-bold text-base sm:text-sm uppercase rounded-xl"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold">Discount Type</Label>
                          <select
                            className="flex h-11 sm:h-9 w-full rounded-xl border border-input bg-background px-3 text-base sm:text-xs font-semibold"
                            value={newCoupon.type}
                            onChange={(e) =>
                              setNewCoupon({ ...newCoupon, type: e.target.value as "percent" | "fixed" })
                            }
                          >
                            <option value="percent">% Percentage Off</option>
                            <option value="fixed">Flat Amount Off</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs font-semibold">Value *</Label>
                          <Input
                            type="number"
                            placeholder="20"
                            value={newCoupon.value}
                            onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                            className="h-11 sm:h-9 font-semibold text-base sm:text-sm rounded-xl"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-semibold">Expiry Date</Label>
                          <Input
                            type="date"
                            value={newCoupon.expires_at}
                            onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                            className="h-11 sm:h-9 text-base sm:text-xs rounded-xl"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={addCoupon}
                        type="button"
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold h-11 sm:h-9 px-4 text-xs shadow-xs w-full sm:w-auto rounded-xl"
                      >
                        <Plus className="size-3.5 mr-1" /> Add Coupon Code
                      </Button>
                    </div>

                    {/* Active Coupons List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Active Store Coupons ({form.coupons.length})
                      </h4>

                      {form.coupons.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-xs">
                          No active coupons created yet. Add your first coupon code above.
                        </div>
                      ) : (
                        <div className="divide-y border rounded-xl overflow-hidden bg-card">
                          {form.coupons.map((c) => (
                            <div
                              key={c.code}
                              className="flex items-center justify-between p-3.5 text-sm hover:bg-muted/30 transition-colors gap-2"
                            >
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 sm:px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs shrink-0">
                                  {c.code}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-foreground block truncate">
                                    {c.type === "percent"
                                      ? `${c.value}% OFF`
                                      : `Flat ${form.currency}${c.value} OFF`}
                                  </span>
                                  {c.expires_at && (
                                    <span className="text-[11px] text-muted-foreground block mt-0.5 flex items-center gap-1 truncate">
                                      <Calendar className="size-3 shrink-0" /> {new Date(c.expires_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCoupon(c.code)}
                                className="h-8 px-2.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs font-semibold shrink-0"
                              >
                                <Trash2 className="size-3.5 sm:mr-1" />
                                <span className="hidden sm:inline">Remove</span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Touch & Mobile Responsive Sticky Save Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t p-3 sm:p-4 sm:px-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] sm:text-xs">Real-time sync to public shop</span>
              </div>
              <span className="font-mono font-bold text-amber-500 text-[11px] sm:hidden">
                /shop/{form.slug || shop.slug}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={save}
                disabled={saving || Boolean(uploadingMedia)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm h-11 sm:h-10 px-6 shadow-md cursor-pointer rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-black shrink-0" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4 shrink-0" />
                    <span>Save All Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function FormInput({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 sm:h-10 text-base sm:text-sm font-medium rounded-xl"
      />
    </div>
  );
}

function ChannelCard({
  id,
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center sm:flex-col justify-between sm:justify-between p-3.5 sm:p-4 rounded-xl border bg-card/60 gap-3">
      <div className="space-y-0.5 sm:space-y-1 pr-2 sm:pr-0">
        <Label htmlFor={id} className="font-bold text-xs sm:text-xs cursor-pointer text-foreground block">
          {title}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
      <div className="flex justify-end pt-0 sm:pt-1 shrink-0">
        <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

function ThemeCard({
  id,
  title,
  desc,
  bgColor,
  accentColor,
  selected,
  onClick,
}: {
  id: string;
  title: string;
  desc: string;
  bgColor: string;
  accentColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`cursor-pointer rounded-2xl border-2 p-3 sm:p-3.5 transition-all shadow-xs ${
        selected ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/30" : "border-border hover:border-amber-500/50"
      }`}
      onClick={onClick}
    >
      <div
        className="aspect-[3/4] w-full rounded-xl mb-2.5 sm:mb-3 p-2.5 sm:p-3 flex flex-col items-center overflow-hidden border border-border/40 shadow-inner"
        style={{ backgroundColor: bgColor }}
      >
        <div className="w-full h-5 sm:h-6 rounded-md mb-2 flex items-center px-2 bg-white/10">
          <div className="size-2.5 sm:size-3 rounded-sm mr-2 shrink-0" style={{ backgroundColor: accentColor }} />
          <div className="h-1.5 w-12 sm:w-16 bg-white/30 rounded-full" />
        </div>
        <div className="w-full h-5 sm:h-6 rounded-md flex items-center px-2 bg-white/10">
          <div className="size-2.5 sm:size-3 rounded-sm mr-2 shrink-0" style={{ backgroundColor: accentColor }} />
          <div className="h-1.5 w-10 sm:w-12 bg-white/30 rounded-full" />
        </div>
        <div className="mt-auto w-full h-3.5 sm:h-4 rounded-md" style={{ backgroundColor: accentColor }} />
      </div>
      <p className="font-bold text-xs text-foreground truncate">{title}</p>
      <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{desc}</p>
    </div>
  );
}
