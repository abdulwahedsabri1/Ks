import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Lock,
  Film,
  Smartphone,
  MapPin,
  Plus,
  Minus,
  CheckCircle,
  MessageCircle,
  Check,
  Copy,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BusinessVideoSeries } from "@/components/BusinessVideoSeries";

const BUSINESS_TYPES = [
  {
    id: "restaurant",
    label: "Restaurant",
    preview: {
      name: "Royal Biryani",
      tagline: "Dum-cooked since 1974",
      headerColor: "bg-[#18120D]",
      headerText: "text-white",
      bodyColor: "bg-[#100C09]",
      cardColor: "bg-[#18120D]",
      borderColor: "border-white/10",
      textColor: "text-white",
      textMuted: "text-white/50",
      accentText: "text-[#FFC45A]",
      accentBg: "bg-[#FFC45A]",
      cartText: "text-[#100C09]",
      logoBg: "bg-[#FFC45A]",
      categories: ["All", "Biryanis", "Starters", "Desserts"],
      items: [
        {
          name: "Hyderabadi Dum Biryani",
          price: "₹340",
          image: "/mock/food2.png",
          cat: "Biryanis",
        },
        { name: "Patthar Ka Gosht", price: "₹420", image: "/mock/food1.png", cat: "Starters" },
        { name: "Mutton Haleem", price: "₹250", image: "/mock/food3.png", cat: "Starters" },
        { name: "Double Ka Meetha", price: "₹160", image: "/mock/food4.png", cat: "Desserts" },
      ],
    },
  },
  {
    id: "salon",
    label: "Salon",
    preview: {
      name: "Luxe Studio",
      tagline: "Premium Hair & Beauty",
      headerColor: "bg-[#18120D]",
      headerText: "text-white",
      bodyColor: "bg-[#F5F0E7]",
      cardColor: "bg-white",
      borderColor: "border-black/5",
      textColor: "text-[#100C09]",
      textMuted: "text-[#3A2818]/70",
      accentText: "text-[#100C09]",
      accentBg: "bg-[#100C09]",
      cartText: "text-white",
      logoBg: "bg-[#E5B5A1]",
      categories: ["All", "Hair", "Skin", "Bridal"],
      items: [
        { name: "Premium Haircut", price: "₹1200", image: "/mock/salon1.png", cat: "Hair" },
        { name: "Keratin Treatment", price: "₹4500", image: "/mock/salon2.png", cat: "Hair" },
        { name: "Bridal Makeup", price: "₹15000", image: "/mock/salon3.png", cat: "Bridal" },
        { name: "Spa Pedicure", price: "₹800", image: "/mock/salon4.png", cat: "Skin" },
      ],
    },
  },
  {
    id: "retail",
    label: "Retail store",
    preview: {
      name: "Urban Threads",
      tagline: "Boutique Clothing",
      headerColor: "bg-[#18120D]",
      headerText: "text-white",
      bodyColor: "bg-[#FFFAF5]",
      cardColor: "bg-white shadow-sm",
      borderColor: "border-[#D99A2B]/15",
      textColor: "text-[#100C09]",
      textMuted: "text-[#100C09]/60",
      accentText: "text-[#D99A2B]",
      accentBg: "bg-[#D99A2B]",
      buttonBg: "bg-[#D99A2B] border-transparent text-white",
      cartText: "text-white",
      logoBg: "bg-[#FFFAF5]",
      categories: ["All", "Shirts", "Jackets", "Accessories"],
      items: [
        { name: "Linen Summer Shirt", price: "₹1899", image: "/mock/retail1.png", cat: "Shirts" },
        { name: "Denim Jacket", price: "₹3499", image: "/mock/retail2.png", cat: "Jackets" },
        {
          name: "Leather Tote Bag",
          price: "₹4200",
          image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=80",
          cat: "Accessories",
        },
        {
          name: "Sunglasses",
          price: "₹799",
          image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80",
          cat: "Accessories",
        },
      ],
    },
  },
  {
    id: "clinic",
    label: "Clinic (Soon)",
    preview: {
      name: "City Care",
      tagline: "Book your appointment",
      headerColor: "bg-white",
      headerText: "text-[#100C09]",
      bodyColor: "bg-[#E3F2FD]",
      cardColor: "bg-white",
      borderColor: "border-blue-900/10",
      textColor: "text-[#100C09]",
      textMuted: "text-blue-900/60",
      accentText: "text-white",
      accentBg: "bg-[#0D47A1]",
      cartText: "text-white",
      logoBg: "bg-[#E3F2FD]",
      categories: ["General", "Dental", "Cardio"],
      items: [],
    },
  },
];

