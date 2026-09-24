import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Shield,
  UtensilsCrossed,
  Clock,
  Menu,
  X,
  Store,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyShop } from "@/hooks/useShopData";
import { useAuth } from "@/hooks/useAuth";
import { publicShopUrl, shopCatalogLabel, shopFeatures } from "@/lib/shop";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/menu", label: "Menu & Items", icon: UtensilsCrossed },
  { to: "/qr", label: "QR Code", icon: QrCode },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Shop Settings", icon: Settings },
] as const;

export function DashboardShell({
  title,
  description,
  actions,
  children,
  isAdmin,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  isAdmin?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { data: shop } = useMyShop(user?.id);
  const isPending = shop?.status === "pending";
  const catalogLabel = shopCatalogLabel(shop);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-amber-500/20 selection:text-amber-500">
      {/* Desktop Fixed Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/60 p-5 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-3 group" title="Go to Website Home Page">
          <img
            src="/favicon.ico"
            alt="MY Link QR Logo"
            className="size-10 rounded-xl object-contain shadow-md transition-transform group-hover:scale-105 shrink-0"
          />
          <div>
            <span className="font-display text-base font-bold leading-tight block">MY Link QR</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Digital Catalog Engine
            </span>
          </div>
        </Link>

        {/* Shop Info Card in Sidebar */}
        {shop && (
          <div className="mb-6 rounded-2xl border bg-muted/40 p-3 flex items-center gap-3">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="size-9 rounded-xl object-cover border border-border shrink-0"
              />
            ) : (
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center border border-amber-500/20 shrink-0 text-sm">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate leading-tight">{shop.name}</p>
              <a
                href={publicShopUrl(shop.slug)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-500 font-medium hover:underline flex items-center gap-0.5 truncate mt-0.5"
              >
                View public shop <ExternalLink className="size-2.5" />
              </a>
            </div>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-1.5">
          {!isPending &&
            NAV.map((item) => {
              const isActive = pathname === item.to;
              const Icon = item.icon;
              const isAnalyticsLocked =
                item.to === "/analytics" && shop && !shopFeatures(shop).analytics;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0" />
                    <span>
                      {item.label === "Menu & Items" ? `${catalogLabel} & Items` : item.label}
                    </span>
                  </div>
                  {isAnalyticsLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20 shrink-0">
                      <Lock className="size-2.5" /> Premium
                    </span>
                  )}
                </Link>
              );
            })}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-purple-400 transition-all hover:bg-purple-500/10 border border-purple-500/20",
                pathname === "/admin" && "bg-purple-500/20 font-bold",
              )}
            >
              <Shield className="size-4 shrink-0" />
              Super Admin
            </Link>
          )}
        </nav>

        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl"
          >
            <LogOut className="size-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b bg-background/80 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Mobile Drawer Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl border bg-muted/50 text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-base sm:text-xl font-bold truncate leading-tight">
                  {title}
                </h1>
                {description && (
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {actions}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hidden sm:flex lg:hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-9 px-3 rounded-xl border"
              >
                <LogOut className="size-3.5" /> Sign out
              </Button>
            </div>
          </div>

          {/* Quick Mobile Horizontal Navigation Bar */}
          <nav className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none lg:hidden">
            {!isPending &&
              [
                ...NAV,
                ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
              ].map((item) => {
                const isActive = pathname === item.to;
                const Icon = item.icon;
                const displayLabel = item.label === "Menu & Items" ? `${catalogLabel}` : item.label;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                      isActive
                        ? "border-amber-500 bg-amber-500 text-black font-bold shadow-sm"
                        : "border-border bg-card/80 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {displayLabel}
                  </Link>
                );
              })}
          </nav>
        </header>

        {/* Mobile Slide-Over Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Container */}
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-card p-6 shadow-2xl z-50 border-r border-border">
              <div className="flex items-center justify-between mb-6">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <img
                    src="/favicon.ico"
                    alt="MY Link QR Logo"
                    className="size-9 rounded-xl object-contain shadow-sm shrink-0"
                  />
                  <span className="font-display font-bold text-base">MY Link QR</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              {shop && (
                <div className="mb-6 rounded-2xl border bg-muted/40 p-3 flex items-center gap-3">
                  {shop.logo_url ? (
                    <img
                      src={shop.logo_url}
                      alt={shop.name}
                      className="size-9 rounded-xl object-cover border shrink-0"
                    />
                  ) : (
                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center border border-amber-500/20 shrink-0 text-sm">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{shop.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{shop.niche}</p>
                  </div>
                </div>
              )}

              <nav className="flex-1 space-y-1.5">
                {!isPending &&
                  NAV.map((item) => {
                    const isActive = pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition-all",
                          isActive
                            ? "bg-amber-500 text-black shadow-md"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="size-4" />
                          <span>
                            {item.label === "Menu & Items" ? `${catalogLabel} & Items` : item.label}
                          </span>
                        </div>
                        <ChevronRight className="size-4 opacity-60" />
                      </Link>
                    );
                  })}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="size-4" />
                      <span>Super Admin</span>
                    </div>
                    <ChevronRight className="size-4" />
                  </Link>
                )}
              </nav>

              <div className="pt-4 border-t border-border mt-auto">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void signOut();
                  }}
                  className="w-full justify-start text-xs font-bold text-red-500 border-red-500/20 hover:bg-red-500/10 h-10 rounded-xl"
                >
                  <LogOut className="size-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {isPending ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border bg-card p-6 sm:p-12 text-center mt-4 sm:mt-8 shadow-sm">
              <div className="rounded-full bg-yellow-500/10 p-4 border border-yellow-500/20">
                <Clock className="size-8 sm:size-10 text-yellow-500" />
              </div>
              <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold">
                Application Under Review
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Thank you for creating your business with MY Link QR! Your application has been
                received and is currently being reviewed by our team.
              </p>
              <p className="mt-4 text-xs sm:text-sm font-medium text-muted-foreground">
                Please check back later or wait for an approval email.
              </p>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Mobile Bottom Fixed App Navigation Bar */}
        {!isPending && (
          <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border bg-card/95 py-2 px-1 backdrop-blur-xl lg:hidden shadow-2xl">
            {[
              ...NAV,
              ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
            ].map((item) => {
              const isActive = pathname === item.to;
              const Icon = item.icon;
              const displayLabel = item.label === "Menu & Items" ? catalogLabel : item.label;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition-all rounded-xl",
                    isActive
                      ? "text-amber-500 font-bold scale-105"
                      : "text-muted-foreground hover:text-foreground opacity-80",
                  )}
                >
                  <div
                    className={cn(
                      "p-1 rounded-lg transition-colors",
                      isActive && "bg-amber-500/10 text-amber-500",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="truncate max-w-[60px]">{displayLabel}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

export default DashboardShell;
