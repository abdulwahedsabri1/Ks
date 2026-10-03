import { useRealtimeActiveShops } from "@/hooks/useRealtimeActiveShops";
import { publicShopUrl } from "@/lib/shop";
import { ExternalLink, Store, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function RealtimeActiveShopsShowcase() {
  const { shops, loading, refetch } = useRealtimeActiveShops();

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-400">
        <RefreshCw className="size-6 text-amber-500 animate-spin mx-auto mb-2" />
        <p className="text-xs">Syncing active shops from backend...</p>
      </div>
    );
  }

  if (shops.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-black/40 border-y border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-3">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Real-Time Backend Sync Active
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Explore Active Public Shops <span className="text-amber-400 text-lg">({shops.length})</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Live businesses using MY Link QR. Click any active shop below to open its live interactive menu. Suspended stores are automatically filtered out.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl px-4 py-2 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="size-3.5" /> Refresh Sync
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map((shop) => (
            <motion.a
              key={shop.id}
              href={publicShopUrl(shop.slug)}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="group relative flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#100C09] hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                {shop.logo_url ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="size-11 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="size-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base shrink-0">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-amber-300 transition-colors">
                      {shop.name}
                    </h3>
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {shop.niche || "Business"} {shop.tagline ? `• ${shop.tagline}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center size-8 rounded-full bg-white/5 border border-white/10 group-hover:bg-amber-500 group-hover:text-[#100C09] transition-all shrink-0 ml-2">
                <ExternalLink className="size-3.5" />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
