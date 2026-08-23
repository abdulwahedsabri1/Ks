import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
          price: "₹999",
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

export function BusinessPreviewSection() {
  const [activeTab, setActiveTab] = useState(BUSINESS_TYPES[0]?.id || "");
  const [cart, setCart] = useState<{ name: string; price: number }[]>([
    { name: "Patthar Ka Gosht", price: 420 },
    { name: "Hyderabadi Dum Biryani", price: 340 },
  ]);
  const [activeCat, setActiveCat] = useState("All");
  const [showCart, setShowCart] = useState(false);

  const activeData = BUSINESS_TYPES.find((b) => b.id === activeTab)!;
  const p = activeData.preview;

  const filteredItems = p.items.filter((item) => activeCat === "All" || item.cat === activeCat);
  const cartItemsCount = cart.length;
  const cartTotalAmount = cart.reduce((acc, item) => acc + item.price, 0);

  // Reset cart when tab changes for demo purposes
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setCart([]);
    setActiveCat("All");
    setShowCart(false);
  };

  const handleAddToCart = (item: any) => {
    const amount = parseInt(item.price.replace(/[^0-9]/g, "")) || 0;
    setCart((prev) => [...prev, { name: item.name, price: amount }]);
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
            LIVE PREVIEWS
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-10 max-w-2xl leading-tight"
          >
            One scan, a different world for every business
          </motion.h2>

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
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 flex flex-col ${p.bodyColor} overflow-y-auto no-scrollbar pointer-events-auto`}
                >
                  {/* Top Header Card (Mimicking actual shop.$slug.tsx layout) */}
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
                        {/* Fake Form UI */}
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

                        {/* Lock Overlay */}
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
                          {filteredItems.map((item, i) => (
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
                                  <button
                                    onClick={() => handleAddToCart(item)}
                                    className={`h-5 rounded px-2 flex items-center text-[9px] font-bold uppercase tracking-wider ${p.buttonBg || `bg-transparent border ${p.borderColor}`} ${p.accentText} cursor-pointer hover:opacity-80 active:scale-95 transition-all`}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
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
                          className={`p-4 flex items-center gap-3 border-b ${p.borderColor} ${p.headerColor}`}
                        >
                          <button
                            onClick={() => setShowCart(false)}
                            className={`${p.headerText} p-1 -ml-1 cursor-pointer active:scale-90 transition-transform`}
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <h3 className={`font-display text-lg font-bold ${p.headerText}`}>
                            Your Order
                          </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                          {cart.length > 0 ? (
                            cart.map((item, i) => (
                              <div
                                key={i}
                                className={`flex items-center justify-between p-3 rounded-lg border ${p.borderColor} ${p.cardColor}`}
                              >
                                <span className={`text-sm font-medium ${p.textColor}`}>
                                  {item.name}
                                </span>
                                <span className={`text-sm font-bold ${p.textColor}`}>
                                  ₹{item.price}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-70 mt-10">
                              <ShoppingBag className={`size-12 mb-4 ${p.textColor}`} />
                              <p className={`font-semibold text-sm ${p.textColor}`}>
                                Your cart is empty
                              </p>
                            </div>
                          )}

                          {cart.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className={`text-sm opacity-80 ${p.textColor}`}>Total</span>
                              <span className={`text-lg font-bold ${p.textColor}`}>
                                ₹{cartTotalAmount}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className={`p-4 border-t ${p.borderColor} ${p.headerColor}`}>
                          <Link to="/auth" className="block w-full">
                            <button
                              onClick={() => setShowCart(false)}
                              className={`w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider ${p.accentBg} ${p.cartText} active:scale-95 transition-transform`}
                            >
                              Checkout (Sign Up)
                            </button>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Domain text under phone */}
            <p className="text-center text-white/30 text-xs mt-6 tracking-wider">
              {activeData.id === "restaurant" ? "royalbiryani" : activeData.id}.myqr.link
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
      </div>
    </section>
  );
}
