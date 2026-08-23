import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, useIsAdmin, useMyShop } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — My QR Link" },
      { name: "description", content: "Track views and scans." },
      { property: "og:title", content: "Analytics — My QR Link" },
      { property: "og:description", content: "See menu views, QR scans and device mix." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const { data: events } = useAnalytics(shop?.id);

  const rows = events ?? [];
  const byDevice = rows.reduce<Record<string, number>>((acc, e) => {
    const key = e.device ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardShell title="Analytics" description="Last 30 days." isAdmin={isAdmin}>
      {!shop ? (
        <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card label="Total events" value={rows.length} />
            <Card label="Menu views" value={rows.filter((r) => r.event_type === "view").length} />
            <Card label="QR scans" value={rows.filter((r) => r.event_type === "scan").length} />
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Devices</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(byDevice).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </li>
              ))}
              {rows.length === 0 && <p className="text-muted-foreground">No activity yet.</p>}
            </ul>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
