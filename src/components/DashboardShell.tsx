import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Palette,
  QrCode,
  Settings,
  Shield,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMyShop } from "@/hooks/useShopData";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/qr", label: "QR Code", icon: QrCode },
  { to: "/themes", label: "Themes", icon: Palette },
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
  const { data: shop } = useMyShop();
  const isPending = shop?.status === "pending";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-gradient text-sidebar-primary-foreground">
            <QrCode className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">MY Link QR</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {!isPending &&
            NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.to && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-primary transition-colors hover:bg-sidebar-accent",
                pathname === "/admin" && "bg-sidebar-accent",
              )}
            >
              <Shield className="size-4" />
              Super Admin
            </Link>
          )}
        </nav>
        <Button
          variant="ghost"
          onClick={signOut}
          className="justify-start text-sidebar-foreground/70"
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/80 px-4 py-3.5 backdrop-blur-md lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-bold sm:text-2xl truncate">{title}</h1>
              {description && <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions}
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex lg:hidden items-center gap-1 text-xs text-red-500 border-red-500/20 hover:bg-red-500/10 px-2.5 h-8"
              >
                <LogOut className="size-3.5" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
          {/* Top Horizontal Chips Navigation for Quick Mobile Access */}
          <nav className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar lg:hidden pb-1">
            {!isPending &&
              [
                ...NAV,
                ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
              ].map((item) => {
                const isActive = pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-all shrink-0",
                      isActive
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                        : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </header>

        {/* Main Content Area with Bottom Padding for Mobile Nav */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {isPending ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-6 sm:p-12 text-center mt-4 sm:mt-8 shadow-sm">
              <div className="rounded-full bg-yellow-500/10 p-4">
                <Clock className="size-8 sm:size-10 text-yellow-500" />
              </div>
              <h2 className="mt-5 font-display text-xl sm:text-2xl font-bold">Application Under Review</h2>
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

        {/* Mobile Bottom Fixed App Bar */}
        {!isPending && (
          <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-border bg-card/95 py-2 px-1 backdrop-blur-xl lg:hidden shadow-lg">
            {[
              ...NAV,
              ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
            ].map((item) => {
              const isActive = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold transition-all rounded-xl",
                    isActive
                      ? "text-primary font-bold scale-105"
                      : "text-muted-foreground hover:text-foreground opacity-80",
                  )}
                >
                  <div className={cn("p-1 rounded-lg", isActive && "bg-primary/10")}>
                    <Icon className="size-4" />
                  </div>
                  <span className="truncate max-w-[55px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
