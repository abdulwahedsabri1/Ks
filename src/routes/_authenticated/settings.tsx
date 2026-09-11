import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UpiPaymentBox } from "@/components/UpiPaymentBox";
import { supabase } from "@/integrations/supabase/client";
import { updateShopSettings } from "@/lib/shop.functions";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop, uploadShopMedia } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, Copy, Check } from "lucide-react";
import {
  NICHES,
  shopBusinessId,
  shopGoogleReviewLink,
  shopDeliveryEnabled,
  shopTakeawayEnabled,
  shopOnTableEnabled,
  shopTheme,
  shopFeatures,
  shopLanguages,
  shopSocialLinks,
  shopTiming,
  shopMapUrl,
  AVAILABLE_LANGUAGES,
  type ThemeId,
  type Coupon,
} from "@/lib/shop";

function safeStr(val: unknown): string {
  if (typeof val === "string") return val.trim();
  if (typeof val === "number") return String(val).trim();
  return "";
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — MY Link QR" },
      {
        name: "description",
        content: "Update your shop name, branding, WhatsApp number and currency.",
      },
      { property: "og:title", content: "Shop Settings — MY Link QR" },
      { property: "og:description", content: "Update your shop branding and contact details." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const feat = shopFeatures(shop);
  const [form, setForm] = useState({
    name: "",
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
    google_review_link: "",
    delivery: true,
    takeaway: true,
    on_table: true,
    theme: "luxury_dark" as ThemeId,
    languages: ["en"],
    multi_language_enabled: true,
    coupons: [] as Coupon[],
    upi_enabled: false,
    upi_id: "",
    upi_qr_url: "",
    logo_url: "",
    cover_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [testUpiAmount, setTestUpiAmount] = useState<number>(240);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyBizId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast.success("Business ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    min_order: "",
    expires_at: "",
  });

  const syncCoupons = async (newCoupons: Coupon[]) => {
    if (!shop) return;
    setForm((f) => ({ ...f, coupons: newCoupons }));

    const currentFeatures = shop.features || {};
    const updatedFeatures = {
      ...currentFeatures,
      coupons: newCoupons,
    };

    const { error } = await supabase
      .from("shops")
      .update({ features: updatedFeatures })
      .eq("id", shop.id);

    if (error) {
      toast.error("Failed to save coupon: " + error.message);
    } else {
      toast.success("Coupons updated instantly!");
      qc.invalidateQueries({ queryKey: ["my-shop"] });
    }
  };

  const addCoupon = () => {
    if (!newCoupon.code.trim() || !newCoupon.value) return;
    const coupon: Coupon = {
      code: newCoupon.code.trim().toUpperCase(),
      type: newCoupon.type,
      value: Number(newCoupon.value),
      ...(newCoupon.min_order ? { min_order: Number(newCoupon.min_order) } : {}),
      ...(newCoupon.expires_at ? { expires_at: new Date(newCoupon.expires_at).toISOString() } : {}),
    };
    syncCoupons([...form.coupons, coupon]);
    setNewCoupon({ code: "", type: "percent", value: "", min_order: "", expires_at: "" });
  };

  const removeCoupon = (code: string) => {
    syncCoupons(form.coupons.filter((c) => c.code !== code));
  };

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: safeStr(shop.name),
      tagline: safeStr(shop.tagline),
      niche: safeStr(shop.niche) || NICHES[0]!,
      whatsapp: safeStr(shop.whatsapp),
      phone: safeStr(shop.phone),
      address: safeStr(shop.address),
      map_url: safeStr(shopMapUrl(shop)),
      currency: safeStr(shop.currency) || "₹",
      timing: safeStr(shopTiming(shop)),
      social_link: safeStr(shopSocialLinks(shop).instagram),
      instagram_url: safeStr(shopSocialLinks(shop).instagram),
      facebook_url: safeStr(shopSocialLinks(shop).facebook),
      twitter_url: safeStr(shopSocialLinks(shop).twitter),
      website_url: safeStr(shopSocialLinks(shop).website),
      google_review_link: safeStr(shopGoogleReviewLink(shop)),
      delivery: shopDeliveryEnabled(shop),
      takeaway: shopTakeawayEnabled(shop),
      on_table: shopOnTableEnabled(shop),
      theme: shopTheme(shop),
      languages: shopLanguages(shop),
      multi_language_enabled:
        (shop.features as Record<string, unknown> | null)?.["multi_language_enabled"] !== false,
      coupons: Array.isArray((shop.features as Record<string, unknown> | null)?.["coupons"])
        ? ((shop.features as Record<string, unknown> | null)?.["coupons"] as Coupon[])
        : [],
      upi_enabled: Boolean((shop.features as Record<string, unknown> | null)?.["upi_enabled"]),
      upi_id: safeStr((shop.features as Record<string, unknown> | null)?.["upi_id"]),
      upi_qr_url: safeStr((shop.features as Record<string, unknown> | null)?.["upi_qr_url"]),
      logo_url: safeStr(shop.logo_url),
      cover_url: safeStr(shop.cover_url),
    });
  }, [shop]);

  async function save() {
    if (!shop) {
      toast.error("No shop found to update.");
      return;
    }
    setSaving(true);
    try {
      const currentFeatures = shop.features || {};
      const updatedFeatures = {
        ...currentFeatures,
        timing: safeStr(form.timing) || undefined,
        map_url: safeStr(form.map_url) || undefined,
        social_link: safeStr(form.instagram_url) || undefined,
        instagram_url: safeStr(form.instagram_url) || undefined,
        facebook_url: safeStr(form.facebook_url) || undefined,
        twitter_url: safeStr(form.twitter_url) || undefined,
        website_url: safeStr(form.website_url) || undefined,
        google_review_link: safeStr(form.google_review_link) || undefined,
        delivery: form.delivery,
        takeaway: form.takeaway,
        take_away: form.takeaway,
        on_table: form.on_table,
        theme: form.theme,
        languages: form.languages,
        multi_language_enabled: form.multi_language_enabled,
        coupons: form.coupons,
        upi_enabled: form.upi_enabled,
        upi_id: safeStr(form.upi_id) || undefined,
        upi_qr_url: safeStr(form.upi_qr_url) || undefined,
      };

      // Clean up undefined properties from features before saving
      Object.keys(updatedFeatures).forEach((key) => {
        const k = key as keyof typeof updatedFeatures;
        if (updatedFeatures[k] === undefined) {
          delete updatedFeatures[k];
        }
      });

      const updates = {
        name: safeStr(form.name) || shop.name,
        tagline: safeStr(form.tagline) || null,
        niche: safeStr(form.niche) || shop.niche,
        whatsapp: safeStr(form.whatsapp) || null,
        phone: safeStr(form.phone) || null,
        address: safeStr(form.address) || null,
        currency: safeStr(form.currency) || "₹",
        logo_url: safeStr(form.logo_url) || null,
        cover_url: safeStr(form.cover_url) || null,
        features: updatedFeatures,
      };

      try {
        await updateShopSettings({
          data: {
            shop_id: shop.id,
            updates,
          },
        });
      } catch (serverErr) {
        console.warn("Server update fallback to client update:", serverErr);
        const { error } = await supabase
          .from("shops")
          .update({
            ...updates,
            ...(user?.id ? { owner_id: user.id } : {}),
          })
          .eq("id", shop.id);
        if (error) throw error;
      }

      toast.success("✨ Settings saved & synced across website!");
      await qc.invalidateQueries();
    } catch (err) {
      console.error("Failed to save shop settings:", err);
      toast.error("Failed to save settings: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "logo_url" | "cover_url" | "upi_qr_url", file?: File) {
    if (!shop || !file) return;
    try {
      const url = await uploadShopMedia(file, shop.id);
      if (kind === "upi_qr_url") {
        setForm((prev) => ({ ...prev, upi_qr_url: url }));
        const updatedFeatures = {
          ...(shop.features || {}),
          upi_qr_url: url,
        };
        const { error } = await supabase
          .from("shops")
          .update({ features: updatedFeatures })
          .eq("id", shop.id);
        if (error) throw error;
        toast.success("UPI QR Code image updated");
      } else {
        const patch = kind === "logo_url" ? { logo_url: url } : { cover_url: url };
        setForm((f) => ({ ...f, [kind]: url }));
        const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
        if (error) throw error;
        toast.success(
          kind === "logo_url" ? "Shop logo uploaded & synced!" : "Cover banner uploaded & synced!",
        );
      }
      await qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
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

  return (
    <DashboardShell
      title="Shop Settings"
      description="Branding and contact details."
      isAdmin={isAdmin}
    >
      {!shop ? (
        <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
      ) : (
        <div className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-2">
            <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              Business Details
            </h3>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold cursor-pointer hover:bg-amber-500/20 transition-colors"
              onClick={() => handleCopyBizId(shopBusinessId(shop))}
              title="Click to copy Business ID"
            >
              {copiedId ? <Check className="size-3" /> : <Lock className="size-3" />}
              <span>ID: {shopBusinessId(shop)}</span>
              {!copiedId && <Copy className="size-3 ml-1 opacity-70" />}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="s-biz-id" className="text-xs font-medium text-muted-foreground">
                Unique Business ID
              </Label>
              <span className="text-[11px] text-amber-500 flex items-center gap-1 font-medium">
                <Lock className="size-3" /> Locked (Read-Only)
              </span>
            </div>
            <Input
              id="s-biz-id"
              value={shopBusinessId(shop)}
              readOnly
              disabled
              className="h-10 bg-muted/40 font-mono font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-not-allowed"
            />
          </div>

          <Text
            id="s-name"
            label="Shop name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Text
            id="s-tag"
            label="Tagline"
            value={form.tagline}
            onChange={(v) => setForm({ ...form, tagline: v })}
          />
          <div className="space-y-2">
            <Label htmlFor="s-niche">Business type</Label>
            <select
              id="s-niche"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
            >
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <Text
            id="s-wa"
            label="WhatsApp number"
            value={form.whatsapp}
            onChange={(v) => setForm({ ...form, whatsapp: v })}
          />
          <Text
            id="s-phone"
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Text
            id="s-addr"
            label="Address"
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
          />
          <Text
            id="s-map-url"
            label="Map Link (Google Maps URL)"
            value={form.map_url}
            onChange={(v) => setForm({ ...form, map_url: v })}
          />
          <Text
            id="s-timing"
            label="Opening Hours (e.g. Mon-Sun, 9am-10pm)"
            value={form.timing}
            onChange={(v) => setForm({ ...form, timing: v })}
          />
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-medium text-lg pb-2">Social Media Links</h3>
            <Text
              id="s-instagram"
              label="Instagram URL"
              value={form.instagram_url}
              onChange={(v) => setForm({ ...form, instagram_url: v })}
            />
            {!feat.advanced_social_links ? (
              <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4 mt-2">
                <Label className="text-muted-foreground line-through opacity-70">
                  Advanced Social Links (Facebook, X, Website)
                </Label>
                <div className="mt-1 flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Unlock Facebook, Twitter / X, and Website links in the Pro plan.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10 shrink-0"
                  >
                    <a href="/pricing">Upgrade</a>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Text
                  id="s-facebook"
                  label="Facebook URL"
                  value={form.facebook_url}
                  onChange={(v) => setForm({ ...form, facebook_url: v })}
                />
                <Text
                  id="s-twitter"
                  label="Twitter / X URL"
                  value={form.twitter_url}
                  onChange={(v) => setForm({ ...form, twitter_url: v })}
                />
                <Text
                  id="s-website"
                  label="Website URL"
                  value={form.website_url}
                  onChange={(v) => setForm({ ...form, website_url: v })}
                />
              </>
            )}
          </div>

          {!feat.google_reviews ? (
            <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4 mt-2">
              <Label className="text-muted-foreground line-through opacity-70">
                Google Review Link
              </Label>
              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Unlock Google Reviews integration in the Premium plan.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                >
                  <a href="/pricing">Upgrade</a>
                </Button>
              </div>
            </div>
          ) : (
            <Text
              id="s-google-review"
              label="Google Review Link"
              value={form.google_review_link}
              onChange={(v) => setForm({ ...form, google_review_link: v })}
            />
          )}

          <Text
            id="s-cur"
            label="Currency symbol"
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
          />

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-medium text-lg">Payment Settings</h3>
              {feat.upi && (
                <Switch
                  checked={form.upi_enabled}
                  onCheckedChange={(v) => setForm({ ...form, upi_enabled: v })}
                />
              )}
            </div>

            {!feat.upi ? (
              <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock UPI Payments integration in the Premium plan.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                >
                  <a href="/pricing">Upgrade</a>
                </Button>
              </div>
            ) : (
              form.upi_enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="s-upi">UPI ID (Optional)</Label>
                      <Input
                        id="s-upi"
                        placeholder="e.g. sabriabdulwahed-2@okhdfcbank"
                        value={form.upi_id}
                        onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        It will be automatically included in the WhatsApp order message.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-upi-amount">Test Amount (for Preview)</Label>
                      <Input
                        id="s-upi-amount"
                        type="number"
                        min="1"
                        placeholder="e.g. 240"
                        value={testUpiAmount}
                        onChange={(e) => setTestUpiAmount(parseFloat(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Test the dynamic amount generation in the preview below.
                      </p>
                    </div>
                  </div>

                  {form.upi_id.trim() && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Live Customer Payment Preview
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

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-medium text-lg">Multi-Language Menu</h3>
              {feat.multi_language && (
                <Switch
                  checked={form.multi_language_enabled}
                  onCheckedChange={(v) => setForm({ ...form, multi_language_enabled: v })}
                />
              )}
            </div>

            {!feat.multi_language ? (
              <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock multiple languages support in the Basic plan.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                >
                  <a href="/pricing">Upgrade</a>
                </Button>
              </div>
            ) : (
              form.multi_language_enabled && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label>Select Supported Languages</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Your menu will automatically include a language switcher with the languages you
                    select here.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <label
                        key={lang.code}
                        className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-primary size-4"
                          checked={form.languages.includes(lang.code)}
                          onChange={(e) => {
                            const newLangs = e.target.checked
                              ? [...form.languages, lang.code]
                              : form.languages.filter((l) => l !== lang.code);
                            setForm({ ...form, languages: newLangs.length ? newLangs : ["en"] });
                          }}
                          disabled={lang.code === "en"} // English is always supported
                        />
                        <span className="text-sm font-medium">{lang.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-medium text-lg pb-2">Discount & Coupon Codes</h3>

            {!feat.coupons ? (
              <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Unlock discount and coupon codes in the Premium plan.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                >
                  <a href="/pricing">Upgrade</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-6 items-end">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Coupon Code</Label>
                    <Input
                      placeholder="e.g. SAVE20"
                      value={newCoupon.code}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newCoupon.type}
                      onChange={(e) =>
                        setNewCoupon({ ...newCoupon, type: e.target.value as "percent" | "fixed" })
                      }
                    >
                      <option value="percent">% Off</option>
                      <option value="fixed">Flat Amount</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Expiry Date</Label>
                    <Input
                      type="date"
                      value={newCoupon.expires_at}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                    />
                  </div>
                  <Button onClick={addCoupon} type="button" className="w-full">
                    Add
                  </Button>
                </div>

                {form.coupons.length > 0 && (
                  <div className="mt-4 border rounded-md divide-y">
                    {form.coupons.map((c) => (
                      <div key={c.code} className="flex items-center justify-between p-3 text-sm">
                        <div>
                          <span className="font-bold">{c.code}</span>
                          <span className="text-muted-foreground ml-2">
                            (
                            {c.type === "percent"
                              ? `${c.value}% off`
                              : `Flat ${form.currency}${c.value} off`}
                            )
                          </span>
                          {c.expires_at ? (
                            <span className="ml-3 text-xs bg-muted px-2 py-1 rounded">
                              Expires: {new Date(c.expires_at).toLocaleDateString()}
                            </span>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCoupon(c.code)}
                          className="h-8 px-2 text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-medium text-lg pb-2">Appearance & Theme</h3>

            {!feat.themes ? (
              <div className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/5 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Custom themes are available in the Premium plan.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#F5A623]/40 text-[#D99A2B] hover:bg-[#F5A623]/10"
                >
                  <a href="/pricing">Upgrade</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Menu Theme</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Luxury Dark */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "luxury_dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "luxury_dark" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#100C09] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-border/50">
                      <div className="w-full bg-[#18120D] h-6 rounded-md mb-2 flex items-center px-2">
                        <div className="size-3 bg-[#FFC45A] rounded-sm mr-2" />
                        <div className="h-1.5 w-16 bg-white/20 rounded-full" />
                      </div>
                      <div className="w-full bg-[#18120D] h-6 rounded-md flex items-center px-2">
                        <div className="size-3 bg-[#FFC45A] rounded-sm mr-2" />
                        <div className="h-1.5 w-12 bg-white/20 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#FFC45A] rounded-md" />
                    </div>
                    <p className="font-semibold text-sm">Luxury Dark</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Perfect for fine dining and premium services.
                    </p>
                  </div>

                  {/* Minimalist Light */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "minimalist_light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "minimalist_light" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#F5F0E7] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-border/50">
                      <div className="w-full bg-white h-6 rounded-md mb-2 flex items-center px-2 shadow-sm border border-black/5">
                        <div className="size-3 bg-[#100C09] rounded-sm mr-2" />
                        <div className="h-1.5 w-16 bg-black/10 rounded-full" />
                      </div>
                      <div className="w-full bg-white h-6 rounded-md flex items-center px-2 shadow-sm border border-black/5">
                        <div className="size-3 bg-[#100C09] rounded-sm mr-2" />
                        <div className="h-1.5 w-12 bg-black/10 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#100C09] rounded-md" />
                    </div>
                    <p className="font-semibold text-sm">Minimalist Light</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Clean, airy, and modern. Great for cafes.
                    </p>
                  </div>

                  {/* Warm Amber */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "warm_amber" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "warm_amber" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#FFFAF5] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-border/50 shadow-sm">
                      <div className="w-full bg-white h-6 rounded-full mb-2 flex items-center px-2 border border-[#D99A2B]/15">
                        <div className="size-3 bg-[#D99A2B] rounded-full mr-2" />
                        <div className="h-1.5 w-16 bg-black/20 rounded-full" />
                      </div>
                      <div className="w-full bg-white h-6 rounded-full flex items-center px-2 border border-[#D99A2B]/15">
                        <div className="size-3 bg-[#D99A2B] rounded-full mr-2" />
                        <div className="h-1.5 w-12 bg-black/20 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#D99A2B] rounded-full" />
                    </div>
                    <p className="font-semibold text-sm">Warm Amber</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Inviting and elegant, perfect for retail.
                    </p>
                  </div>

                  {/* Royal Emerald */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "emerald_bistro" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "emerald_bistro" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#062319] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-emerald-500/20">
                      <div className="w-full bg-[#0B3325] h-6 rounded-md mb-2 flex items-center px-2">
                        <div className="size-3 bg-[#F59E0B] rounded-sm mr-2" />
                        <div className="h-1.5 w-16 bg-emerald-200/20 rounded-full" />
                      </div>
                      <div className="w-full bg-[#0B3325] h-6 rounded-md flex items-center px-2">
                        <div className="size-3 bg-[#F59E0B] rounded-sm mr-2" />
                        <div className="h-1.5 w-12 bg-emerald-200/20 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#F59E0B] rounded-md" />
                    </div>
                    <p className="font-semibold text-sm">Royal Emerald</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Deep forest green with radiant gold details.
                    </p>
                  </div>

                  {/* Cyber Neon */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "neon_cyber" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "neon_cyber" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#0D0E15] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-cyan-500/20">
                      <div className="w-full bg-[#161926] h-6 rounded-md mb-2 flex items-center px-2">
                        <div className="size-3 bg-[#06B6D4] rounded-sm mr-2" />
                        <div className="h-1.5 w-16 bg-cyan-200/20 rounded-full" />
                      </div>
                      <div className="w-full bg-[#161926] h-6 rounded-md flex items-center px-2">
                        <div className="size-3 bg-[#06B6D4] rounded-sm mr-2" />
                        <div className="h-1.5 w-12 bg-cyan-200/20 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#06B6D4] rounded-md" />
                    </div>
                    <p className="font-semibold text-sm">Cyber Neon</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Futuristic dark canvas with cyan glow.
                    </p>
                  </div>

                  {/* Rose Gold */}
                  <div
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${form.theme === "rose_gold" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setForm({ ...form, theme: "rose_gold" })}
                  >
                    <div className="aspect-[3/4] w-full bg-[#FFF5F5] rounded-lg mb-3 p-3 flex flex-col items-center overflow-hidden border border-[#E11D48]/15">
                      <div className="w-full bg-white h-6 rounded-md mb-2 flex items-center px-2 shadow-sm">
                        <div className="size-3 bg-[#E11D48] rounded-sm mr-2" />
                        <div className="h-1.5 w-16 bg-rose-200/40 rounded-full" />
                      </div>
                      <div className="w-full bg-white h-6 rounded-md flex items-center px-2 shadow-sm">
                        <div className="size-3 bg-[#E11D48] rounded-sm mr-2" />
                        <div className="h-1.5 w-12 bg-rose-200/40 rounded-full" />
                      </div>
                      <div className="mt-auto w-full h-4 bg-[#E11D48] rounded-md" />
                    </div>
                    <p className="font-semibold text-sm">Rose Gold</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Soft blush rose & cream for bakeries & cafes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg border-b pb-2">Ordering Features</h3>
            <p className="text-sm text-muted-foreground">
              Select which order types are available to customers.
            </p>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="delivery-toggle" className="text-base flex items-center gap-2">
                  Delivery
                  {!feat.delivery && (
                    <span className="text-[10px] bg-[#F5A623]/15 text-[#D99A2B] px-2 py-0.5 rounded-full">
                      Premium Plan
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to request delivery.
                </p>
              </div>
              <Switch
                id="delivery-toggle"
                checked={form.delivery && feat.delivery}
                disabled={!feat.delivery}
                onCheckedChange={(v) => setForm({ ...form, delivery: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="takeaway-toggle" className="text-base flex items-center gap-2">
                  Take Away
                  {!feat.take_away && (
                    <span className="text-[10px] bg-[#F5A623]/15 text-[#D99A2B] px-2 py-0.5 rounded-full">
                      Pro Plan
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pick up their orders.
                </p>
              </div>
              <Switch
                id="takeaway-toggle"
                checked={form.takeaway && feat.take_away}
                disabled={!feat.take_away}
                onCheckedChange={(v) => setForm({ ...form, takeaway: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="ontable-toggle" className="text-base flex items-center gap-2">
                  On-Table Dining
                  {!feat.on_table && (
                    <span className="text-[10px] bg-[#F5A623]/15 text-[#D99A2B] px-2 py-0.5 rounded-full">
                      Pro Plan
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to dine in at a specific table.
                </p>
              </div>
              <Switch
                id="ontable-toggle"
                checked={form.on_table && feat.on_table}
                disabled={!feat.on_table}
                onCheckedChange={(v) => setForm({ ...form, on_table: v })}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t">
            {/* Logo Section */}
            <div className="space-y-3">
              <Label htmlFor="s-logo" className="font-semibold text-sm">
                Shop Logo
              </Label>
              <div className="flex items-center gap-4 p-3 rounded-xl border bg-muted/30">
                <div className="size-16 rounded-xl border overflow-hidden bg-background shrink-0 flex items-center justify-center shadow-sm relative">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground opacity-50 font-medium">
                      No Logo
                    </span>
                  )}
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <Input
                    id="s-logo"
                    type="file"
                    accept="image/*"
                    className="text-xs h-9 cursor-pointer"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload("logo_url", f);
                    }}
                  />
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => removeMedia("logo_url")}
                      className="text-xs text-red-500 hover:underline font-medium block"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover Banner Section */}
            <div className="space-y-3">
              <Label htmlFor="s-cover" className="font-semibold text-sm">
                Cover Banner Image
              </Label>
              <div className="space-y-3 p-3 rounded-xl border bg-muted/30">
                <div className="h-16 w-full rounded-lg border overflow-hidden bg-background flex items-center justify-center shadow-sm relative">
                  {form.cover_url ? (
                    <img
                      src={form.cover_url}
                      alt="Cover banner preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground opacity-50 font-medium">
                      No Cover Banner
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Input
                    id="s-cover"
                    type="file"
                    accept="image/*"
                    className="text-xs h-9 cursor-pointer flex-1"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload("cover_url", f);
                    }}
                  />
                  {form.cover_url && (
                    <button
                      type="button"
                      onClick={() => removeMedia("cover_url")}
                      className="text-xs text-red-500 hover:underline font-medium shrink-0"
                    >
                      Remove banner
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-sm px-6 h-10 shadow-md transition-all"
          >
            {saving ? "Saving changes…" : "Save changes"}
          </Button>
          <p className="text-xs text-muted-foreground">Public link: /shop/{shop.slug}</p>
        </div>
      )}
    </DashboardShell>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
