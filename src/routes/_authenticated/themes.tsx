import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ExternalLink, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMyShop } from "@/hooks/useShopData";
import { THEME_CONFIG, shopTheme, type ThemeId } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({
    meta: [{ title: "Menu Themes | Dashboard" }],
  }),
  component: ThemesRoute,
});

const THEMES_LIST: {
  id: ThemeId;
  name: string;
  niche: string;
  description: string;
  badge: string;
  previewBg: string;
  previewCard: string;
  previewText: string;
  previewAccent: string;
}[] = [
  {
    id: "luxury_dark",
    name: "Luxury Dark Gold",
    niche: "Fine Dining & Lounges",
    description: "Premium obsidian dark aesthetic with metallic gold accents and warm lighting.",
    badge: "Popular",
    previewBg: "bg-[#100C09]",
    previewCard: "bg-[#18120D]",
    previewText: "text-white",
    previewAccent: "bg-[#FFC45A] text-[#100C09]",
  },
  {
    id: "minimalist_light",
    name: "Minimalist Ivory",
    niche: "Modern Cafés & Bistros",
    description: "Clean, elegant ivory theme with dark slate typography and high readability.",
    badge: "Clean",
    previewBg: "bg-[#F5F0E7]",
    previewCard: "bg-white",
    previewText: "text-[#100C09]",
    previewAccent: "bg-[#100C09] text-white",
  },
  {
    id: "warm_amber",
    name: "Warm Amber & Wood",
    niche: "Bakeries & Coffee Shops",
    description: "Inviting cream background with warm honey amber buttons and smooth shadows.",
    badge: "Cozy",
    previewBg: "bg-[#FFFAF5]",
    previewCard: "bg-white",
    previewText: "text-[#100C09]",
    previewAccent: "bg-[#D99A2B] text-white",
  },
  {
    id: "emerald_bistro",
    name: "Royal Emerald Bistro",
    niche: "Gourmet Restaurants & Steakhouses",
    description: "Deep forest emerald green paired with radiant golden brass details.",
    badge: "New",
    previewBg: "bg-[#062319]",
    previewCard: "bg-[#0B3325]",
    previewText: "text-emerald-50",
    previewAccent: "bg-[#F59E0B] text-[#062319]",
  },
  {
    id: "neon_cyber",
    name: "Cyber Neon Night",
    niche: "Nightclubs, Bars & Food Trucks",
    description: "Futuristic dark midnight canvas with glowing cyan highlights and glass cards.",
    badge: "New",
    previewBg: "bg-[#0D0E15]",
    previewCard: "bg-[#161926]",
    previewText: "text-cyan-50",
    previewAccent: "bg-[#06B6D4] text-[#0D0E15]",
  },
  {
    id: "rose_gold",
    name: "Rose Gold & Cream",
    niche: "Bakeries, Desserts & Tea Rooms",
    description: "Soft blush rose tint with rich berry accents and elegant cream cards.",
    badge: "New",
    previewBg: "bg-[#FFF5F5]",
    previewCard: "bg-white",
    previewText: "text-[#4A1D24]",
    previewAccent: "bg-[#E11D48] text-white",
  },
];

function ThemesRoute() {
  const { data: shop, refetch: refresh } = useMyShop();
  const [busyId, setBusyId] = useState<ThemeId | null>(null);

  const activeThemeId = shopTheme(shop);

  async function applyTheme(themeId: ThemeId) {
    if (!shop) return;
    setBusyId(themeId);
    try {
      const updatedFeatures = {
        ...(shop.features ?? {}),
        theme: themeId,
      };

      const { error } = await supabase
        .from("shops")
        .update({ features: updatedFeatures })
        .eq("id", shop.id);

      if (error) throw error;
      toast.success(`${THEMES_LIST.find((t) => t.id === themeId)?.name} theme applied!`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update theme");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell
      title="Menu Themes & Styles"
      description="Choose a custom design theme for your customer QR digital menu."
      actions={
        shop ? (
          <Button variant="outline" size="sm" asChild>
            <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" /> Live Preview
            </a>
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Palette className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Select Your Public Menu Theme</h2>
              <p className="text-sm text-muted-foreground">
                All 6 themes update your QR menu live in real-time with zero downtime.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {THEMES_LIST.map((theme) => {
            const isActive = activeThemeId === theme.id;
            const isBusy = busyId === theme.id;
            const cfg = THEME_CONFIG[theme.id];

            return (
              <div
                key={theme.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all ${
                  isActive ? "border-primary ring-2 ring-primary/20 shadow-md" : "hover:border-primary/50"
                }`}
              >
                {/* Visual Theme Card Header Preview */}
                <div className={`p-4 ${theme.previewBg} transition-colors border-b border-black/5`}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-80">
                      {theme.niche}
                    </span>
                    <span className="rounded-full bg-white/20 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white uppercase">
                      {theme.badge}
                    </span>
                  </div>

                  {/* Sample Item Card Preview inside Theme Box */}
                  <div className={`rounded-xl border ${cfg.border} ${theme.previewCard} p-3.5 shadow-sm`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className={`font-semibold text-xs ${theme.previewText}`}>Signature Special</p>
                        <p className="text-[10px] opacity-75 line-clamp-1">Fresh ingredients & sauce</p>
                      </div>
                      <span className="font-bold text-xs opacity-90">₹240</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${theme.previewAccent}`}>
                        Add to order
                      </span>
                      <div className="flex gap-1">
                        <span className="size-2.5 rounded-full bg-red-400 inline-block" />
                        <span className="size-2.5 rounded-full bg-amber-400 inline-block" />
                        <span className="size-2.5 rounded-full bg-emerald-400 inline-block" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content & Action Button */}
                <div className="flex flex-1 flex-col justify-between p-5 bg-card">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base">{theme.name}</h3>
                      {isActive && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <Check className="size-3.5" /> Active
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  <div className="mt-5">
                    <Button
                      className="w-full"
                      variant={isActive ? "outline" : "default"}
                      disabled={isActive || isBusy}
                      onClick={() => applyTheme(theme.id)}
                    >
                      {isBusy ? (
                        "Applying..."
                      ) : isActive ? (
                        <span className="flex items-center gap-1.5">
                          <Check className="size-4 text-emerald-500" /> Applied
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="size-4" /> Apply Theme
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
