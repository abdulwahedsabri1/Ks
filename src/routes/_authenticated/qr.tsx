import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { publicShopUrl } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/qr")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "QR Code — My QR Link" },
      { name: "description", content: "Download your custom QR code for tables and counters." },
      { property: "og:title", content: "QR Code — My QR Link" },
      { property: "og:description", content: "Download and share your branded menu QR code." },
    ],
  }),
  component: QrPage,
});

const SIZE = 900;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function QrPage() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [png, setPng] = useState("");
  const [dark, setDark] = useState("#0F172A");
  const [busy, setBusy] = useState(false);

  const url = shop ? `${publicShopUrl(shop.slug)}?src=qr` : "";

  const render = useCallback(async () => {
    if (!url || !canvasRef.current) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current;
      canvas.width = SIZE;
      canvas.height = SIZE;
      await QRCode.toCanvas(canvas, url, {
        width: SIZE,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark, light: "#FFFFFF" },
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const badge = SIZE * 0.24;
      const x = (SIZE - badge) / 2;
      ctx.save();
      ctx.shadowColor = "rgba(15,23,42,0.18)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, x, x, badge, badge, badge * 0.26);
      ctx.fill();
      ctx.restore();

      const inner = badge * 0.76;
      const ix = (SIZE - inner) / 2;
      if (shop?.logo_url) {
        try {
          const img = await loadImage(shop.logo_url);
          ctx.save();
          roundRect(ctx, ix, ix, inner, inner, inner * 0.24);
          ctx.clip();
          ctx.drawImage(img, ix, ix, inner, inner);
          ctx.restore();
        } catch {
          drawInitials(ctx, ix, inner, shop.name, dark);
        }
      } else if (shop) {
        drawInitials(ctx, ix, inner, shop.name, dark);
      }
      setPng(canvas.toDataURL("image/png"));
    } finally {
      setBusy(false);
    }
  }, [url, dark, shop]);

  useEffect(() => {
    void render();
  }, [render]);

  return (
    <DashboardShell
      title="QR Code"
      description="Branded QR with your logo in the centre."
      isAdmin={!!isAdmin}
    >
      {!shop ? (
        <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto rounded-3xl bg-white p-4 shadow-xl shadow-black/5 ring-1 ring-black/5">
              <canvas ref={canvasRef} className="mx-auto w-full max-w-[280px] h-auto rounded-xl" />
            </div>
            <div className="mt-8 space-y-1.5">
              <p className="break-all text-sm font-medium">{url}</p>
              <p className="text-xs text-muted-foreground">
                This link is public — customers can scan and browse without signing in.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full" disabled={!png}>
                <a href={png} download={`${shop.slug}-qr.png`}>
                  <Download className="mr-2 size-4" /> Download PNG
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full bg-transparent"
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                  toast.success("Link copied");
                }}
              >
                <Copy className="mr-2 size-4" /> Copy link
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Customise</h2>
            <div className="space-y-2">
              <Label htmlFor="qr-color">QR colour</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="qr-color"
                  type="color"
                  value={dark}
                  onChange={(e) => setDark(e.target.value)}
                  className="h-10 w-16 p-1"
                />
                <div className="flex gap-2">
                  {["#0F172A", "#10B981", "#7C3AED", "#DC2626"].map((c) => (
                    <button
                      key={c}
                      aria-label={`Use colour ${c}`}
                      onClick={() => setDark(c)}
                      className="size-8 rounded-full border"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {shop.logo_url
                ? "Your shop logo is placed in the centre. Update it in Shop Settings."
                : "Upload a logo in Shop Settings to place it in the centre of the QR."}
            </p>
            <Button variant="outline" onClick={() => void render()} disabled={busy}>
              <RefreshCw className="size-4" /> Regenerate
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function drawInitials(
  ctx: CanvasRenderingContext2D,
  x: number,
  size: number,
  name: string,
  color: string,
) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, x, x, size, size, size * 0.24);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 ${size * 0.42}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, x + size / 2, x + size / 2 + size * 0.02);
  ctx.restore();
}
