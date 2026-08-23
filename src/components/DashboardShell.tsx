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
          <span className="font-display text-lg font-semibold">My QR Link</span>
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
        <header className="sticky top-0 z-20 border-b bg-background/80 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-semibold sm:text-2xl">{title}</h1>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto no-scrollbar lg:hidden">
            {!isPending &&
              [
                ...NAV,
                ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground",
                    pathname === item.to && "border-primary bg-accent text-accent-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </header>
        <main className="flex-1 p-5 lg:p-8">
          {isPending ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-12 text-center mt-8">
              <div className="rounded-full bg-yellow-500/10 p-4">
                <Clock className="size-10 text-yellow-500" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-bold">Application Under Review</h2>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Thank you for creating your business with My QR Link! Your application has been
                received and is currently being reviewed by our team.
              </p>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Please check back later or wait for an approval email.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
