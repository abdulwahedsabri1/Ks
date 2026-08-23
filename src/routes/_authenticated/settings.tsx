import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop, uploadShopMedia } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  NICHES,
  shopTiming,
  shopSocialLink,
  shopDeliveryEnabled,
  shopTakeawayEnabled,
  shopOnTableEnabled,
  shopTheme,
  type ThemeId,
} from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Shop Settings — My QR Link" },
      {
        name: "description",
        content: "Update your shop name, branding, WhatsApp number and currency.",
      },
      { property: "og:title", content: "Shop Settings — My QR Link" },
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
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    niche: NICHES[0]!,
    whatsapp: "",
    phone: "",
    address: "",
    currency: "₹",
    timing: "",
    social_link: "",
    delivery: true,
    takeaway: true,
    on_table: true,
    theme: "luxury_dark" as ThemeId,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setForm({
      name: shop.name,
      tagline: shop.tagline ?? "",
      niche: shop.niche,
      whatsapp: shop.whatsapp ?? "",
      phone: shop.phone ?? "",
      address: shop.address ?? "",
      currency: shop.currency ?? "₹",
      timing: shopTiming(shop) ?? "",
      social_link: shopSocialLink(shop) ?? "",
      delivery: shopDeliveryEnabled(shop),
      takeaway: shopTakeawayEnabled(shop),
      on_table: shopOnTableEnabled(shop),
      theme: shopTheme(shop),
    });
  }, [shop]);

  async function save() {
    if (!shop) return;
    setSaving(true);

    const currentFeatures = shop.features || {};
    const updatedFeatures = {
      ...currentFeatures,
      timing: form.timing.trim() || undefined,
      social_link: form.social_link.trim() || undefined,
      delivery: form.delivery,
      takeaway: form.takeaway,
      on_table: form.on_table,
      theme: form.theme,
    };

    // Clean up undefined properties from features before saving
    Object.keys(updatedFeatures).forEach((key) => {
      const k = key as keyof typeof updatedFeatures;
      if (updatedFeatures[k] === undefined) {
        delete updatedFeatures[k];
      }
    });

    const { error } = await supabase
      .from("shops")
      .update({
        name: form.name.trim(),
        tagline: form.tagline.trim() || null,
        niche: form.niche,
        whatsapp: form.whatsapp.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        currency: form.currency || "₹",
        features: updatedFeatures,
      })
      .eq("id", shop.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["my-shop"] });
  }

  async function upload(kind: "logo_url" | "cover_url", file?: File) {
    if (!shop || !file) return;
    try {
      const url = await uploadShopMedia(file, shop.id);
      const patch = kind === "logo_url" ? { logo_url: url } : { cover_url: url };
      const { error } = await supabase.from("shops").update(patch).eq("id", shop.id);
      if (error) throw error;
      toast.success("Image updated");
      qc.invalidateQueries({ queryKey: ["my-shop"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
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
            id="s-timing"
            label="Opening Hours (e.g. Mon-Sun, 9am-10pm)"
            value={form.timing}
            onChange={(v) => setForm({ ...form, timing: v })}
          />
          <Text
            id="s-social"
            label="Social Media Link (e.g. Instagram URL)"
            value={form.social_link}
            onChange={(v) => setForm({ ...form, social_link: v })}
          />
          <Text
            id="s-cur"
            label="Currency symbol"
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
          />

          <div className="space-y-4">
            <h3 className="font-medium text-lg border-b pb-2">Appearance & Theme</h3>

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
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg border-b pb-2">Ordering Features</h3>
            <p className="text-sm text-muted-foreground">
              Select which order types are available to customers.
            </p>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="delivery-toggle" className="text-base">
                  Delivery
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to request delivery.
                </p>
              </div>
              <Switch
                id="delivery-toggle"
                checked={form.delivery}
                onCheckedChange={(v) => setForm({ ...form, delivery: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="takeaway-toggle" className="text-base">
                  Take Away
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pick up their orders.
                </p>
              </div>
              <Switch
                id="takeaway-toggle"
                checked={form.takeaway}
                onCheckedChange={(v) => setForm({ ...form, takeaway: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="on-table-toggle" className="text-base">
                  On Table
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to order directly to their table.
                </p>
              </div>
              <Switch
                id="on-table-toggle"
                checked={form.on_table}
                onCheckedChange={(v) => setForm({ ...form, on_table: v })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="s-logo">Logo</Label>
              <Input
                id="s-logo"
                type="file"
                accept="image/*"
                onChange={(e) => upload("logo_url", e.target.files?.[0])}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-cover">Cover image</Label>
              <Input
                id="s-cover"
                type="file"
                accept="image/*"
                onChange={(e) => upload("cover_url", e.target.files?.[0])}
              />
            </div>
          </div>

          <Button onClick={save} disabled={saving}>
            Save changes
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