interface PreviewCartItem {
  name: string;
  price: number;
  qty: number;
}

export function BusinessPreviewSection() {
  const [activeTab, setActiveTab] = useState(BUSINESS_TYPES[0]?.id || "");
  const [previewType, setPreviewType] = useState<"interactive" | "video">("interactive");
  const [cart, setCart] = useState<PreviewCartItem[]>([
    { name: "Patthar Ka Gosht", price: 420, qty: 1 },
    { name: "Hyderabadi Dum Biryani", price: 340, qty: 1 },
  ]);
  const [activeCat, setActiveCat] = useState("All");
  const [showCart, setShowCart] = useState(false);

  // Live order form states
  const [orderType, setOrderType] = useState<"delivery" | "takeaway" | "on_table">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState("");

  // UPI state
  const [upiCopied, setUpiCopied] = useState(false);
  const demoUpiId = "pay@mylinkqr";

  const activeData = BUSINESS_TYPES.find((b) => b.id === activeTab)!;
  const p = activeData.preview;

  const filteredItems = p.items.filter((item) => activeCat === "All" || item.cat === activeCat);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotalAmount = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const finalTotalAmount = Math.max(0, cartTotalAmount - (appliedDiscount || 0));

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    if (code === "WELCOME10" || code === "PROMO10" || code === "OFF10") {
      setAppliedDiscount(Math.round(cartTotalAmount * 0.1));
      setCouponError("");
    } else if (code === "SAVE50" || code === "FLAT50" || code === "DEMO50") {
      setAppliedDiscount(50);
      setCouponError("");
    } else {
      setCouponError("Invalid code (Try WELCOME10 or FLAT50)");
      setAppliedDiscount(null);
    }
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(demoUpiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2500);
  };

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setCart([]);
    setActiveCat("All");
    setShowCart(false);
    setOrderSubmitted(false);
    setAppliedDiscount(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleAddToCart = (item: { name: string; price: string }) => {
    const amount = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name);
      if (existing) {
        return prev.map((i) => (i.name === item.name ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { name: item.name, price: amount, qty: 1 }];
    });
  };

  const handleQuantityChange = (itemName: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.name === itemName ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const fetchLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let foundAddress = false;

          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              if (data) {
                const city = data.city || data.locality || data.principalSubdivision || "";
                const pincode = data.postcode || "";
                const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
                const streetAddress = parts.length > 0 ? parts.join(", ") : "";

                if (city) setDeliveryCity(city);
                if (pincode) setDeliveryPincode(pincode);
                if (streetAddress) {
                  setDeliveryAddress(streetAddress);
                  foundAddress = true;
                }
              }
            }
          } catch (err) {
            console.warn("BigDataCloud reverse geocode error:", err);
          }

          if (!foundAddress) {
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              if (res.ok) {
                const data = await res.json();
                if (data && data.address) {
                  const addr = data.address;
                  setDeliveryCity(addr.city || addr.town || addr.village || addr.county || "");
                  setDeliveryPincode(addr.postcode || "");
                  const streetParts = [
                    addr.house_number,
                    addr.road || addr.street,
                    addr.suburb || addr.neighbourhood,
                  ].filter(Boolean);
                  const streetAddress =
                    streetParts.length > 0 ? streetParts.join(", ") : data.display_name || "";
                  if (streetAddress) {
                    setDeliveryAddress(streetAddress);
                    foundAddress = true;
                  }
                }
              }
            } catch (err) {
              console.warn("Nominatim reverse geocode error:", err);
            }
          }

          if (!foundAddress) {
            setDeliveryAddress(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          }

          setIsLocating(false);
          toast.success("Location retrieved via GPS!");
        },
        (error) => {
          setIsLocating(false);
          setDeliveryAddress("Flat 402, Green Park Avenue");
          setDeliveryCity("Hyderabad");
          setDeliveryPincode("500081");
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied. Loaded demo address.");
          } else {
            toast.error("Could not fetch GPS. Loaded demo address.");
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    } else {
      setDeliveryAddress("Flat 402, Green Park Avenue");
      setDeliveryCity("Hyderabad");
      setDeliveryPincode("500081");
      toast.error("Geolocation not supported by browser.");
    }
  };

  return (
    <section
      id="previews"
      className="bg-[#100C09] py-24 md:py-32 overflow-hidden text-white border-t border-white/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header & Tabs */}
        <div className="mb-16">
          <p className="text-[#FFC45A] text-xs font-bold tracking-[0.2em] uppercase mb-4">
            LIVE PREVIEWS & BUSINESS VIDEO TOUR
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-10 max-w-2xl leading-tight"
          >
            One scan, a different world for every business
          </motion.h2>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {BUSINESS_TYPES.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleTabChange(business.id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    activeTab === business.id
                      ? "bg-[#FFC45A] border-[#FFC45A] text-[#100C09]"
                      : "bg-transparent border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {business.label}
                </button>
              ))}
            </div>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewType("interactive")}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  previewType === "interactive"
                    ? "bg-[#FFC45A] text-[#100C09] shadow-md font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Smartphone className="size-3.5" /> Interactive UI
              </button>
              <button
                type="button"
                onClick={() => setPreviewType("video")}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  previewType === "video"
                    ? "bg-[#FFC45A] text-[#100C09] shadow-md font-bold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Film className="size-3.5" /> Watch Video Tour
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left: Phone Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mx-auto w-full max-w-[340px] lg:mx-0"
          >
            {/* Phone Frame */}
            <div className="relative aspect-[9/19] w-full rounded-[2.5rem] border-[8px] border-[#18120D] bg-black shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 pointer-events-none select-none">
              {/* Dynamic Content */}
              <AnimatePresence mode="wait">
                {previewType === "video" ? (
                  <motion.div
                    key={`video-${activeTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black flex flex-col justify-between pointer-events-auto"
                  >
                    <div className="bg-[#18120D]/90 backdrop-blur px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-white truncate">
                          {activeTab === "restaurant"
                            ? "Restaurant QR Experience Video"
                            : activeTab === "salon"
                            ? "Salon & Services Dashboard Video"
                            : activeTab === "retail"
                            ? "Retail & Mobile Catalog Video"
                            : "Multi-Business Video Tour"}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFC45A]/20 text-[#FFC45A] px-2 py-0.5 rounded-full">
                        {activeTab === "restaurant"
                          ? "kj.mp4"
                          : activeTab === "salon"
                          ? "dsf.mp4"
                          : activeTab === "retail"
                          ? "Mylinkqr.mp4"
                          : "Series"}
                      </span>
                    </div>

                    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                      <video
                        key={`vid-${activeTab}`}
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        poster="/hero_qr.jpg"
                      >
                        <source
                          src={
                            activeTab === "restaurant"
                              ? "/mock/kj.mp4"
                              : activeTab === "salon"
                              ? "/mock/dsf.mp4"
                              : activeTab === "retail"
                              ? "/mock/Mylinkqr.mp4"
                              : "/mock/Visual_Show_different_busines.mp4"
                          }
                          type="video/mp4"
                        />
                        Your browser does not support video.
                      </video>
                    </div>

                    <div className="p-3 bg-[#18120D] border-t border-white/10 text-center">
                      <p className="text-[10px] text-white/70">
                        {activeTab === "restaurant"
                          ? "Showing kj.mp4: Restaurant guest ordering flow"
                          : activeTab === "salon"
                          ? "Showing dsf.mp4: Dashboard & Owner view"
                          : activeTab === "retail"
                          ? "Showing Mylinkqr.mp4: Mobile catalog experience"
                          : "Showing Visual_Show_different_busines.mp4: Multi-business showcase"}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute inset-0 flex flex-col ${p.bodyColor} overflow-y-auto no-scrollbar pointer-events-auto`}
                  >
                    {/* Top Header Card */}
                    <div className="px-3 pt-6 pb-3 relative z-10">
                      <div
                        className={`${p.headerColor} ${p.headerText} rounded-xl p-4 shadow-xl flex items-center gap-3 border border-white/10`}
                      >
                        <div
                          className={`size-12 rounded-lg ${p.logoBg} flex items-center justify-center shrink-0`}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-[#100C09]"
                          >
                            <path d="M4 4h16v16H4z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                          <p className="text-[10px] opacity-70 truncate mt-0.5">{p.tagline}</p>
                        </div>
                      </div>
                    </div>

                    {/* Category Chips */}
                    <div className="flex gap-2 overflow-x-hidden px-3 pb-3 shrink-0">
                      {p.categories.map((cat, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveCat(cat)}
                          className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold border transition-all ${
                            activeCat === cat
                              ? `border-transparent ${p.accentBg} ${p.cartText}`
                              : `${p.borderColor} ${p.textMuted}`
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Grid Items or Custom UI */}
                    <div className="flex-1 overflow-hidden px-3 pb-[80px]">
                      {activeTab === "clinic" ? (
                        <div className="relative h-full flex flex-col pt-2">
                          <div
                            className={`p-5 rounded-2xl border ${p.borderColor} ${p.cardColor} space-y-4 opacity-40 shadow-sm`}
                          >
                            <div className="h-3 w-32 bg-gray-200 rounded-full" />
                            <div className="h-10 w-full bg-gray-100 rounded-lg" />
                            <div className="h-3 w-24 bg-gray-200 rounded-full mt-2" />
                            <div className="flex gap-2">
                              <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
                              <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
                            </div>
                            <div className="h-12 w-full bg-blue-900/20 rounded-lg mt-6" />
                          </div>

                          <div className="absolute inset-0 z-10 flex flex-col items-center pt-16 bg-gradient-to-t from-[#E3F2FD] via-[#E3F2FD]/80 to-transparent">
                            <div
                              className={`size-14 rounded-full ${p.accentBg} ${p.cartText} flex items-center justify-center mb-4 shadow-xl ring-4 ring-white`}
                            >
                              <Lock className="size-6" />
                            </div>
                            <h4 className={`font-bold text-lg ${p.textColor}`}>Upcoming Feature</h4>
                            <p
                              className={`text-xs text-center px-6 mt-1.5 leading-relaxed font-medium ${p.textMuted}`}
                            >
                              Clinic appointment booking system is currently under development.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => {
                              const inCart = cart.find((i) => i.name === item.name);
                              const qty = inCart ? inCart.qty : 0;
                              return (
                                <motion.div
                                  key={item.name}
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className={`flex flex-col overflow-hidden rounded-lg border ${p.borderColor} ${p.cardColor}`}
                                >
                                  <div className={`relative aspect-square w-full ${p.bodyColor}`}>
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="size-full object-cover"
                                    />
                                  </div>
                                  <div className="flex flex-1 flex-col p-2.5">
                                    <h2
                                      className={`line-clamp-2 text-[10px] font-semibold leading-tight ${p.textColor}`}
                                    >
                                      {item.name}
                                    </h2>
                                    <div className="mt-auto pt-2 flex items-end justify-between gap-1">
                                      <p
                                        className={`whitespace-nowrap font-bold text-[11px] ${p.textColor}`}
                                      >
                                        {item.price}
                                      </p>
                                      {qty > 0 ? (
                                        <div
                                          className={`flex items-center h-5 rounded overflow-hidden border ${p.borderColor} ${p.cardColor}`}
                                        >
                                          <button
                                            onClick={() => handleQuantityChange(item.name, -1)}
                                            className={`px-1.5 h-full flex items-center justify-center ${p.textColor} hover:opacity-80`}
                                          >
                                            <Minus className="size-2.5" />
                                          </button>
                                          <span className={`px-1 text-[10px] font-bold ${p.textColor}`}>
                                            {qty}
                                          </span>
                                          <button
                                            onClick={() => handleQuantityChange(item.name, 1)}
                                            className={`px-1.5 h-full flex items-center justify-center ${p.textColor} hover:opacity-80`}
                                          >
                                            <Plus className="size-2.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => handleAddToCart(item)}
                                          className={`h-5 rounded px-2 flex items-center text-[9px] font-bold uppercase tracking-wider ${p.buttonBg || `bg-transparent border ${p.borderColor}`} ${p.accentText} cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
                                        >
                                          Add
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Floating Cart Button */}
                    <AnimatePresence>
                      {cartItemsCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 50 }}
                          className="sticky bottom-0 inset-x-0 z-50 p-3 pb-6 pointer-events-none mt-auto"
                        >
                          <motion.div
                            key={cartItemsCount}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onClick={() => setShowCart(true)}
                            className={`mx-auto flex items-center justify-between overflow-hidden rounded-xl p-2 shadow-lg ${p.accentBg} ${p.cartText} pointer-events-auto cursor-pointer active:scale-95 transition-all`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 items-center justify-center rounded-md bg-black/10">
                                <ShoppingBag className="size-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-semibold opacity-90 uppercase">
                                  {cartItemsCount} item{cartItemsCount > 1 ? "s" : ""}
                                </span>
                                <span className="text-sm font-bold leading-none">
                                  ₹{cartTotalAmount}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-xs font-bold pl-2 pr-1">
                              View Cart <ChevronRight className="size-3 ml-0.5" />
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Cart Modal Overlay */}
                    <AnimatePresence>
                      {showCart && (
                        <motion.div
                          initial={{ y: "100%" }}
                          animate={{ y: 0 }}
                          exit={{ y: "100%" }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          className={`absolute inset-0 z-[60] flex flex-col ${p.bodyColor} pointer-events-auto`}
                        >
                          <div
                            className={`p-3.5 flex items-center justify-between border-b ${p.borderColor} ${p.headerColor}`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowCart(false)}
                                className={`${p.headerText} p-1 -ml-1 cursor-pointer active:scale-90 transition-transform`}
                              >
                                <ChevronLeft className="size-5" />
                              </button>
                              <h3 className={`font-display text-base font-bold ${p.headerText}`}>
                                Your Order
                              </h3>
                            </div>
                            <button
                              onClick={() => setShowCart(false)}
                              className={`${p.headerText} text-xs opacity-60 hover:opacity-100 font-bold`}
                            >
                              ✕
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 text-xs no-scrollbar">
                            {/* Items List with Quantity Controls */}
                            <div className="space-y-2">
                              {cart.length > 0 ? (
                                cart.map((item, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border ${p.borderColor} ${p.cardColor}`}
                                  >
                                    <div className="min-w-0 flex-1 pr-2">
                                      <p className={`text-xs font-semibold truncate ${p.textColor}`}>
                                        {item.name}
                                      </p>
                                      <p className={`text-[11px] font-bold ${p.accentText}`}>
                                        ₹{item.price * item.qty}
                                      </p>
                                    </div>
                                    <div
                                      className={`flex items-center gap-1.5 rounded border ${p.borderColor} px-2 py-1 bg-black/10`}
                                    >
                                      <button
                                        onClick={() => handleQuantityChange(item.name, -1)}
                                        className={`${p.textColor} opacity-70 hover:opacity-100 p-0.5`}
                                      >
                                        <Minus className="size-3" />
                                      </button>
                                      <span className={`w-4 text-center font-bold text-xs ${p.textColor}`}>
                                        {item.qty}
                                      </span>
                                      <button
                                        onClick={() => handleQuantityChange(item.name, 1)}
                                        className={`${p.textColor} opacity-70 hover:opacity-100 p-0.5`}
                                      >
                                        <Plus className="size-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-70">
                                  <ShoppingBag className={`size-10 mb-2 ${p.textColor}`} />
                                  <p className={`font-semibold text-xs ${p.textColor}`}>
                                    Your cart is empty
                                  </p>
                                </div>
                              )}
                            </div>

                            {cart.length > 0 && (
                              <>
                                {/* ORDER / ENQUIRY TYPE */}
                                <div className={`pt-2 border-t ${p.borderColor} space-y-1.5`}>
                                  <p
                                    className={`text-[9px] font-bold uppercase tracking-wider opacity-70 ${p.textColor}`}
                                  >
                                    ORDER / ENQUIRY TYPE
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                                     {[
                                       { id: "delivery", label: "Delivery" },
                                       { id: "takeaway", label: "Take Away" },
                                       { id: "on_table", label: "On-Table Dining" },
                                       { id: "enquiry", label: "General Enquiry / Quote" },
                                     ].map((type) => (
                                      <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setOrderType(type.id as any)}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all flex items-center gap-1 cursor-pointer ${
                                          orderType === type.id
                                            ? `${p.accentBg} ${p.cartText} border-transparent shadow-sm font-bold`
                                            : `border-white/10 ${p.textColor} opacity-60 hover:opacity-100`
                                        }`}
                                      >
                                        <span
                                          className={`size-1.5 rounded-full ${
                                            orderType === type.id ? "bg-current" : "bg-white/40"
                                          }`}
                                        />
                                        {type.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Delivery Address Block */}
                                {orderType === "delivery" && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-2.5 rounded-xl border ${p.borderColor} bg-white/5 space-y-2`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className={`text-[10px] font-bold ${p.accentText}`}>
                                        Delivery Address
                                      </span>
                                      <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        type="button"
                                        onClick={fetchLocation}
                                        disabled={isLocating}
                                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.accentBg} ${p.cartText} flex items-center gap-1 hover:opacity-90 transition-all cursor-pointer shadow-sm`}
                                      >
                                        <MapPin className="size-2.5" />
                                        {isLocating ? "Locating..." : "Use GPS"}
                                      </motion.button>
                                    </div>
                                    <textarea
                                      rows={2}
                                      placeholder="House no., Street, Landmark"
                                      value={deliveryAddress}
                                      onChange={(e) => setDeliveryAddress(e.target.value)}
                                      className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30 resize-none`}
                                    />
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <label
                                          className={`text-[9px] font-medium opacity-60 block mb-0.5 ${p.textColor}`}
                                        >
                                          City
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="City"
                                          value={deliveryCity}
                                          onChange={(e) => setDeliveryCity(e.target.value)}
                                          className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30`}
                                        />
                                      </div>
                                      <div>
                                        <label
                                          className={`text-[9px] font-medium opacity-60 block mb-0.5 ${p.textColor}`}
                                        >
                                          Pincode
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="6-digit"
                                          value={deliveryPincode}
                                          onChange={(e) => setDeliveryPincode(e.target.value)}
                                          className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30`}
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Customer Info */}
                                <div className="space-y-1.5">
                                  <div>
                                    <label
                                      className={`text-[9px] font-medium opacity-70 block mb-0.5 ${p.textColor}`}
                                    >
                                      Your Name
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Rahul Sharma"
                                      value={customerName}
                                      onChange={(e) => setCustomerName(e.target.value)}
                                      className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30`}
                                    />
                                  </div>

                                  <div>
                                    <label
                                      className={`text-[9px] font-medium opacity-70 block mb-0.5 ${p.textColor}`}
                                    >
                                      WhatsApp Phone Number
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="+91 98765 43210"
                                      value={customerPhone}
                                      onChange={(e) => setCustomerPhone(e.target.value)}
                                      className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30`}
                                    />
                                  </div>

                                  <div>
                                    <label
                                      className={`text-[9px] font-medium opacity-70 block mb-0.5 ${p.textColor}`}
                                    >
                                      Special Instructions (Optional)
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="e.g. Less spicy, table number 4"
                                      value={specialInstructions}
                                      onChange={(e) => setSpecialInstructions(e.target.value)}
                                      className={`w-full bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none focus:border-white/40 transition-colors placeholder:text-white/30 resize-none`}
                                    />
                                  </div>
                                </div>

                                {/* Discount Code Block */}
                                <div className={`p-2.5 rounded-xl border ${p.borderColor} bg-white/5 space-y-1.5`}>
                                  <label className={`text-[10px] font-bold ${p.accentText}`}>
                                    Discount Code
                                  </label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="Enter code"
                                      value={couponCode}
                                      onChange={(e) => {
                                        setCouponCode(e.target.value.toUpperCase());
                                        setCouponError("");
                                      }}
                                      disabled={appliedDiscount !== null}
                                      className={`flex-1 bg-black/20 rounded-lg p-1.5 text-[10px] ${p.textColor} border ${p.borderColor} focus:outline-none placeholder:text-white/30 font-mono font-bold uppercase`}
                                    />
                                    {appliedDiscount === null ? (
                                      <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.accentBg} ${p.cartText} hover:opacity-90 transition-all cursor-pointer shadow-sm`}
                                      >
                                        Apply
                                      </motion.button>
                                    ) : (
                                      <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        type="button"
                                        onClick={() => {
                                          setAppliedDiscount(null);
                                          setCouponCode("");
                                          setCouponError("");
                                        }}
                                        className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-600/80 text-white hover:bg-red-600 transition-all cursor-pointer"
                                      >
                                        Remove
                                      </motion.button>
                                    )}
                                  </div>
                                  <AnimatePresence>
                                    {couponError && (
                                      <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[9px] text-red-400 font-medium"
                                      >
                                        {couponError}
                                      </motion.p>
                                    )}
                                    {appliedDiscount !== null && (
                                      <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[9px] text-emerald-400 font-bold flex items-center gap-1"
                                      >
                                        <CheckCircle className="size-3" /> Coupon applied: -₹{appliedDiscount}
                                      </motion.p>
                                    )}
                                  </AnimatePresence>
                                </div>

                                {/* UPI Payment Accepted (Demo QR) Block */}
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xs p-3 text-white shadow-md space-y-2.5 transition-all duration-300 hover:border-emerald-500/50">
                                  <div className="flex items-start gap-2 pb-2 border-b border-white/10">
                                    <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40 mt-0.5">
                                      <Check className="size-3 stroke-[3]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="font-bold text-xs leading-tight text-white font-display">
                                          UPI Payment Accepted
                                        </h4>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                          ₹{finalTotalAmount.toFixed(2)}
                                        </span>
                                      </div>
                                      <p className="text-[9px] text-white/60 font-medium mt-0.5 leading-tight">
                                        Scan QR code below or copy Merchant UPI ID to pay
                                      </p>
                                    </div>
                                  </div>

                                  {/* Centered QR Box */}
                                  <div className="flex flex-col items-center justify-center py-1">
                                    <motion.div
                                      whileHover={{ scale: 1.03 }}
                                      className="bg-white p-2 rounded-lg border border-slate-700 shadow-md transition-transform"
                                    >
                                      <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${demoUpiId}%26pn=Royal%20Biryani%26am=${finalTotalAmount}%26cu=INR`}
                                        alt="UPI QR Code"
                                        className="size-28 sm:size-32 object-contain"
                                      />
                                    </motion.div>
                                    <div className="text-[9px] font-bold text-emerald-400 mt-1.5 flex items-center gap-1">
                                      <Sparkles className="size-3" />
                                      <span>Scan to Pay</span>
                                    </div>
                                  </div>

                                  {/* Merchant UPI ID */}
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold tracking-wider text-white/50 uppercase block">
                                      MERCHANT UPI ID
                                    </label>
                                    <div className="flex items-center justify-between gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 min-w-0">
                                      <code className="text-[10px] font-mono font-bold text-white truncate select-all flex-1">
                                        {demoUpiId}
                                      </code>
                                      <motion.button
                                        whileTap={{ scale: 0.92 }}
                                        type="button"
                                        onClick={copyUpi}
                                        className="h-6 px-2 text-[9px] font-bold rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                                      >
                                        {upiCopied ? (
                                          <>
                                            <Check className="size-2.5 text-emerald-400" />
                                            <span>Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="size-2.5 text-emerald-300" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>

                                {/* Total */}
                                <div
                                  className={`pt-2 border-t ${p.borderColor} flex justify-between items-center`}
                                >
                                  <span className={`text-xs opacity-80 ${p.textColor}`}>Total</span>
                                  <span className={`text-sm font-bold ${p.textColor}`}>
                                    ₹{finalTotalAmount}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>

                          <div className={`p-3 border-t ${p.borderColor} ${p.headerColor}`}>
                            {orderSubmitted ? (
                              <div className="py-1 text-center flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                                <CheckCircle className="size-4 animate-bounce" /> Order Submitted!
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderSubmitted(true);
                                    setTimeout(() => setOrderSubmitted(false), 3500);
                                  }}
                                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${p.accentBg} ${p.cartText} active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer`}
                                >
                                  <MessageCircle className="size-3" /> Send Order
                                </button>
                                <Link to="/demo" hash="booking-form" className="block">
                                  <button
                                    onClick={() => setShowCart(false)}
                                    className="px-2.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 transition-transform cursor-pointer"
                                  >
                                    Book Demo
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Domain text under phone */}
            <p className="text-center text-white/30 text-xs mt-6 tracking-wider">
              mylinkqr.in/shop/{activeData.id === "restaurant" ? "royalbiryani" : activeData.id}
            </p>
          </motion.div>

          {/* Right: Content Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#18120D] border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl"
          >
            <h3 className="font-display text-2xl md:text-3xl font-semibold mb-6">
              Themes that respect your brand
            </h3>
            <p className="text-white/70 text-sm md:text-base leading-relaxed mb-8">
              Every microsite inherits your logo, palette and typography. Swap a theme and the menu,
              catalog, gallery and offer pages follow instantly — across all six supported
              languages.
            </p>

            <div className="grid sm:grid-cols-2 gap-y-4 gap-x-6">
              {[
                "Dynamic, editable QR targets",
                "Scan-level analytics",
                "WhatsApp & payment shortcuts",
                "Offline-friendly, sub-second loads",
              ].map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="size-1.5 rounded-full bg-[#FFC45A] mt-2 shrink-0" />
                  <span className="text-white/80 text-sm">{bullet}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Business Video Series Section */}
        <div className="mt-24 pt-16 border-t border-white/10">
          <BusinessVideoSeries initialVideoId="all-business-showcase" showTitle={true} />
        </div>
      </div>
    </section>
  );
}
