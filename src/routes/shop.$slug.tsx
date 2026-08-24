import { createFileRoute, Link, notFound } from "@tanstack/react-router";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getPublicShop } from "@/lib/menu.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildWhatsAppOrder,
  detectDevice,
  money,
  planOf,
  shopTiming,
  shopSocialLink,
  shopDeliveryEnabled,
  shopTakeawayEnabled,
  shopOnTableEnabled,
  shopTheme,
  THEME_CONFIG,
  type CartLine,
  type MenuItem,
  type Shop,
  type ThemeId,
} from "@/lib/shop";
import { getFoodImageUrl } from "@/lib/foodImage";

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
    const title = `${shop.name} — Menu`;
    const description =
      shop.tagline ?? `Browse the live menu of ${shop.name} and order on WhatsApp.`;
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
  const shop = data.shop as unknown as Shop;
  const items = data.items as unknown as MenuItem[];
  const categories = data.categories;
  const features = planOf(shop.plan);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string>("all");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const themeId = shopTheme(shop);
  const theme = THEME_CONFIG[themeId];

  const isDelivery = shopDeliveryEnabled(shop);
  const isTakeaway = shopTakeawayEnabled(shop);
  const isOnTable = shopOnTableEnabled(shop);

  const defaultOrderType = isDelivery
    ? "delivery"
    : isTakeaway
      ? "takeaway"
      : isOnTable
        ? "on_table"
        : "delivery";
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "on_table">(
    defaultOrderType,
  );

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            );
            const data = await res.json();

            if (data && data.address) {
              const addr = data.address;
              setDeliveryCity(addr.city || addr.town || addr.village || addr.county || "");
              setDeliveryPincode(addr.postcode || "");

              const streetParts = [
                addr.house_number,
                addr.road || addr.street,
                addr.suburb || addr.neighbourhood || addr.residential,
              ].filter(Boolean);

              const streetAddress =
                streetParts.length > 0 ? streetParts.join(", ") : data.display_name;
              setDeliveryAddress(streetAddress);
            } else {
              const link = `https://maps.google.com/?q=${latitude},${longitude}`;
              setDeliveryAddress(`GPS: ${link}`);
            }
          } catch (error) {
            console.error("Reverse geocoding error", error);
            const link = `https://maps.google.com/?q=${latitude},${longitude}`;
            setDeliveryAddress(`GPS: ${link}`);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          setIsLocating(false);
          alert("Could not get your location. Please type your address manually.");
        },
        { timeout: 10000 },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleOrderTypeChange = (v: "delivery" | "takeaway" | "on_table") => {
    setOrderType(v);
  };

  useEffect(() => {
    const isScan =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("src") === "qr";
    supabase
      .from("analytics_events")
      .insert({ shop_id: shop.id, event_type: isScan ? "scan" : "view", device: detectDevice() })
      .then(() => undefined);
  }, [shop.id]);

  const lines: CartLine[] = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty }))
        .filter((l) => l.item && l.qty > 0),
    [cart, items],
  );
  const total = lines.reduce((s, l) => s + (l.item.discount_price ?? l.item.price) * l.qty, 0);
  const visible = items.filter(
    (i) => i.is_available && (active === "all" || i.category_id === active),
  );
  const canOrder = features.ordering && !!shop.whatsapp;

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
          className={`rounded-xl border ${theme.border} ${theme.card} p-5 backdrop-blur-lg transition-colors duration-500`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`size-16 shrink-0 overflow-hidden rounded-xl border ${theme.border} ${theme.bg}`}
            >
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={`${shop.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <span className={`grid size-full place-items-center ${theme.textMuted}`}>
                  <Store className="size-6" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1
                className={`truncate font-display text-2xl font-bold leading-tight ${theme.text}`}
              >
                {shop.name}
              </h1>
              <p className={`mt-1 truncate text-sm ${theme.textMuted}`}>
                {shop.tagline ?? shop.niche}
              </p>
            </div>
          </div>

          <div className={`mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[13px] ${theme.textMuted}`}>
            {shop.address && (
              <span className="inline-flex items-center gap-2">
                <MapPin className={`size-4 shrink-0 ${theme.accentText}`} /> {shop.address}
              </span>
            )}
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className={`inline-flex items-center gap-2 transition-colors ${theme.textMutedHover}`}
              >
                <Phone className="size-4" /> {shop.phone}
              </a>
            )}
            {shopTiming(shop) && (
              <span className="inline-flex items-center gap-2">
                <Clock className={`size-4 shrink-0 ${theme.accentText}`} /> {shopTiming(shop)}
              </span>
            )}
            {shopSocialLink(shop) && (
              <a
                href={shopSocialLink(shop)}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 transition-colors ${theme.textMutedHover}`}
              >
                <LinkIcon className="size-4 shrink-0" /> Social Media
              </a>
            )}
          </div>
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
          />
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={active === c.id}
              onClick={() => setActive(c.id)}
              theme={theme}
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
              className={`flex flex-col overflow-hidden rounded-xl border ${theme.border} ${theme.card} transition-all`}
            >
              <div className={`relative aspect-square w-full ${theme.bg}`}>
                <img
                  src={item.image_url || getFoodImageUrl(item.name, "")}
                  alt={item.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 hover:scale-105"
                />
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

                  {canOrder ? (
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

        <div
          className={`border-t ${theme.border} mt-10 pt-6 pb-4 text-center text-xs ${theme.textMuted}`}
        >
          Powered by{" "}
          <Link to="/" className={`${theme.accentText} font-display font-medium hover:underline`}>
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
          className={`max-h-[90vh] overflow-y-auto sm:max-w-md ${theme.card} ${theme.text} ${theme.border}`}
        >
          <DialogHeader>
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
                {(isDelivery || isTakeaway || isOnTable) && (
                  <div className="space-y-3 mb-6">
                    <Label
                      className={`${theme.textMuted} uppercase text-xs tracking-wider font-bold`}
                    >
                      Order Type
                    </Label>
                    <RadioGroup
                      value={orderType}
                      onValueChange={handleOrderTypeChange}
                      className="flex gap-4"
                    >
                      {isDelivery && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="delivery"
                            id="delivery"
                            className={`${theme.border} ${theme.accentText}`}
                          />
                          <Label htmlFor="delivery" className="font-medium">
                            Delivery
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
                          <Label htmlFor="takeaway" className="font-medium">
                            Take Away
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
                          <Label htmlFor="on_table" className="font-medium">
                            On Table
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
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="delivery-address"
                          className={`${theme.accentText} font-semibold`}
                        >
                          Delivery Address
                        </Label>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className={`h-7 text-xs font-bold ${theme.cartBg} ${theme.cartText} opacity-90 hover:opacity-100`}
                          onClick={fetchLocation}
                          disabled={isLocating}
                        >
                          <MapPin className="mr-1 size-3" />
                          {isLocating ? "Locating..." : "Use GPS"}
                        </Button>
                      </div>
                      <Textarea
                        id="delivery-address"
                        placeholder="House no., Street, Landmark"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                      />
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
                    <Label htmlFor="special-instructions" className={theme.textMuted}>
                      Special Instructions (Optional)
                    </Label>
                    <Textarea
                      id="special-instructions"
                      placeholder="e.g. Less spicy, table number 4"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className={`bg-transparent ${theme.border} ${theme.text} placeholder:opacity-40`}
                    />
                  </div>
                </div>

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
                        location:
                          orderType === "delivery"
                            ? [deliveryAddress, deliveryCity, deliveryPincode]
                                .filter(Boolean)
                                .join(", ")
                            : null,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setIsCartOpen(false)}
                    >
                      <MessageCircle className="mr-2 size-5" />
                      Send Order ({money(total, shop.currency)})
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  theme,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  theme: any;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? `border-transparent ${theme.accent} ${theme.cartText}`
          : `${theme.border} bg-transparent ${theme.textMuted} ${theme.textMutedHover}`
      }`}
    >
      {label}
    </motion.button>
  );
}
