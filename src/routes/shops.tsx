import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRealtimeActiveShops } from "@/hooks/useRealtimeActiveShops";
import { publicShopUrl } from "@/lib/shop";
import { Navbar } from "@/sections/landing/Navbar";
import { Footer } from "@/sections/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  ExternalLink,
  Search,
  Trophy,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Live Shops Directory & Rankings | MY Link QR" },
      {
        name: "description",
        content:
          "Browse live active digital menus and stores powered by MY Link QR. Real-time updated store directory.",
      },
    ],
  }),
  component: PublicShopsDirectoryPage,
});

function PublicShopsDirectoryPage() {
  const { shops, loading, refetch } = useRealtimeActiveShops();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(shops.map((s) => s.niche).filter(Boolean)))];

  const filteredShops = shops.filter((shop) => {
    if (shop.status === "suspended") return false; // Exclude suspended
    const matchesCategory =
      selectedCategory === "all" ||
      (shop.niche && shop.niche.toLowerCase() === selectedCategory.toLowerCase());
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      shop.name.toLowerCase().includes(query) ||
      (shop.niche && shop.niche.toLowerCase().includes(query)) ||
      (shop.tagline && shop.tagline.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const topRankedShop = shops.find((s) => s.rank === 1) || shops[0];

  return (
    <div className="min-h-screen bg-[#080C14] text-white font-sans selection:bg-amber-500/30">
      <Navbar />

      <main className="pt-28 pb-24 md:pt-36">
        {/* Header Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 mb-6">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Real-Time Active Shops Directory
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Discover Live <span className="text-gradient italic">Digital Menus & Stores</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            Explore active verified businesses using MY Link QR. Browse menus in real-time, order online, or scan QR codes directly.
          </p>
        </section>

        {/* Top Ranked Spotlight Banner (If Available) */}
        {topRankedShop && (
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#100C09] to-[#0F1626] p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Trophy className="size-48 text-amber-400" />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 min-w-0">
                  {topRankedShop.logo_url ? (
                    <img
                      src={topRankedShop.logo_url}
                      alt={topRankedShop.name}
                      className="size-16 sm:size-20 rounded-2xl object-cover border-2 border-amber-500/60 shadow-xl shrink-0"
                    />
                  ) : (
                    <div className="size-16 sm:size-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center text-amber-300 font-bold text-2xl shrink-0">
                      {topRankedShop.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Trophy className="size-3 text-amber-400" /> 🥇 Rank #1 Featured Store
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="size-3.5" /> Verified Active
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-white truncate">
                      {topRankedShop.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 truncate mt-1">
                      {topRankedShop.niche || "Business"} {topRankedShop.tagline ? `• ${topRankedShop.tagline}` : ""}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold px-8 shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <a href={publicShopUrl(topRankedShop.slug)} target="_blank" rel="noreferrer">
                    Visit Rank #1 Menu <ArrowUpRight className="ml-2 size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Directory Controls & Grid */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-[#0F1626] p-4 rounded-2xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              <Input
                placeholder="Search shops by name, category, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 text-xs rounded-xl focus:border-amber-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl capitalize font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              ))}
            </div>

            {/* Refetch Sync Button */}
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Refresh Live Sync"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
            </button>
          </div>

          {/* Shops Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="size-8 text-amber-500 animate-spin mx-auto opacity-80" />
              <p className="text-sm text-slate-400">Loading active shops from backend...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-20 text-center bg-[#0F1626] rounded-3xl border border-slate-800 p-8 max-w-lg mx-auto space-y-3">
              <Store className="size-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No matching active shops found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Only active public shops are displayed in this directory. Suspended or inactive shops are automatically hidden.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredShops.map((shop, index) => {
                const displayRank = shop.rank && shop.rank < 9999 ? shop.rank : index + 1;
                return (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-[#0F1626] p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-amber-500/5"
                  >
                    <div>
                      {/* Top Header: Rank Badge & Status */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
                            displayRank === 1
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : displayRank === 2
                                ? "bg-slate-300/20 text-slate-200 border-slate-300/30"
                                : displayRank === 3
                                  ? "bg-amber-700/20 text-amber-400 border-amber-700/30"
                                  : "bg-slate-800/80 text-slate-400 border-slate-700/50"
                          }`}
                        >
                          {displayRank === 1
                            ? "🥇 Rank #1"
                            : displayRank === 2
                              ? "🥈 Rank #2"
                              : displayRank === 3
                                ? "🥉 Rank #3"
                                : `Rank #${displayRank}`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Active
                        </span>
                      </div>

                      {/* Shop Logo & Name */}
                      <div className="flex items-center gap-3.5 mb-3">
                        {shop.logo_url ? (
                          <img
                            src={shop.logo_url}
                            alt={shop.name}
                            className="size-12 rounded-2xl object-cover border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-base text-white truncate group-hover:text-amber-300 transition-colors">
                            {shop.name}
                          </h3>
                          <p className="text-xs text-amber-400/90 font-medium truncate mt-0.5">
                            {shop.niche || "Business"}
                          </p>
                        </div>
                      </div>

                      {shop.tagline && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                          {shop.tagline}
                        </p>
                      )}
                    </div>

                    {/* Action Link Button */}
                    <Button
                      asChild
                      className="w-full mt-4 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 font-bold text-xs transition-all duration-200"
                    >
                      <a href={publicShopUrl(shop.slug)} target="_blank" rel="noreferrer">
                        Open Digital Menu <ExternalLink className="ml-1.5 size-3.5" />
                      </a>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
