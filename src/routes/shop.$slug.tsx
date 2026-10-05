import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Store,
  Clock,
  Link as LinkIcon,
  ChevronRight,
  Star,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Youtube,
  AlertTriangle,
  Eye,
  Compass,
} from "lucide-react";
import { LocationMapModal } from "@/components/LocationMapModal";
import { fetchExactLocationFromCoords } from "@/lib/locationHelper";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UpiPaymentBox } from "@/components/UpiPaymentBox";
import { getPublicShop } from "@/lib/menu.functions";
import { getNicheCategoryIcon } from "@/lib/niche-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  buildWhatsAppOrder,
  detectDevice,
  money,
  planOf,
  subscriptionState,
  shopTiming,
  shopSocialLinks,
  shopGoogleReviewLink,
  shopCartEnabled,
  shopDeliveryEnabled,
  shopTakeawayEnabled,
  shopOnTableEnabled,
  shopEnquiryEnabled,
  shopCodEnabled,
  shopUpiEnabled,
  shopOrderLabels,
  shopCatalogLabel,
  shopItemLabel,
  shopTheme,
  shopFeatures,
  shopLanguages,
  shopMapUrl,
  shopLocationBlinkEnabled,
  shopLocationBadgeLabel,
  getCategoryInstructionsConfig,
  THEME_CONFIG,
  type CartLine,
  type Coupon,
  type MenuItem,
  type Shop,
  type ThemeId,
} from "@/lib/shop";
import { getFoodImageUrl } from "@/lib/foodImage";
import { GoogleReviewModal } from "@/components/GoogleReviewModal";

