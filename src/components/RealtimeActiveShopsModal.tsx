import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRealtimeActiveShops } from "@/hooks/useRealtimeActiveShops";
import { publicShopUrl } from "@/lib/shop";
import { ExternalLink, Search, Store, Sparkles, RefreshCw, AlertCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export function RealtimeActiveShopsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { shops, loading, refetch } = useRealtimeActiveShops();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");

  const activeCount = shops.filter((s) => s.status === "active").length;
  const suspendedCount = shops.filter((s) => s.status === "suspended" || s.status === "cancelled").length;

  const filteredShops = shops.filter((s) => {
    // Status filter
    if (statusFilter === "active" && s.status !== "active") return false;
    if (statusFilter === "suspended" && (s.status !== "suspended" && s.status !== "cancelled")) return false;

    // Search query
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      (s.niche && s.niche.toLowerCase().includes(query)) ||
      (s.tagline && s.tagline.toLowerCase().includes(query))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border text-foreground p-6 sm:p-8 rounded-3xl shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-2 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold font-display flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Store className="size-4" />
              </div>
              All Platform Stores
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-400 font-mono font-medium">
                Backend Live Sync
              </span>
              <button
                onClick={() => refetch()}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            View all platform stores from the admin panel (both active and suspended). Click any store to inspect its live status or menu.
          </p>
        </DialogHeader>

        {/* Status Filter Tabs & Search Bar */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All Stores ({shops.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "active"
                  ? "bg-emerald-500 text-black shadow-md"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("suspended")}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === "suspended"
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
              }`}
            >
              <span className="size-2 rounded-full bg-rose-500" />
              Suspended ({suspendedCount})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search store name, category, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/40 border-border text-foreground text-xs rounded-xl focus:border-amber-500 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Shops List */}
        <div className="mt-4 max-h-[360px] overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="size-6 text-amber-500 animate-spin mx-auto opacity-80" />
              <p className="text-xs text-muted-foreground">Syncing platform stores from server...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-muted/20 rounded-2xl border border-border p-6">
              <AlertCircle className="size-8 text-amber-500/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                {search ? "No stores matching search" : "No stores found in this filter"}
              </p>
            </div>
          ) : (
            filteredShops.map((shop) => {
              const isSuspended = shop.status === "suspended" || shop.status === "cancelled";
              return (
                <a
                  key={shop.id}
                  href={publicShopUrl(shop.slug)}
                  target="_blank"
                  rel="noreferrer"
                  className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                    isSuspended
                      ? "border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/20 hover:border-rose-500/50"
                      : "border-border bg-muted/30 hover:bg-muted/60 hover:border-amber-500/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {shop.logo_url ? (
                      <img
                        src={shop.logo_url}
                        alt={shop.name}
                        className="size-10 rounded-xl object-cover border border-border shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate group-hover:text-amber-500 transition-colors">
                          {shop.name}
                        </h4>
                        {shop.rank && shop.rank < 9999 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            shop.rank === 1
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : shop.rank === 2
                                ? "bg-muted/80 text-foreground border border-border"
                                : shop.rank === 3
                                  ? "bg-amber-700/20 text-amber-400 border border-amber-700/30"
                                  : "bg-muted/50 text-muted-foreground border border-border"
                          }`}>
                            {shop.rank === 1 ? "🥇 Rank #1" : shop.rank === 2 ? "🥈 Rank #2" : shop.rank === 3 ? "🥉 Rank #3" : `Rank #${shop.rank}`}
                          </span>
                        )}
                        {isSuspended ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold shrink-0 flex items-center gap-1">
                            <AlertTriangle className="size-3" /> Suspended
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0 flex items-center gap-1">
                            <ShieldCheck className="size-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {shop.niche || "Business"} {shop.tagline ? `• ${shop.tagline}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-semibold shrink-0 pl-2 ${
                    isSuspended ? "text-rose-400 opacity-90" : "text-amber-500 opacity-80 group-hover:opacity-100"
                  }`}>
                    <span>{isSuspended ? "View Status" : "Open Shop"}</span>
                    <ExternalLink className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </a>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Sparkles className="size-3 text-amber-500" /> Showing {filteredShops.length} stores ({activeCount} active, {suspendedCount} suspended)
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

