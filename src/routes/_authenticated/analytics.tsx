import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics, useIsAdmin, useMyShop } from "@/hooks/useShopData";
import { shopFeatures } from "@/lib/shop";
import { DashboardShell } from "@/components/DashboardShell";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Eye,
  QrCode,
  Activity,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  RefreshCw,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Traffic Insights — MY Link QR" },
      {
        name: "description",
        content:
          "Comprehensive real-time tracking of menu views, QR scans, and customer device analytics.",
      },
      { property: "og:title", content: "Analytics — MY Link QR" },
      {
        property: "og:description",
        content: "Track customer engagement, peak times, device breakdown and QR performance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);

  const [days, setDays] = useState<number>(30);

  const hasAnalytics = shopFeatures(shop).analytics;

  const resetAt = (shop?.features as Record<string, unknown> | null)?.["analytics_reset_at"] as
    string | undefined;

  const { data: events, isLoading, refetch, isRefetching } = useAnalytics(shop?.id, days, resetAt);

  const rows = events ?? [];

  // Compute metrics
  const viewsCount = useMemo(() => rows.filter((r) => r.event_type === "view").length, [rows]);
  const scansCount = useMemo(() => rows.filter((r) => r.event_type === "scan").length, [rows]);
  const totalCount = rows.length;

  const qrRatio = totalCount > 0 ? Math.round((scansCount / totalCount) * 100) : 0;

  // Device Breakdown
  const deviceStats = useMemo<{
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  }>(() => {
    const counts = { mobile: 0, desktop: 0, tablet: 0, other: 0 };
    rows.forEach((r) => {
      const dev = (r.device || "mobile").toLowerCase();
      if (
        dev.includes("mobile") ||
        dev.includes("phone") ||
        dev.includes("android") ||
        dev.includes("iphone")
      ) {
        counts.mobile++;
      } else if (
        dev.includes("desktop") ||
        dev.includes("windows") ||
        dev.includes("mac") ||
        dev.includes("linux")
      ) {
        counts.desktop++;
      } else if (dev.includes("tablet") || dev.includes("ipad")) {
        counts.tablet++;
      } else {
        counts.other++;
      }
    });
    return counts;
  }, [rows]);

  // Timeline chart data (grouped by date)
  const timelineData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; displayDate: string; views: number; scans: number; total: number }
    >();

    // Seed all days in selected range so graph is continuous
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, "yyyy-MM-dd");
      const displayDate = format(d, days > 14 ? "MMM dd" : "EEE dd");
      map.set(key, { date: key, displayDate, views: 0, scans: 0, total: 0 });
    }

    rows.forEach((r) => {
      if (!r.created_at) return;
      const key = format(parseISO(r.created_at), "yyyy-MM-dd");
      const entry = map.get(key);
      if (entry) {
        if (r.event_type === "scan") entry.scans++;
        else entry.views++;
        entry.total++;
      }
    });

    return Array.from(map.values());
  }, [rows, days]);

  // Hourly Distribution (0-23 hours)
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      hourNum: i,
      label: i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`,
      count: 0,
    }));

    rows.forEach((r) => {
      if (!r.created_at) return;
      const h = new Date(r.created_at).getHours();
      if (hours[h]) hours[h].count++;
    });

    return hours;
  }, [rows]);

  // Device pie chart data
  const pieData = useMemo(
    () =>
      [
        { name: "Mobile", value: deviceStats.mobile, color: "#3B82F6" },
        { name: "Desktop", value: deviceStats.desktop, color: "#10B981" },
        { name: "Tablet", value: deviceStats.tablet, color: "#8B5CF6" },
        { name: "Other", value: deviceStats.other, color: "#F59E0B" },
      ].filter((d) => d.value > 0),
    [deviceStats],
  );

  // CSV Export handler
  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No analytics data available to export.");
      return;
    }
    const headers = ["Timestamp", "Event Type", "Device", "Shop ID", "Event ID"];
    const csvRows = rows.map((r) => [
      r.created_at ? format(parseISO(r.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      r.event_type || "view",
      r.device || "Unknown",
      r.shop_id || "",
      r.id || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${shop?.slug || "shop"}_${days}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics data exported to CSV!");
  };

  return (
    <DashboardShell
      title="Analytics & Insights"
      description="Live performance, customer engagement, and QR scanner metrics."
      isAdmin={isAdmin}
    >
      {!shop ? (
        <div className="rounded-3xl border bg-card p-12 text-center shadow-sm">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No Shop Connected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please create your shop profile on the dashboard to start tracking analytics.
          </p>
        </div>
      ) : !hasAnalytics ? (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card to-card p-8 sm:p-12 shadow-xl text-center max-w-4xl mx-auto my-6 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-inner">
            <Lock className="h-10 w-10" />
          </div>

          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/30">
            <Sparkles className="h-3.5 w-3.5" /> PREMIUM PLAN FEATURE
          </span>

          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Analytics & Traffic Insights Locked
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Real-time scan tracking, customer engagement metrics, device breakdowns, and hourly rush
            heatmaps are exclusively available on the{" "}
            <strong className="text-amber-500 font-semibold">Premium Plan (₹799/mo)</strong>.
          </p>

          {/* Feature list preview grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 text-left max-w-2xl mx-auto">
            <div className="rounded-2xl border bg-card/80 p-4 flex items-start gap-3 shadow-sm">
              <div className="rounded-xl p-2 bg-blue-500/10 text-blue-500 shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Menu Views & QR Scans</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Track direct digital visits vs physical QR code scans with conversion % ratios.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 p-4 flex items-start gap-3 shadow-sm">
              <div className="rounded-xl p-2 bg-purple-500/10 text-purple-500 shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Device & Hardware Breakdown</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Analyze visitor platforms (iPhone, Android, Tablet, Desktop) in real time.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 p-4 flex items-start gap-3 shadow-sm">
              <div className="rounded-xl p-2 bg-amber-500/10 text-amber-500 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Hourly Peak Rush Heatmap</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Discover your busiest lunch and dinner times to optimize staffing & specials.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 p-4 flex items-start gap-3 shadow-sm">
              <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-500 shrink-0">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">1-Click CSV Data Export</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Export detailed timestamped customer log files for reporting & business growth.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button
                size="lg"
                className="h-12 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 gap-2"
              >
                <Sparkles className="h-4 w-4" /> Upgrade to Premium Plan (₹799/mo)
              </Button>
            </Link>
            {isAdmin ? (
              <Link to="/admin">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 rounded-2xl text-sm font-semibold gap-1.5 text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20"
                >
                  <ShieldCheck className="h-4 w-4" /> Set Plan in Admin Console
                </Button>
              </Link>
            ) : (
              <Link to="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 rounded-2xl text-sm font-semibold gap-1.5"
                >
                  View All Plans <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border bg-card/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time Horizon:
              </span>
              <div className="flex rounded-xl bg-muted p-1">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                      days === d
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="h-9 gap-2 rounded-xl text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 gap-2 rounded-xl text-xs bg-primary hover:bg-primary/90"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Events"
              value={totalCount}
              subtitle={`Activity in last ${days} days`}
              icon={Activity}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
            <StatCard
              title="Menu Views"
              value={viewsCount}
              subtitle="Direct digital menu visits"
              icon={Eye}
              color="text-blue-500"
              bgColor="bg-blue-500/10"
            />
            <StatCard
              title="QR Scans"
              value={scansCount}
              subtitle="Physical QR code scans"
              icon={QrCode}
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StatCard
              title="Scan Conversion"
              value={`${qrRatio}%`}
              subtitle="Visits originated from QR code"
              icon={TrendingUp}
              color="text-purple-500"
              bgColor="bg-purple-500/10"
            />
          </div>

          {/* Main Visual Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Timeline Traffic Area Chart */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Traffic Trends
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daily breakdown of digital menu visits vs QR scans
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
                    <span className="text-muted-foreground font-medium">Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-muted-foreground font-medium">QR Scans</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading chart data…
                  </div>
                ) : rows.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-muted-foreground">
                    <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-medium">No activity recorded for this date range.</p>
                    <p className="text-xs mt-1">
                      Scan your shop QR code or visit the menu link to see live tracking!
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="displayDate"
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          borderColor: "rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        name="Menu Views"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorViews)"
                      />
                      <Area
                        type="monotone"
                        dataKey="scans"
                        name="QR Scans"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorScans)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Device Mix Card */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-purple-500" /> Device Distribution
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visitor hardware & platform breakdown
                </p>
              </div>

              <div className="my-4 flex items-center justify-center h-48">
                {pieData.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No device data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t text-xs">
                <DeviceRow
                  icon={Smartphone}
                  label="Mobile"
                  count={deviceStats.mobile}
                  total={totalCount}
                  color="bg-blue-500"
                />
                <DeviceRow
                  icon={Monitor}
                  label="Desktop"
                  count={deviceStats.desktop}
                  total={totalCount}
                  color="bg-emerald-500"
                />
                <DeviceRow
                  icon={Tablet}
                  label="Tablet"
                  count={deviceStats.tablet}
                  total={totalCount}
                  color="bg-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Peak Hours & Live Activity Feed Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Peak Hours Histogram */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" /> Hourly Peak Traffic
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customer visit volume by hour of day (24h clock)
                  </p>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                {rows.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No hourly data logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hourlyData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="label"
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval={2}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" name="Visits" radius={[4, 4, 0, 0]}>
                        {hourlyData.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={
                              entry.count > 5 ? "#F59E0B" : entry.count > 0 ? "#3B82F6" : "#334155"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" /> Recent Events
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest customer interactions</p>
              </div>

              <div className="my-4 space-y-3 max-h-56 overflow-y-auto pr-1">
                {rows.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8">
                    No events logged yet.
                  </p>
                ) : (
                  rows.slice(0, 10).map((row, idx) => (
                    <div
                      key={row.id || idx}
                      className="flex items-center justify-between rounded-xl border bg-muted/30 p-2.5 text-xs transition-all hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`rounded-lg p-1.5 ${
                            row.event_type === "scan"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-blue-500/15 text-blue-500"
                          }`}
                        >
                          {row.event_type === "scan" ? (
                            <QrCode className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold capitalize text-foreground">
                            {row.event_type === "scan" ? "QR Scan" : "Menu View"}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">
                            Device: {row.device || "Mobile"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {row.created_at
                          ? format(parseISO(row.created_at), "HH:mm, MMM d")
                          : "Just now"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Showing last 10 of {totalCount} events</span>
                <span className="font-medium text-foreground">Auto-updates</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className={`rounded-xl p-2.5 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
      <div className="mt-3">
        <h4 className="text-3xl font-bold tracking-tight text-foreground">{value}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function DeviceRow({
  icon: Icon,
  label,
  count,
  total,
  color,
}: {
  icon: any;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="font-semibold w-8 text-right">{percent}%</span>
        <span className="text-muted-foreground text-[10px]">({count})</span>
      </div>
    </div>
  );
}