export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicShop({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Menu unavailable — MY Link QR" }, { name: "robots", content: "noindex" }],
      };
    }
    const { shop } = loaderData;
    const catalogLabel = shopCatalogLabel(shop as unknown as Shop);
    const title = `${shop.name} — ${catalogLabel}`;
    const description =
      shop.tagline ??
      `Browse the live ${catalogLabel.toLowerCase()} of ${shop.name} and order on WhatsApp.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <Fallback text="This menu could not be loaded." />,
  notFoundComponent: () => <Fallback text="This menu does not exist or is no longer active." />,
  component: PublicMenu,
});

function Fallback({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#100C09] px-6 text-center text-white">
      <div>
        <h1 className="font-display text-2xl font-semibold">Menu unavailable</h1>
        <p className="mt-2 text-sm text-white/60">{text}</p>
        <Button asChild className="mt-6 bg-[#FFC45A] text-[#100C09] hover:bg-[#FFC45A]/90">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

function PublicMenu() {
  const data = Route.useLoaderData();
  const [shop, setShop] = useState<Shop>(data.shop as unknown as Shop);
  const [items, setItems] = useState<MenuItem[]>(data.items as unknown as MenuItem[]);
  const [categories, setCategories] = useState(data.categories);

  useEffect(() => {
    if (data.shop) setShop(data.shop as unknown as Shop);
    if (data.items) setItems(data.items as unknown as MenuItem[]);
    if (data.categories) setCategories(data.categories);
  }, [data]);

  // Multi-tier real-time synchronization for public shop page
  useEffect(() => {
    if (!shop?.id) return;

    const handleSync = async () => {
      try {
        const { data: updated } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shop.id)
          .maybeSingle();
        if (updated) {
          setShop(updated as unknown as Shop);
        }
      } catch (err) {
        console.error("Realtime public shop refetch error:", err);
      }
    };

    // 1. BroadcastChannel (0ms instant cross-tab sync)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("mylink_realtime_sync");
      bc.onmessage = (e) => {
        if (!e.data?.shopId || e.data.shopId === shop.id) {
          handleSync();
        }
      };
    } catch {}

    // 2. Storage event listener
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mylink_last_shop_update" || !e.key) {
        handleSync();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Supabase Realtime channel push
    const topic = `realtime-public-shop-${shop.id}-${Math.random().toString(36).substring(2, 7)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "shops",
            filter: `id=eq.${shop.id}`,
          },
          (payload) => {
            if (payload.new && typeof payload.new === "object") {
              setShop(payload.new as unknown as Shop);
            } else {
              handleSync();
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime public shop subscription error:", err);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [shop?.id]);

  const subState = subscriptionState(shop);
  const isSuspendedOrExpired =
    shop.status === "suspended" || subState === "expired" || subState === "suspended";

  if (isSuspendedOrExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080C14] px-6 text-center text-white">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-[#0F1626] p-8 shadow-2xl space-y-4">
          <AlertTriangle className="size-12 text-rose-500 mx-auto" />
          <h1 className="font-display text-2xl font-bold">Shop Menu Unavailable</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This shop menu is currently inactive or temporarily suspended. Please contact the
            business owner or platform administrator.
          </p>
          <Button
            asChild
            className="bg-[#00E676] text-[#080C14] font-bold hover:bg-[#00E676]/90 rounded-xl"
          >
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  const features = shopFeatures(shop);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const themeId = shopTheme(shop);
  const theme = THEME_CONFIG[themeId];

  const isDelivery = shopDeliveryEnabled(shop);
  const isTakeaway = shopTakeawayEnabled(shop);
  const isOnTable = shopOnTableEnabled(shop);
  const isEnquiry = shopEnquiryEnabled(shop);
  const orderLabels = shopOrderLabels(shop);

  const languages = shopLanguages(shop);
  const isMultiLanguageEnabled =
    features.multi_language &&
    (shop.features as Record<string, unknown> | null)?.["multi_language_enabled"] !== false;
  const showTranslate =
    isMultiLanguageEnabled &&
    languages.length > 0 &&
    !(languages.length === 1 && languages[0] === "en");

  const defaultOrderType = isDelivery
    ? "delivery"
    : isTakeaway
      ? "takeaway"
      : isOnTable
        ? "on_table"
        : isEnquiry
          ? "enquiry"
          : "delivery";
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "on_table" | "enquiry">(
    defaultOrderType,
  );
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");

  // Keep orderType and paymentMethod synced with real-time shop settings updates
  useEffect(() => {
    const isDel = shopDeliveryEnabled(shop);
    const isTak = shopTakeawayEnabled(shop);
    const isTab = shopOnTableEnabled(shop);
    const isEnq = shopEnquiryEnabled(shop);

    const validOrderTypes: ("delivery" | "takeaway" | "on_table" | "enquiry")[] = [];
    if (isDel) validOrderTypes.push("delivery");
    if (isTak) validOrderTypes.push("takeaway");
    if (isTab) validOrderTypes.push("on_table");
    if (isEnq) validOrderTypes.push("enquiry");

    if (validOrderTypes.length > 0 && !validOrderTypes.includes(orderType)) {
      setOrderType(validOrderTypes[0]!);
    }

    const isCod = shopCodEnabled(shop);
    const isUpi = shopUpiEnabled(shop);

    if (paymentMethod === "cod" && !isCod && isUpi) {
      setPaymentMethod("upi");
    } else if (paymentMethod === "upi" && !isUpi && isCod) {
      setPaymentMethod("cod");
    }
  }, [shop]);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [gpsLink, setGpsLink] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 17.385044,
    lng: 78.486671,
  });

  const fetchLocation = () => {
    setIsLocating(true);

    const tryIpLocation = async (message: string) => {
      try {
        const res = await fetch("https://freeipapi.com/api/json");
        if (res.ok) {
          const data = await res.json();
          if (data && (data.cityName || data.regionName)) {
            const city = data.cityName || "";
            const region = data.regionName || "";
            const pincode = data.zipCode || "";
            const address = [city, region].filter(Boolean).join(", ");

            if (city) setDeliveryCity(city);
            if (pincode) setDeliveryPincode(pincode);
            if (address) setDeliveryAddress(address);

            toast.success(message);
            setIsLocating(false);
            return true;
          }
        }
      } catch (err) {
        console.warn("IP Geolocation error:", err);
      }

      setIsLocating(false);
      toast.error("Could not auto-detect location. Please select your exact location on the map.");
      return false;
    };

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });

          const result = await fetchExactLocationFromCoords(latitude, longitude);
          setGpsLink(result.gpsLink);
          if (result.address) setDeliveryAddress(result.address);
          if (result.city) setDeliveryCity(result.city);
          if (result.pincode) setDeliveryPincode(result.pincode);

          setIsLocating(false);
          toast.success("🎯 Exact location captured via GPS!");
        },
        async (error) => {
          console.warn("GPS Geolocation error/denied:", error);
          void tryIpLocation("Location detected via Network / IP!");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    } else {
      void tryIpLocation("Location detected via Network / IP!");
    }
  };

  const handleOrderTypeChange = (v: "delivery" | "takeaway" | "on_table" | "enquiry") => {
    setOrderType(v);
  };

  const router = useRouter();

  useEffect(() => {
    const isScan =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("src") === "qr";
    supabase
      .from("analytics_events")
      .insert({ shop_id: shop.id, event_type: isScan ? "scan" : "view", device: detectDevice() })
      .then(() => undefined);
  }, [shop.id]);

  function mergeShop(prev: Shop, updated: Partial<Shop>): Shop {
    const mergedFeatures =
      updated.features !== undefined
        ? (updated.features as Record<string, any> | null)
        : (prev.features ?? null);
    return {
      ...prev,
      ...updated,
      features: mergedFeatures,
    };
  }

  useEffect(() => {
    if (!showTranslate) return;

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: languages.join(","),

          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }

      delete (window as any).googleTranslateElementInit;
    };
  }, [showTranslate, languages]);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty }))
        .filter((l) => l.item && l.qty > 0),
    [cart, items],
  );

  const subtotal = lines.reduce((s, l) => s + (l.item.discount_price ?? l.item.price) * l.qty, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.min_order && subtotal < appliedCoupon.min_order) {
      // automatically remove or ignore if subtotal drops
      discountAmount = 0;
    } else {
      if (appliedCoupon.type === "percent") {
        discountAmount = subtotal * (appliedCoupon.value / 100);
      } else {
        discountAmount = appliedCoupon.value;
      }
    }
  }
  const total = Math.max(0, subtotal - discountAmount);

  const isViewOnly = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const order = params.get("order");
    return mode === "view" || mode === "view_only" || mode === "product" || order === "false";
  }, []);

  const visible = items.filter(
    (i) => i.is_available && (active === "all" || i.category_id === active),
  );
  const isCartEnabled = shopCartEnabled(shop);
  const canOrder = !isViewOnly && features.ordering && isCartEnabled && !!shop.whatsapp;

  function change(id: string, delta: number) {
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));
  }

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.text} pb-32 font-sans ${theme.selection} transition-colors duration-500`}
    >
      {showTranslate && (
        <div className="fixed top-4 right-4 z-50 rounded-lg overflow-hidden shadow-lg border border-white/20 bg-background/80 backdrop-blur-md p-2">
          <div id="google_translate_element"></div>
        </div>
      )}

      {/* Banner */}
      <header className="relative isolate h-56 w-full overflow-hidden sm:h-72">
        {shop.cover_url ? (
          <img
            src={shop.cover_url}
            alt={`${shop.name} cover`}
            className="absolute inset-0 size-full object-cover object-center"
          />
        ) : (
          <div className={`absolute inset-0 ${theme.accent} opacity-10`} />
        )}
        <div
          className={`absolute inset-0 bg-gradient-to-t ${theme.headerGradient} to-transparent`}
        />
      </header>

      <div className="mx-auto -mt-20 max-w-4xl px-4 relative z-10">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border ${theme.border} ${theme.card} p-5 sm:p-6 backdrop-blur-xl shadow-xl transition-all duration-500 space-y-5`}
        >
          {/* Tier 1: Main Business Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} shadow-md flex items-center justify-center`}
              >
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={`${shop.name} logo`}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className={`grid size-full place-items-center ${theme.textMuted}`}>
                    <Store className="size-8 text-amber-500 opacity-80" />
                  </span>
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className={`truncate font-display text-2xl sm:text-3xl font-bold tracking-tight ${theme.text}`}
                  >
                    {shop.name}
                  </h1>
                  {shop.niche && (
                    <span className="text-[11px] bg-amber-500/15 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                      {shop.niche}
                    </span>
                  )}
                </div>
                {shop.tagline && (
                  <p className={`text-xs sm:text-sm leading-relaxed ${theme.textMuted}`}>
                    {shop.tagline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tier 2: Location, Phone & Timing Bar */}
          <div className={`pt-3 border-t ${theme.border} flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-[13px] ${theme.textMuted}`}>
            {shop.address && (
              <div className="inline-flex items-center gap-2 flex-wrap min-w-0">
                <span className="inline-flex items-center gap-1.5 font-medium truncate">
                  <MapPin className={`size-4 shrink-0 ${theme.accentText}`} />
                  <a
                    href={
                      shopMapUrl(shop) ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address + " " + shop.name)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`transition-colors hover:underline ${theme.textMutedHover} truncate`}
                  >
                    {shop.address}
                  </a>
                </span>
                {shopLocationBlinkEnabled(shop) && (
                  <a
                    href={
                      shopMapUrl(shop) ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address + " " + shop.name)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 shadow-md shadow-amber-400/25 border border-amber-300/80 animate-pulse transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    title="Click for exact Google Maps store location"
                  >
                    <span className="size-2 rounded-full bg-red-600 animate-ping shrink-0" />
                    <span>{shopLocationBadgeLabel(shop)}</span>
                    <Compass className="size-3 text-black/80 shrink-0 ml-0.5" />
                  </a>
                )}
              </div>
            )}

            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className={`inline-flex items-center gap-1.5 font-medium transition-colors hover:underline ${theme.textMutedHover}`}
              >
                <Phone className={`size-3.5 shrink-0 ${theme.accentText}`} />
                <span>{shop.phone}</span>
              </a>
            )}

            {shopTiming(shop) && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className={`size-3.5 shrink-0 ${theme.accentText}`} />
                <span>{shopTiming(shop)}</span>
              </span>
            )}
          </div>

          {/* Tier 3: Social & Community Channels Bar */}
          {(() => {
            const socials = shopSocialLinks(shop);
            const reviewLink = shopGoogleReviewLink(shop);
            const hasSocials =
              socials.whatsapp_group ||
              socials.youtube ||
              socials.instagram ||
              socials.facebook ||
              socials.twitter ||
              socials.website ||
              reviewLink;

            if (!hasSocials) return null;

            return (
              <div className={`pt-3 border-t ${theme.border} flex flex-wrap items-center gap-2 sm:gap-2.5`}>
                {socials.whatsapp_group && (
                  <a
                    href={socials.whatsapp_group}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-xs font-bold text-emerald-500 hover:bg-emerald-500/25 transition-all hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <MessageCircle className="size-3.5 shrink-0 text-emerald-500" />
                    <span>Join WhatsApp Group</span>
                  </a>
                )}

                {reviewLink && (
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 px-3 py-1 text-xs font-bold text-amber-500 hover:bg-amber-500/25 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>Google Review</span>
                  </button>
                )}

                {socials.youtube && (
                  <a
                    href={socials.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/35 px-3 py-1 text-xs font-bold text-red-500 hover:bg-red-500/25 transition-all hover:scale-105 active:scale-95 shadow-xs"
                  >
                    <Youtube className="size-3.5 shrink-0 text-red-500" />
                    <span>YouTube</span>
                  </a>
                )}

                {socials.instagram && (
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${theme.border} bg-muted/20 hover:bg-muted/40 transition-all hover:scale-105 active:scale-95 ${theme.text}`}
                  >
                    <Instagram className="size-3.5 shrink-0 text-pink-500" />
                    <span>Instagram</span>
                  </a>
                )}

                {socials.facebook && (
                  <a
                    href={socials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${theme.border} bg-muted/20 hover:bg-muted/40 transition-all hover:scale-105 active:scale-95 ${theme.text}`}
                  >
                    <Facebook className="size-3.5 shrink-0 text-blue-500" />
                    <span>Facebook</span>
                  </a>
                )}

                {socials.twitter && (
                  <a
                    href={socials.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${theme.border} bg-muted/20 hover:bg-muted/40 transition-all hover:scale-105 active:scale-95 ${theme.text}`}
                  >
                    <Twitter className="size-3.5 shrink-0 text-sky-400" />
                    <span>Twitter / X</span>
                  </a>
                )}

                {socials.website && (
                  <a
                    href={socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${theme.border} bg-muted/20 hover:bg-muted/40 transition-all hover:scale-105 active:scale-95 ${theme.text}`}
                  >
                    <Globe className="size-3.5 shrink-0 text-indigo-400" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            );
          })()}
        </motion.section>

        {/* Sticky Categories */}
        <div
          className={`no-scrollbar sticky top-0 z-40 -mx-4 mt-6 flex gap-3 overflow-x-auto ${theme.bg}/90 px-4 py-4 backdrop-blur-md border-b ${theme.border}`}
        >
          <Chip
            label="All"
            active={active === "all"}
            onClick={() => setActive("all")}
            theme={theme}
            niche={shop.niche}
          />
          {categories.map((c: any) => (
            <Chip
              key={c.id}
              label={c.name}
              active={active === c.id}
              onClick={() => setActive(c.id)}
              theme={theme}
              niche={shop.niche}
            />
          ))}
        </div>

        {/* Menu Grid */}
        <motion.div
          key={active}
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
        >
          {visible.length === 0 && (
            <div
              className={`col-span-full rounded-xl border ${theme.border} ${theme.card} p-8 text-center text-sm ${theme.textMuted}`}
            >
              No items in this section yet.
            </div>
          )}
          {visible.map((item) => (
            <motion.article
              variants={itemAnim}
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-xl border ${theme.border} ${theme.card} transition-all ${item.is_available === false ? "opacity-75" : ""}`}
            >
              <div className={`relative aspect-square w-full ${theme.bg}`}>
                <img
                  src={item.image_url || getFoodImageUrl(item.name, "")}
                  alt={item.name}
                  loading="lazy"
                  className={`size-full object-cover transition-transform duration-500 hover:scale-105 ${item.is_available === false ? "opacity-50 grayscale" : ""}`}
                />
                {item.is_available === false && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2">
                    <span className="bg-red-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-lg tracking-wider">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h2 className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</h2>
                {item.description && (
                  <p className={`mt-1.5 line-clamp-1 text-xs ${theme.textMuted}`}>
                    {item.description}
                  </p>
                )}

                <div className="mt-auto pt-4 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`whitespace-nowrap font-bold text-[15px] ${theme.text}`}>
                      {money(item.discount_price ?? item.price, shop.currency)}
                    </p>
                    {item.discount_price !== null && item.discount_price !== item.price && (
                      <p className={`text-[11px] ${theme.textMuted} line-through`}>
                        {money(item.price, shop.currency)}
                      </p>
                    )}
                  </div>

                  {item.is_available === false ? (
                    <span className="h-8 rounded-md px-3 text-[11px] font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center cursor-not-allowed select-none">
                      Sold Out
                    </span>
                  ) : canOrder ? (
                    (cart[item.id] ?? 0) > 0 ? (
                      <div
                        className={`flex h-8 items-center rounded-md border ${theme.border} ${theme.cartBtn} overflow-hidden text-sm`}
                      >
                        <button
                          aria-label="Remove one"
                          className={`flex h-full items-center justify-center px-2.5 ${theme.accentText} ${theme.cartBtnHover} transition-colors`}
                          onClick={() => change(item.id, -1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className={`w-5 text-center text-xs font-bold ${theme.accentText}`}>
                          {cart[item.id]}
                        </span>
                        <button
                          aria-label="Add one"
                          className={`flex h-full items-center justify-center px-2.5 ${theme.accentText} ${theme.cartBtnHover} transition-colors`}
                          onClick={() => change(item.id, 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className={`h-8 rounded-md px-4 text-xs font-bold uppercase tracking-wider transition-all ${theme.addBtn} ${theme.addBtnHover}`}
                        onClick={() => change(item.id, 1)}
                      >
                        Add
                      </Button>
                    )
                  ) : null}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {shopGoogleReviewLink(shop) && (
          <div className="mt-8 text-center">
            <a
              href={shopGoogleReviewLink(shop)}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2 rounded-xl border ${theme.border} ${theme.card} px-4 py-2 text-xs font-medium ${theme.text} shadow-sm transition hover:scale-105`}
            >
              <Star className="size-4 fill-amber-400 text-amber-400 shrink-0" />
              Enjoyed your visit? Rate us on Google
            </a>
          </div>
        )}

        <div
          className={`border-t ${theme.border} mt-10 pt-6 pb-4 text-center text-xs ${theme.textMuted}`}
        >
          <span className="text-gray-400">Powered by</span>{" "}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 font-display font-semibold hover:underline"
          >
            MY Link QR
          </Link>
        </div>
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {canOrder && lines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed inset-x-0 bottom-0 z-50 p-4 pb-6 pointer-events-none"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`mx-auto flex max-w-[400px] cursor-pointer items-center justify-between overflow-hidden rounded-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] pointer-events-auto ${theme.cartBg} ${theme.cartText}`}
              onClick={() => setIsCartOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-lg bg-black/10`}
                >
                  <ShoppingBag className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold opacity-90 uppercase tracking-wide">
                    {lines.length} item{lines.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-lg font-bold tracking-tight">
                    {money(total, shop.currency)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 pl-4 pr-2 text-base font-bold tracking-tight">
                View Cart <ChevronRight className="size-5" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent
          className={`w-[calc(100vw-1.25rem)] max-w-lg max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-2xl ${theme.card} ${theme.text} ${theme.border}`}
        >
          <DialogHeader className="pb-2 border-b border-white/5">
            <DialogTitle className="text-xl font-display font-bold">Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-4">
              {lines.map((l) => (
                <div key={l.item.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[15px]">{l.item.name}</p>
                    <p className={`text-sm font-medium ${theme.accentText}`}>
                      {money(l.item.discount_price ?? l.item.price, shop.currency)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-3 rounded-md border ${theme.border} ${theme.bg} px-2 py-1`}
                  >
                    <button
                      aria-label="Remove one"
                      className={`${theme.textMuted} ${theme.textMutedHover}`}
                      onClick={() => change(l.item.id, -1)}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{cart[l.item.id]}</span>
                    <button
                      aria-label="Add one"
                      className={`${theme.textMuted} ${theme.textMutedHover}`}
                      onClick={() => change(l.item.id, 1)}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
              {lines.length === 0 && (
                <p className={`text-center text-sm py-4 ${theme.textMuted}`}>Your cart is empty.</p>
              )}
            </div>

            {lines.length > 0 && (
              <div className={`pt-4 border-t ${theme.border}`}>
                {(isDelivery || isTakeaway || isOnTable || isEnquiry) && (
                  <div className="space-y-3 mb-6">
                    <Label
                      className={`${theme.textMuted} uppercase text-xs tracking-wider font-bold`}
                    >
                      Order / Enquiry Type
                    </Label>
                    <RadioGroup
                      value={orderType}
                      onValueChange={handleOrderTypeChange}
                      className="flex flex-wrap gap-4"
                    >
                      {isDelivery && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="delivery"
                            id="delivery"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label htmlFor="delivery" className="font-medium cursor-pointer">
                            {orderLabels.delivery}
                          </Label>
                        </div>
                      )}
                      {isTakeaway && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="takeaway"
                            id="takeaway"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label htmlFor="takeaway" className="font-medium cursor-pointer">
                            {orderLabels.takeaway}
                          </Label>
                        </div>
                      )}
                      {isOnTable && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="on_table"
                            id="on_table"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label htmlFor="on_table" className="font-medium cursor-pointer">
                            {orderLabels.on_table}
                          </Label>
                        </div>
                      )}
                      {isEnquiry && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="enquiry"
                            id="enquiry"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label htmlFor="enquiry" className="font-medium cursor-pointer">
                            {orderLabels.enquiry}
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                {orderType === "delivery" && isDelivery && (
                  <div
                    className={`space-y-4 rounded-xl border ${theme.border} ${theme.bg} p-4 mb-6`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Label
                          htmlFor="delivery-address"
                          className={`${theme.accentText} font-semibold flex items-center gap-1.5`}
                        >
                          <MapPin className="size-4" />
                          Delivery Address
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                            onClick={() => setMapModalOpen(true)}
                          >
                            <Compass className="mr-1 size-3.5 text-amber-400" />
                            Pick on Map
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className={`h-7 text-xs font-bold ${theme.cartBg} ${theme.cartText} opacity-90 hover:opacity-100 cursor-pointer`}
                            onClick={fetchLocation}
                            disabled={isLocating}
                          >
                            <MapPin className="mr-1 size-3" />
                            {isLocating ? "Locating..." : "Use GPS"}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="delivery-address"
                        placeholder="House / Flat no., Building name, Street, Landmark"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                      />
                      {gpsLink && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 mt-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="size-3.5 shrink-0 text-emerald-400" />
                            <span className="truncate">Exact GPS Pin Attached</span>
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <button
                              type="button"
                              onClick={() => setMapModalOpen(true)}
                              className="text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <Compass className="size-3" /> Adjust Pin
                            </button>
                            <a
                              href={gpsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-emerald-300 shrink-0 font-bold"
                            >
                              View Map ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delivery-city" className={theme.textMuted}>
                          City
                        </Label>
                        <Input
                          id="delivery-city"
                          placeholder="City"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delivery-pincode" className={theme.textMuted}>
                          Pincode
                        </Label>
                        <Input
                          id="delivery-pincode"
                          placeholder="6-digit"
                          value={deliveryPincode}
                          onChange={(e) => setDeliveryPincode(e.target.value)}
                          className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name" className={theme.textMuted}>
                      Your Name
                    </Label>
                    <Input
                      id="customer-name"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone" className={theme.textMuted}>
                      WhatsApp Phone Number
                    </Label>
                    <Input
                      id="customer-phone"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                    />
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const categoryInstructions = getCategoryInstructionsConfig(shop.niche);
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="special-instructions" className={theme.textMuted}>
                              Special Instructions (Optional)
                            </Label>
                            {shop.niche && (
                              <span className="text-[10px] text-amber-500/80 font-medium tracking-wide">
                                ✨ {shop.niche} Quick Add
                              </span>
                            )}
                          </div>
                          <Textarea
                            id="special-instructions"
                            placeholder={categoryInstructions.placeholder}
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {categoryInstructions.chips.map((chip, idx) => {
                              const isSelected = specialInstructions.includes(chip);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSpecialInstructions((prev) => {
                                      if (!prev.trim()) return chip;
                                      if (prev.includes(chip)) return prev;
                                      return `${prev}, ${chip}`;
                                    });
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 active:scale-95 flex items-center gap-1 ${
                                    isSelected
                                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium shadow-sm"
                                      : `border-white/10 hover:border-white/20 hover:bg-white/5 ${theme.textMuted}`
                                  }`}
                                >
                                  {chip}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {features.coupons && (
                  <div
                    className={`space-y-3 mb-6 p-4 rounded-xl border ${theme.border} bg-black/5`}
                  >
                    <Label className={theme.textMuted}>Discount Code</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        className={`bg-transparent ${theme.border} ${theme.text}`}
                        disabled={!!appliedCoupon}
                      />
                      {!appliedCoupon ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const rawCoupons = (shop.features as Record<string, unknown> | null)?.[
                              "coupons"
                            ];
                            const shopCoupons = Array.isArray(rawCoupons)
                              ? (rawCoupons as Coupon[])
                              : [];
                            const found = shopCoupons.find((c) => c.code === couponCode);
                            if (!found) {
                              setCouponError("Invalid coupon code");
                              return;
                            }
                            if (found.min_order && subtotal < found.min_order) {
                              setCouponError(
                                `Minimum order amount is ${money(found.min_order, shop.currency)}`,
                              );
                              return;
                            }
                            if (
                              found.expires_at &&
                              new Date(found.expires_at).getTime() < Date.now()
                            ) {
                              setCouponError("This coupon has expired");
                              return;
                            }
                            setAppliedCoupon(found);
                            setCouponError("");
                          }}
                        >
                          Apply
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCode("");
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 font-medium">{couponError}</p>
                    )}
                    {appliedCoupon && discountAmount > 0 && (
                      <p className="text-sm font-medium text-green-500">
                        Coupon applied: -{money(discountAmount, shop.currency)}
                      </p>
                    )}
                  </div>
                )}

                {orderType !== "enquiry" && (shopCodEnabled(shop) || shopUpiEnabled(shop)) && (
                  <div
                    className={`space-y-3 mb-6 p-4 rounded-xl border ${theme.border} bg-black/5`}
                  >
                    <Label
                      className={`${theme.textMuted} uppercase text-xs tracking-wider font-bold`}
                    >
                      Payment Method
                    </Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(val: any) => setPaymentMethod(val)}
                      className="flex flex-wrap gap-4"
                    >
                      {shopCodEnabled(shop) && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="cod"
                            id="pm-cod"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label
                            htmlFor="pm-cod"
                            className="font-medium cursor-pointer flex items-center gap-1.5 text-sm"
                          >
                            💵 Cash on Delivery (COD)
                          </Label>
                        </div>
                      )}
                      {shopUpiEnabled(shop) && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="upi"
                            id="pm-upi"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label
                            htmlFor="pm-upi"
                            className="font-medium cursor-pointer flex items-center gap-1.5 text-sm"
                          >
                            💳 UPI Pay (GPay / PhonePe / QR)
                          </Label>
                        </div>
                      )}
                    </RadioGroup>

                    {paymentMethod === "cod" && shopCodEnabled(shop) && (
                      <div className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 mt-2">
                        💵 Cash on Delivery selected. You will pay cash upon receiving your order.
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "upi" && shopUpiEnabled(shop) && orderType !== "enquiry" && (
                  <UpiPaymentBox
                    upiId={
                      ((shop.features as Record<string, unknown> | null)?.["upi_id"] as string) ||
                      ""
                    }
                    upiQrUrl={
                      (shop.features as Record<string, unknown> | null)?.["upi_qr_url"] as
                        string | null
                    }
                    shopName={shop.name}
                    amount={total}
                    currency={shop.currency}
                    className="mb-6"
                  />
                )}

                <div className="pt-2">
                  <Button
                    asChild
                    className={`w-full h-12 text-base font-bold rounded-xl ${theme.cartBg} ${theme.cartText} opacity-90 hover:opacity-100`}
                  >
                    <a
                      href={buildWhatsAppOrder(shop, lines, {
                        type: orderType,
                        name: customerName,
                        phone: customerPhone,
                        notes: specialInstructions,
                        ...(appliedCoupon && discountAmount > 0 ? { coupon: appliedCoupon } : {}),
                        location:
                          orderType === "delivery"
                            ? [deliveryAddress, deliveryCity, deliveryPincode]
                                .filter(Boolean)
                                .join(", ")
                            : null,
                        gpsLink: orderType === "delivery" ? gpsLink : null,
                        paymentMethod:
                          orderType === "enquiry"
                            ? null
                            : paymentMethod === "cod"
                              ? "Cash on Delivery (COD)"
                              : "UPI Pay",
                      })}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        setIsCartOpen(false);
                        setTimeout(() => {
                          setReviewModalOpen(true);
                          setCart({});
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }, 500);
                      }}
                    >
                      <MessageCircle className="mr-2 size-5" />
                      {orderType === "enquiry" ? "Send Enquiry" : "Send Order"} (
                      {money(total, shop.currency)})
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Review Modal */}
      <GoogleReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        shop={{
          id: shop.id,
          name: shop.name,
          logo_url: shop.logo_url,
          niche: shop.niche,
          googleReviewLink: shopGoogleReviewLink(shop) ?? null,
        }}
      />

      {/* Interactive Location Map Picker Modal */}
      <LocationMapModal
        open={mapModalOpen}
        onOpenChange={setMapModalOpen}
        initialLat={currentCoords.lat}
        initialLng={currentCoords.lng}
        onSelectLocation={(res) => {
          setDeliveryAddress(res.address);
          setDeliveryCity(res.city);
          setDeliveryPincode(res.pincode);
          setGpsLink(res.gpsLink);
          setCurrentCoords({ lat: res.latitude, lng: res.longitude });
        }}
      />
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  theme,
  niche,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  theme: any;
  niche?: string;
}) {
  const Icon = getNicheCategoryIcon(niche, label);
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
        active
          ? `border-transparent ${theme.accent} ${theme.cartText}`
          : `${theme.border} bg-transparent ${theme.textMuted} ${theme.textMutedHover}`
      }`}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{label}</span>
    </motion.button>
  );
}
