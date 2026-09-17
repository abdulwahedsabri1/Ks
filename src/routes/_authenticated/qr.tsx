import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Copy,
  Download,
  Printer,
  RefreshCw,
  Sparkles,
  QrCode as QrIcon,
  Check,
  Store,
  Layers,
  Palette,
  Crown,
  Zap,
  Coffee,
  Gem,
  Utensils,
  Leaf,
  Sun,
  Square,
  Radio,
  Scissors,
  Bed,
  Diamond,
  Stethoscope,
  Dumbbell,
  Truck,
  Filter,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin, useMyShop } from "@/hooks/useShopData";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  publicShopUrl,
  shopGoogleReviewLink,
  shopMapUrl,
  shopCatalogLabel,
  shopFeatures,
} from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/qr")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "QR Code Generator — MY Link QR" },
      { name: "description", content: "Download your custom QR code for tables and counters." },
      { property: "og:title", content: "QR Code Generator — MY Link QR" },
      { property: "og:description", content: "Download and share your branded QR code." },
    ],
  }),
  component: QrPage,
});

export type FrameStyle =
  | "clean"
  | "stand"
  | "poster"
  | "luxury_gold"
  | "cyber_neon"
  | "nordic_warm"
  | "royal_glass"
  | "retro_diner"
  | "emerald_botanical"
  | "sunset_vibes"
  | "minimal_mono"
  | "hologram_futuristic"
  | "rose_gold_salon"
  | "hotel_concierge"
  | "jewelry_luxury"
  | "clinic_medical"
  | "gym_fitness"
  | "food_truck";

export type CategoryFilter =
  | "all"
  | "food_dining"
  | "salon_beauty"
  | "hotels_hospitality"
  | "retail_shopping"
  | "health_fitness"
  | "tech_modern"
  | "minimal_pure";

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

function drawInitials(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  name: string,
  bgColor: string,
) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  ctx.save();
  ctx.fillStyle = bgColor;
  roundRect(ctx, x, y, size, size, size * 0.24);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size * 0.42}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, x + size / 2, y + size / 2 + size * 0.02);
  ctx.restore();
}

export function QrPage() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const { data: shop } = useMyShop(user?.id);
  const catalogLabel = shopCatalogLabel(shop);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [png, setPng] = useState("");
  const [dark, setDark] = useState("#0F172A");
  const [showLogo, setShowLogo] = useState(true);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("stand");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const [qrType, setQrType] = useState<"menu" | "map" | "review">("menu");

  const menuUrl = shop ? `${publicShopUrl(shop.slug)}?src=qr` : "";
  const mapUrl = shop ? shopMapUrl(shop) || "" : "";
  const reviewUrl = shop ? shopGoogleReviewLink(shop) || "" : "";

  const targetUrl =
    qrType === "menu" ? menuUrl : qrType === "map" ? mapUrl : qrType === "review" ? reviewUrl : "";

  const render = useCallback(async () => {
    if (!targetUrl || !canvasRef.current || !shop) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current;
      const isSquare = frameStyle === "clean";
      const width = 1200;
      const height = isSquare ? 1200 : 1600;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. MINIMAL 1:1
      if (frameStyle === "clean") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        const qrCanvas = document.createElement("canvas");
        const qrSize = 1040;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark, light: "#FFFFFF" },
        });

        ctx.drawImage(qrCanvas, (width - qrSize) / 2, (height - qrSize) / 2);

        if (showLogo) {
          const badgeSize = width * 0.22;
          const bx = (width - badgeSize) / 2;
          const by = (height - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = (width - innerSize) / 2;
          const iy = (height - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
          }
        }
      }
      // 2. TABLE STAND FRAME (Classic)
      else if (frameStyle === "stand") {
        ctx.fillStyle = "#100C09";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#18120D";
        roundRect(ctx, 40, 40, width - 80, 260, 32);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 196, 90, 0.3)";
        ctx.lineWidth = 4;
        roundRect(ctx, 40, 40, width - 80, 260, 32);
        ctx.stroke();

        ctx.fillStyle = "#FFC45A";
        ctx.font = "bold 44px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`SCAN FOR DIGITAL ${catalogLabel.toUpperCase()}`, width / 2, 130);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 56px sans-serif";
        ctx.fillText(shop.name, width / 2, 210);

        const boxSize = 880;
        const boxX = (width - boxSize) / 2;
        const boxY = 340;

        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, boxX, boxY, boxSize, boxSize, 40);
        ctx.fill();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 780;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark, light: "#FFFFFF" },
        });

        const qx = boxX + (boxSize - qrSize) / 2;
        const qy = boxY + (boxSize - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = boxSize * 0.22;
          const bx = boxX + (boxSize - badgeSize) / 2;
          const by = boxY + (boxSize - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 16;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = boxX + (boxSize - innerSize) / 2;
          const iy = boxY + (boxSize - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
          }
        }

        ctx.fillStyle = "#FFC45A";
        ctx.font = "bold 38px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`📱 Point phone camera at QR code`, width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "32px sans-serif";
        ctx.fillText(`No app download required`, width / 2, 1370);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "28px sans-serif";
        ctx.fillText(`Powered by MY Link QR`, width / 2, 1500);
      }
      // 3. POSTER CARD FRAME
      else if (frameStyle === "poster") {
        ctx.fillStyle = "#F5F0E7";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#100C09";
        ctx.fillRect(0, 0, width, 320);

        ctx.fillStyle = "#FFC45A";
        ctx.font = "bold 64px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(shop.name, width / 2, 140);

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "34px sans-serif";
        ctx.fillText(shop.tagline || shop.niche, width / 2, 220);

        const cardW = 960;
        const cardH = 1160;
        const cx = (width - cardW) / 2;
        const cy = 380;

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 44);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#100C09";
        ctx.font = "bold 44px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Scan for Live ${catalogLabel}`, width / 2, cy + 100);

        const qrCanvas = document.createElement("canvas");
        const qrSize = 740;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark, light: "#FFFFFF" },
        });

        const qx = (width - qrSize) / 2;
        const qy = cy + 160;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = qrSize * 0.22;
          const bx = (width - badgeSize) / 2;
          const by = qy + (qrSize - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 16;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = (width - innerSize) / 2;
          const iy = qy + (qrSize - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, dark);
          }
        }

        ctx.fillStyle = "#100C09";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(`✨ Browse items & order instantly`, width / 2, cy + cardH - 80);
      }
      // 4. LUXURY OBSIDIAN & GOLD FRAME
      else if (frameStyle === "luxury_gold") {
        ctx.fillStyle = "#0A0908";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 6;
        roundRect(ctx, 45, 45, width - 90, height - 90, 40);
        ctx.stroke();

        ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
        ctx.lineWidth = 2;
        roundRect(ctx, 65, 65, width - 130, height - 130, 32);
        ctx.stroke();

        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 36px serif";
        ctx.textAlign = "center";
        ctx.fillText("❖  EXCLUSIVE DIGITAL MENU  ❖", width / 2, 150);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px serif";
        ctx.fillText(shop.name, width / 2, 240);

        ctx.fillStyle = "rgba(212, 175, 55, 0.8)";
        ctx.font = "italic 30px serif";
        ctx.fillText(shop.tagline || shop.niche || "Luxury Experience", width / 2, 310);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 370;

        ctx.save();
        ctx.shadowColor = "rgba(212, 175, 55, 0.25)";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 36);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0A0908", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 18;
          ctx.fillStyle = "#0A0908";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 4;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#D4AF37");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#D4AF37");
          }
        }

        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 36px serif";
        ctx.fillText("SCAN TO EXPLORE COLLECTION", width / 2, 1340);

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Instant contactless browsing on your phone", width / 2, 1400);

        ctx.fillStyle = "rgba(212, 175, 55, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1500);
      }
      // 5. CYBER NEON DARK FRAME
      else if (frameStyle === "cyber_neon") {
        ctx.fillStyle = "#090D16";
        ctx.fillRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, "#06B6D4");
        grad.addColorStop(0.5, "#3B82F6");
        grad.addColorStop(1, "#9333EA");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 8;
        roundRect(ctx, 40, 40, width - 80, height - 80, 44);
        ctx.stroke();

        ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
        roundRect(ctx, width / 2 - 260, 90, 520, 70, 35);
        ctx.fill();
        ctx.strokeStyle = "#06B6D4";
        ctx.lineWidth = 2;
        roundRect(ctx, width / 2 - 260, 90, 520, 70, 35);
        ctx.stroke();

        ctx.fillStyle = "#06B6D4";
        ctx.font = "bold 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ TOUCHLESS DIGITAL MENU", width / 2, 136);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 58px sans-serif";
        ctx.fillText(shop.name, width / 2, 240);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "#06B6D4";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#090D16", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "#9333EA";
          ctx.shadowBlur = 20;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#06B6D4");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#06B6D4");
          }
        }

        ctx.fillStyle = "#06B6D4";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText("SCAN WITH ANY CAMERA", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "30px sans-serif";
        ctx.fillText("Instant order & direct WhatsApp chat", width / 2, 1370);

        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "26px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 6. NORDIC WARM LINEN FRAME
      else if (frameStyle === "nordic_warm") {
        ctx.fillStyle = "#F7F4EF";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#7C402B";
        ctx.lineWidth = 4;
        roundRect(ctx, 45, 45, width - 90, height - 90, 36);
        ctx.stroke();

        ctx.fillStyle = "#7C402B";
        ctx.font = "bold 32px serif";
        ctx.textAlign = "center";
        ctx.fillText("WELCOME TO", width / 2, 130);

        ctx.fillStyle = "#2D2825";
        ctx.font = "bold 60px serif";
        ctx.fillText(shop.name, width / 2, 210);

        ctx.fillStyle = "#4A5D4E";
        ctx.font = "italic 32px serif";
        ctx.fillText("Scan our digital menu & place your order", width / 2, 280);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(45, 40, 37, 0.08)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 44);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#2D2825", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.12)";
          ctx.shadowBlur = 16;
          ctx.fillStyle = "#F7F4EF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#7C402B";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#7C402B");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#7C402B");
          }
        }

        ctx.fillStyle = "#7C402B";
        ctx.font = "bold 34px serif";
        ctx.fillText("🌿 Fresh • Artisanal • Handcrafted", width / 2, 1310);

        ctx.fillStyle = "#2D2825";
        ctx.font = "28px sans-serif";
        ctx.fillText("Point your camera to browse live items", width / 2, 1370);

        ctx.fillStyle = "rgba(45, 40, 37, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 7. ROYAL GLASSMORPHIC FRAME
      else if (frameStyle === "royal_glass") {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#1E1B4B");
        bgGrad.addColorStop(0.5, "#312E81");
        bgGrad.addColorStop(1, "#4C1D95");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const glassW = 1060;
        const glassH = 1460;
        const gx = (width - glassW) / 2;
        const gy = (height - glassH) / 2;

        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        roundRect(ctx, gx, gy, glassW, glassH, 50);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 3;
        roundRect(ctx, gx, gy, glassW, glassH, 50);
        ctx.stroke();

        ctx.fillStyle = "#A855F7";
        ctx.font = "bold 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ INSTANT DIGITAL CATALOG", width / 2, gy + 110);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px sans-serif";
        ctx.fillText(shop.name, width / 2, gy + 195);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = gy + 260;

        ctx.save();
        ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#1E1B4B", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 18;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#4C1D95");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#4C1D95");
          }
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("Scan to Browse & Order Instantly", width / 2, gy + glassH - 140);

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "28px sans-serif";
        ctx.fillText("No registration required • Powered by MY Link QR", width / 2, gy + glassH - 75);
      }
      // 8. RETRO DINER & BISTRO
      else if (frameStyle === "retro_diner") {
        ctx.fillStyle = "#7A0C0C";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#FFFDD0";
        ctx.lineWidth = 8;
        roundRect(ctx, 45, 45, width - 90, height - 90, 32);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 253, 208, 0.4)";
        ctx.lineWidth = 3;
        roundRect(ctx, 65, 65, width - 130, height - 130, 24);
        ctx.stroke();

        ctx.fillStyle = "#FFFDD0";
        ctx.font = "bold 38px serif";
        ctx.textAlign = "center";
        ctx.fillText("★ VINTAGE BISTRO & DINER ★", width / 2, 140);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 64px serif";
        ctx.fillText(shop.name, width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.fillStyle = "#FFFDD0";
        roundRect(ctx, cx, cy, cardW, cardH, 36);
        ctx.fill();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#7A0C0C", light: "#FFFDD0" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#7A0C0C";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#FFFDD0";
          ctx.lineWidth = 4;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#FFFDD0");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#FFFDD0");
          }
        }

        ctx.fillStyle = "#FFFDD0";
        ctx.font = "bold 38px serif";
        ctx.fillText("SCAN TO ORDER AT YOUR TABLE", width / 2, 1310);

        ctx.fillStyle = "rgba(255, 253, 208, 0.75)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Contactless menu & WhatsApp messaging", width / 2, 1370);

        ctx.fillStyle = "rgba(255, 253, 208, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 9. EMERALD BOTANICAL & SPA
      else if (frameStyle === "emerald_botanical") {
        ctx.fillStyle = "#032B26";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#A7F3D0";
        ctx.lineWidth = 4;
        roundRect(ctx, 45, 45, width - 90, height - 90, 44);
        ctx.stroke();

        ctx.fillStyle = "#A7F3D0";
        ctx.font = "bold 32px serif";
        ctx.textAlign = "center";
        ctx.fillText("🌿 NATURALLY CRAFTED", width / 2, 130);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 58px serif";
        ctx.fillText(shop.name, width / 2, 215);

        ctx.fillStyle = "rgba(167, 243, 208, 0.8)";
        ctx.font = "italic 30px serif";
        ctx.fillText("Scan for Menu, Spa Services & Booking", width / 2, 280);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(167, 243, 208, 0.2)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#032B26", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#032B26";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#A7F3D0";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#A7F3D0");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#A7F3D0");
          }
        }

        ctx.fillStyle = "#A7F3D0";
        ctx.font = "bold 34px serif";
        ctx.fillText("SCAN TO VIEW DIGITAL CATALOG", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Eco-friendly • Pure • Handcrafted", width / 2, 1370);

        ctx.fillStyle = "rgba(167, 243, 208, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 10. SUNSET LOUNGE & BAR
      else if (frameStyle === "sunset_vibes") {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, "#FF3B30");
        bgGrad.addColorStop(0.5, "#FF9500");
        bgGrad.addColorStop(1, "#7000FF");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const cardW = 960;
        const cardH = 1380;
        const cx = (width - cardW) / 2;
        const cy = (height - cardH) / 2;

        ctx.fillStyle = "rgba(15, 15, 26, 0.88)";
        roundRect(ctx, cx, cy, cardW, cardH, 50);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 149, 0, 0.5)";
        ctx.lineWidth = 4;
        roundRect(ctx, cx, cy, cardW, cardH, 50);
        ctx.stroke();

        ctx.fillStyle = "#FF9500";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🍹 HAPPY HOUR & DIGITAL MENU", width / 2, cy + 110);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(shop.name, width / 2, cy + 200);

        const qrCanvas = document.createElement("canvas");
        const qrSize = 740;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0F0F1A", light: "#FFFFFF" },
        });

        const qx = (width - qrSize) / 2;
        const qy = cy + 260;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = qrSize * 0.22;
          const bx = (width - badgeSize) / 2;
          const by = qy + (qrSize - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = (width - innerSize) / 2;
          const iy = qy + (qrSize - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#FF9500");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#FF9500");
          }
        }

        ctx.fillStyle = "#FF9500";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("SCAN TO VIEW MENU & ORDER", width / 2, cy + cardH - 140);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Instant Order & Direct WhatsApp Messaging", width / 2, cy + cardH - 75);
      }
      // 11. MATTE MONOCHROMATIC
      else if (frameStyle === "minimal_mono") {
        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        roundRect(ctx, 40, 40, width - 80, height - 80, 24);
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 34px monospace";
        ctx.textAlign = "center";
        ctx.fillText("[ DIGITAL CATALOG ]", width / 2, 130);

        ctx.font = "bold 64px sans-serif";
        ctx.fillText(shop.name.toUpperCase(), width / 2, 220);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 24);
        ctx.fill();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#121212", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#121212";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#FFFFFF");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#FFFFFF");
          }
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px monospace";
        ctx.fillText("POINT CAMERA TO ACCESS", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "26px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 12. HOLOGRAPHIC PRISM (FUTURISTIC)
      else if (frameStyle === "hologram_futuristic") {
        ctx.fillStyle = "#040711";
        ctx.fillRect(0, 0, width, height);

        const borderGrad = ctx.createLinearGradient(0, 0, width, height);
        borderGrad.addColorStop(0, "#EC4899");
        borderGrad.addColorStop(0.5, "#06B6D4");
        borderGrad.addColorStop(1, "#EAB308");

        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 10;
        roundRect(ctx, 40, 40, width - 80, height - 80, 48);
        ctx.stroke();

        ctx.fillStyle = "rgba(236, 72, 153, 0.12)";
        roundRect(ctx, width / 2 - 280, 90, 560, 70, 35);
        ctx.fill();
        ctx.strokeStyle = "#EC4899";
        ctx.lineWidth = 2;
        roundRect(ctx, width / 2 - 280, 90, 560, 70, 35);
        ctx.stroke();

        ctx.fillStyle = "#EC4899";
        ctx.font = "bold 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ AI DIGITAL INTERFACE", width / 2, 136);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px sans-serif";
        ctx.fillText(shop.name, width / 2, 240);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "#EC4899";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 44);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#040711", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.shadowColor = "#06B6D4";
          ctx.shadowBlur = 24;
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#EC4899");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#EC4899");
          }
        }

        ctx.fillStyle = "#06B6D4";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText("SCAN WITH ANY SMARTPHONE", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "30px sans-serif";
        ctx.fillText("Instant order & direct WhatsApp chat", width / 2, 1370);

        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "26px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 13. ROSE GOLD SALON & BEAUTY
      else if (frameStyle === "rose_gold_salon") {
        ctx.fillStyle = "#2D0B1E";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#F472B6";
        ctx.lineWidth = 6;
        roundRect(ctx, 45, 45, width - 90, height - 90, 40);
        ctx.stroke();

        ctx.strokeStyle = "rgba(251, 113, 133, 0.4)";
        ctx.lineWidth = 2;
        roundRect(ctx, 65, 65, width - 130, height - 130, 32);
        ctx.stroke();

        ctx.fillStyle = "#F472B6";
        ctx.font = "bold 34px serif";
        ctx.textAlign = "center";
        ctx.fillText("✨ SALON & BEAUTY PRICE LIST ✨", width / 2, 140);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px serif";
        ctx.fillText(shop.name, width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(244, 114, 182, 0.3)";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#2D0B1E", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#2D0B1E";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#F472B6";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#F472B6");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#F472B6");
          }
        }

        ctx.fillStyle = "#F472B6";
        ctx.font = "bold 36px serif";
        ctx.fillText("SCAN FOR SERVICES & APPOINTMENTS", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("View Rate Card, Packages & Book on WhatsApp", width / 2, 1370);

        ctx.fillStyle = "rgba(244, 114, 182, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 14. GRAND HOTEL CONCIERGE
      else if (frameStyle === "hotel_concierge") {
        ctx.fillStyle = "#0B132B";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#F4D03F";
        ctx.lineWidth = 6;
        roundRect(ctx, 45, 45, width - 90, height - 90, 36);
        ctx.stroke();

        ctx.fillStyle = "#F4D03F";
        ctx.font = "bold 36px serif";
        ctx.textAlign = "center";
        ctx.fillText("🛎️ IN-ROOM DINING & SERVICES", width / 2, 140);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 64px serif";
        ctx.fillText(shop.name, width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(244, 208, 63, 0.2)";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 36);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0B132B", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#0B132B";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#F4D03F";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#F4D03F");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#F4D03F");
          }
        }

        ctx.fillStyle = "#F4D03F";
        ctx.font = "bold 36px serif";
        ctx.fillText("SCAN FOR HOTEL MENU & CONCIERGE", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Room Service, Amenities & Reception Desk", width / 2, 1370);

        ctx.fillStyle = "rgba(244, 208, 63, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 15. DIAMOND & JEWELRY SHOWCASE
      else if (frameStyle === "jewelry_luxury") {
        ctx.fillStyle = "#070709";
        ctx.fillRect(0, 0, width, height);

        const borderGrad = ctx.createLinearGradient(0, 0, width, height);
        borderGrad.addColorStop(0, "#E2E8F0");
        borderGrad.addColorStop(0.5, "#94A3B8");
        borderGrad.addColorStop(1, "#CBD5E1");

        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 5;
        roundRect(ctx, 45, 45, width - 90, height - 90, 40);
        ctx.stroke();

        ctx.fillStyle = "#E2E8F0";
        ctx.font = "bold 34px serif";
        ctx.textAlign = "center";
        ctx.fillText("💎 FINE JEWELRY & WATCH CATALOG", width / 2, 140);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px serif";
        ctx.fillText(shop.name, width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.25)";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 36);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#070709", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#070709";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#CBD5E1";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#E2E8F0");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#E2E8F0");
          }
        }

        ctx.fillStyle = "#CBD5E1";
        ctx.font = "bold 34px serif";
        ctx.fillText("SCAN TO VIEW EXCLUSIVE COLLECTION", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Inquire prices & designs directly on WhatsApp", width / 2, 1370);

        ctx.fillStyle = "rgba(203, 213, 225, 0.4)";
        ctx.font = "24px serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 16. CLINIC & MEDICAL CARE
      else if (frameStyle === "clinic_medical") {
        ctx.fillStyle = "#0284C7";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        roundRect(ctx, width / 2 - 280, 80, 560, 70, 35);
        ctx.fill();

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🩺 CLINIC & APPOINTMENT DESK", width / 2, 126);

        ctx.font = "bold 58px sans-serif";
        ctx.fillText(shop.name, width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0284C7", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#FFFFFF";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#0284C7");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#0284C7");
          }
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 36px sans-serif";
        ctx.fillText("SCAN FOR DOCTOR SCHEDULE & SERVICES", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Book Appointments & Inquire via WhatsApp", width / 2, 1370);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "24px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 17. POWER GYM & FITNESS
      else if (frameStyle === "gym_fitness") {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 8;
        roundRect(ctx, 40, 40, width - 80, height - 80, 40);
        ctx.stroke();

        ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
        roundRect(ctx, width / 2 - 280, 80, 560, 70, 35);
        ctx.fill();

        ctx.fillStyle = "#22C55E";
        ctx.font = "bold 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚡ WORKOUT & MEMBERSHIP SCHEDULE", width / 2, 126);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 60px sans-serif";
        ctx.fillText(shop.name.toUpperCase(), width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.save();
        ctx.shadowColor = "#22C55E";
        ctx.shadowBlur = 35;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();
        ctx.restore();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#111827", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#111827";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 3;
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.stroke();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#22C55E");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#22C55E");
          }
        }

        ctx.fillStyle = "#22C55E";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText("SCAN FOR GYM RATES & CLASS TIMINGS", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Personal Training, Membership Plans & WhatsApp Booking", width / 2, 1370);

        ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
        ctx.font = "24px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }
      // 18. FOOD TRUCK & STREET FOOD
      else if (frameStyle === "food_truck") {
        ctx.fillStyle = "#EAB308";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#18181B";
        roundRect(ctx, 40, 40, width - 80, height - 80, 44);
        ctx.fill();

        ctx.fillStyle = "#EAB308";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🚀 EXPRESS ORDER & TOUCHLESS MENU", width / 2, 136);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 64px sans-serif";
        ctx.fillText(shop.name.toUpperCase(), width / 2, 230);

        const cardW = 860;
        const cardH = 860;
        const cx = (width - cardW) / 2;
        const cy = 340;

        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, cardH, 40);
        ctx.fill();

        const qrCanvas = document.createElement("canvas");
        const qrSize = 760;
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        await QRCode.toCanvas(qrCanvas, targetUrl, {
          width: qrSize,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#18181B", light: "#FFFFFF" },
        });

        const qx = cx + (cardW - qrSize) / 2;
        const qy = cy + (cardH - qrSize) / 2;
        ctx.drawImage(qrCanvas, qx, qy);

        if (showLogo) {
          const badgeSize = cardW * 0.22;
          const bx = cx + (cardW - badgeSize) / 2;
          const by = cy + (cardH - badgeSize) / 2;

          ctx.save();
          ctx.fillStyle = "#EAB308";
          roundRect(ctx, bx, by, badgeSize, badgeSize, badgeSize * 0.26);
          ctx.fill();
          ctx.restore();

          const innerSize = badgeSize * 0.82;
          const ix = cx + (cardW - innerSize) / 2;
          const iy = cy + (cardH - innerSize) / 2;

          if (shop.logo_url) {
            try {
              const img = await loadImage(shop.logo_url);
              ctx.save();
              roundRect(ctx, ix, iy, innerSize, innerSize, innerSize * 0.22);
              ctx.clip();
              ctx.drawImage(img, ix, iy, innerSize, innerSize);
              ctx.restore();
            } catch {
              drawInitials(ctx, ix, iy, innerSize, shop.name, "#18181B");
            }
          } else {
            drawInitials(ctx, ix, iy, innerSize, shop.name, "#18181B");
          }
        }

        ctx.fillStyle = "#EAB308";
        ctx.font = "bold 38px sans-serif";
        ctx.fillText("SKIP THE LINE — SCAN TO ORDER", width / 2, 1310);

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "28px sans-serif";
        ctx.fillText("Fast takeaways & direct WhatsApp confirmation", width / 2, 1370);

        ctx.fillStyle = "rgba(234, 179, 8, 0.4)";
        ctx.font = "24px sans-serif";
        ctx.fillText("Powered by MY Link QR", width / 2, 1490);
      }

      setPng(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error("QR render error:", err);
    } finally {
      setBusy(false);
    }
  }, [targetUrl, dark, showLogo, frameStyle, shop, catalogLabel]);

  useEffect(() => {
    void render();
  }, [render]);

  const handleCopyLink = () => {
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const feat = shopFeatures(shop);
  const currentPlanStr = (shop?.plan || "basic").toLowerCase().trim();
  const planLevels: Record<string, number> = { trial: 1, basic: 1, pro: 2, premium: 3 };
  const baseLevel = planLevels[currentPlanStr] ?? 1;
  const currentPlanLevel = feat.themes ? 3 : baseLevel;

  const minPlanLevels: Record<string, number> = { basic: 1, pro: 2, premium: 3 };

  const frameOptions: {
    id: FrameStyle;
    label: string;
    icon: React.ReactNode;
    tag: string;
    cat: CategoryFilter;
    minPlan: "basic" | "pro" | "premium";
  }[] = [
    { id: "stand", label: "Table Stand", icon: <Store className="size-5" />, tag: "Popular", cat: "food_dining", minPlan: "basic" },
    { id: "food_truck", label: "Express Bites", icon: <Truck className="size-5" />, tag: "Express", cat: "food_dining", minPlan: "basic" },
    { id: "minimal_mono", label: "Matte Mono", icon: <Square className="size-5" />, tag: "Minimal", cat: "minimal_pure", minPlan: "basic" },
    { id: "nordic_warm", label: "Nordic Linen", icon: <Coffee className="size-5" />, tag: "Warm", cat: "food_dining", minPlan: "basic" },
    { id: "poster", label: "Poster Card", icon: <Sparkles className="size-5" />, tag: "Classic", cat: "retail_shopping", minPlan: "basic" },
    { id: "clean", label: "Minimal 1:1", icon: <QrIcon className="size-5" />, tag: "Pure QR", cat: "minimal_pure", minPlan: "basic" },

    { id: "rose_gold_salon", label: "Rose Gold Salon", icon: <Scissors className="size-5" />, tag: "Salon", cat: "salon_beauty", minPlan: "pro" },
    { id: "gym_fitness", label: "Power Gym", icon: <Dumbbell className="size-5" />, tag: "Fitness", cat: "health_fitness", minPlan: "pro" },
    { id: "cyber_neon", label: "Cyber Neon", icon: <Zap className="size-5" />, tag: "Trendy", cat: "tech_modern", minPlan: "pro" },
    { id: "retro_diner", label: "Retro Bistro", icon: <Utensils className="size-5" />, tag: "Vibe", cat: "food_dining", minPlan: "pro" },
    { id: "emerald_botanical", label: "Emerald Spa", icon: <Leaf className="size-5" />, tag: "Botanical", cat: "salon_beauty", minPlan: "pro" },
    { id: "sunset_vibes", label: "Sunset Lounge", icon: <Sun className="size-5" />, tag: "Lounge", cat: "hotels_hospitality", minPlan: "pro" },

    { id: "luxury_gold", label: "Luxury Gold", icon: <Crown className="size-5" />, tag: "Premium", cat: "salon_beauty", minPlan: "premium" },
    { id: "hotel_concierge", label: "Grand Hotel", icon: <Bed className="size-5" />, tag: "Hotel", cat: "hotels_hospitality", minPlan: "premium" },
    { id: "jewelry_luxury", label: "Diamond Jewelry", icon: <Diamond className="size-5" />, tag: "Luxury", cat: "retail_shopping", minPlan: "premium" },
    { id: "clinic_medical", label: "Clinic Medical", icon: <Stethoscope className="size-5" />, tag: "Clinic", cat: "health_fitness", minPlan: "premium" },
    { id: "royal_glass", label: "Royal Glass", icon: <Gem className="size-5" />, tag: "Modern", cat: "hotels_hospitality", minPlan: "premium" },
    { id: "hologram_futuristic", label: "Prism Tech", icon: <Radio className="size-5" />, tag: "Futuristic", cat: "tech_modern", minPlan: "premium" },
  ];

  const categoryTabs: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: "All (18)" },
    { id: "food_dining", label: "Food & Dining" },
    { id: "salon_beauty", label: "Salon & Beauty" },
    { id: "hotels_hospitality", label: "Hotels & Stays" },
    { id: "retail_shopping", label: "Retail & Stores" },
    { id: "health_fitness", label: "Health & Gym" },
    { id: "tech_modern", label: "Tech & Modern" },
    { id: "minimal_pure", label: "Minimalist" },
  ];

  const filteredFrames = categoryFilter === "all"
    ? frameOptions
    : frameOptions.filter((f) => f.cat === categoryFilter);

  const handleSelectTheme = (opt: (typeof frameOptions)[0]) => {
    const requiredLevel = minPlanLevels[opt.minPlan] ?? 1;
    if (currentPlanLevel < requiredLevel) {
      toast.error(
        `"${opt.label}" theme is locked! Requires ${opt.minPlan.toUpperCase()} plan. Upgrade your plan to unlock.`,
        {
          action: {
            label: `Upgrade to ${opt.minPlan.toUpperCase()}`,
            onClick: () => {
              window.location.href = "/settings";
            },
          },
          duration: 6000,
        }
      );
      return;
    }
    setFrameStyle(opt.id);
  };

  return (
    <>
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, footer, button, .print\\:hidden {
            display: none !important;
          }
          body > div:not(#qr-print-wrapper) {
            display: none !important;
          }
          #qr-print-wrapper {
            display: flex !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            align-items: center !important;
            justify-content: center !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0.8cm !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
          }
          #qr-print-wrapper img {
            max-width: 100% !important;
            max-height: 100% !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            box-shadow: none !important;
          }
          @page {
            size: portrait;
            margin: 0mm;
          }
        }
      `}</style>
      <div className="print:hidden">
        <DashboardShell
          title="QR Code Generator"
          description="Branded, high-resolution QR codes categorized for restaurants, salons, hotels, gyms & stores."
          isAdmin={!!isAdmin}
        >
          {!shop ? (
            <p className="text-sm text-muted-foreground">Create your shop on the dashboard first.</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_440px] items-start">
              {/* Main Display Preview Card */}
              <div className="flex flex-col items-center justify-center rounded-3xl border bg-card p-6 sm:p-8 text-center shadow-sm">
                {/* Target Link Selector */}
                <div className="mb-6 flex w-full max-w-md rounded-xl bg-muted/60 p-1.5 border">
                  <button
                    type="button"
                    className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold transition-all ${
                      qrType === "menu"
                        ? "bg-background shadow text-amber-500 font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setQrType("menu")}
                  >
                    {catalogLabel} Link
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold transition-all ${
                      qrType === "map"
                        ? "bg-background shadow text-amber-500 font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setQrType("map")}
                  >
                    Map Link
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-bold transition-all ${
                      qrType === "review"
                        ? "bg-background shadow text-amber-500 font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setQrType("review")}
                  >
                    Google Review
                  </button>
                </div>

                {targetUrl ? (
                  <div className="w-full flex flex-col items-center">
                    {/* Fixed Aspect Ratio Responsive Wrapper */}
                    <div
                      className={`mx-auto w-full max-w-[340px] sm:max-w-[380px] ${
                        frameStyle === "clean" ? "aspect-square" : "aspect-[3/4]"
                      } rounded-3xl bg-white p-4 sm:p-5 shadow-2xl shadow-black/10 ring-1 ring-black/5 flex items-center justify-center relative overflow-hidden transition-all duration-300`}
                    >
                      <canvas
                        ref={canvasRef}
                        className={`size-full object-contain ${
                          frameStyle === "clean" ? "aspect-square" : "aspect-[3/4]"
                        } rounded-xl`}
                      />
                    </div>

                    {/* Target URL details */}
                    <div className="mt-6 space-y-1.5 max-w-md mx-auto">
                      <p className="break-all text-xs sm:text-sm font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
                        {targetUrl}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {qrType === "menu" &&
                          `This QR link opens your live public ${catalogLabel.toLowerCase()}. Customers can scan without signing in.`}
                        {qrType === "map" &&
                          "Customers scanning this will be redirected directly to your Google Maps location."}
                        {qrType === "review" &&
                          "Customers scanning this will be redirected to leave a review for your business."}
                      </p>
                    </div>

                    {/* Primary Download & Share Buttons */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                      <Button
                        asChild
                        size="lg"
                        className="bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-md flex-1 min-w-[140px]"
                        disabled={!png}
                      >
                        <a href={png} download={`${shop.slug}-${qrType}-${frameStyle}-qr.png`}>
                          <Download className="mr-2 size-4" /> Download PNG
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 px-5 text-xs sm:text-sm font-bold rounded-xl border-border flex-1 min-w-[130px]"
                        onClick={handleCopyLink}
                      >
                        {copied ? <Check className="mr-2 size-4 text-green-500" /> : <Copy className="mr-2 size-4" />}
                        {copied ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="h-11 px-4 text-xs font-bold rounded-xl flex-1 min-w-[120px]"
                        onClick={handlePrint}
                      >
                        <Printer className="mr-2 size-4" /> Print Card
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center opacity-90">
                    <p className="text-sm text-muted-foreground mb-4">
                      {qrType === "map" && "You haven't added a Google Maps link in Shop Settings yet."}
                      {qrType === "review" &&
                        "You haven't added a Google Review link in Shop Settings yet."}
                    </p>
                    <Button asChild variant="outline" className="font-bold text-xs">
                      <a href="/settings">Configure in Shop Settings</a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Customization Options Column */}
              <div className="space-y-6">
                {/* Frame Theme Picker with Category Filter Tabs */}
                <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-base flex items-center gap-2">
                      <Layers className="size-4 text-amber-500" /> Business Category Themes
                    </h2>
                    <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      18 Custom Themes
                    </span>
                  </div>

                  {/* Business Category Filter Tabs */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {categoryTabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategoryFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                          categoryFilter === tab.id
                            ? "bg-amber-500 text-black border-amber-500 font-bold shadow-sm"
                            : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {filteredFrames.map((opt) => {
                      const requiredLevel = minPlanLevels[opt.minPlan] ?? 1;
                      const isLocked = currentPlanLevel < requiredLevel;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectTheme(opt)}
                          className={`flex flex-col items-start p-3 rounded-2xl border-2 text-left relative transition-all ${
                            frameStyle === opt.id
                              ? "border-amber-500 bg-amber-500/10 text-amber-500 font-bold shadow-sm"
                              : isLocked
                                ? "border-border/60 bg-muted/20 opacity-75 hover:opacity-100 hover:border-amber-500/40"
                                : "border-border hover:border-amber-500/50 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div className={frameStyle === opt.id ? "text-amber-500" : isLocked ? "text-muted-foreground/60" : "text-muted-foreground"}>
                              {opt.icon}
                            </div>
                            {isLocked ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                                <Lock className="size-2.5" /> {opt.minPlan.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground uppercase tracking-wider">
                                {opt.tag}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-semibold leading-tight ${isLocked ? "text-muted-foreground" : ""}`}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color & Logo Controls */}
                <div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Palette className="size-4 text-amber-500" /> Color Palette & Logo
                  </h2>

                  <div className="space-y-3">
                    <Label htmlFor="qr-color" className="text-xs font-semibold">
                      QR Module Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="qr-color"
                        type="color"
                        value={dark}
                        onChange={(e) => setDark(e.target.value)}
                        className="h-10 w-14 p-1 cursor-pointer rounded-lg shrink-0"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { color: "#0F172A", name: "Midnight" },
                          { color: "#D4AF37", name: "Luxury Gold" },
                          { color: "#059669", name: "Emerald" },
                          { color: "#06B6D4", name: "Cyan" },
                          { color: "#7C3AED", name: "Royal Purple" },
                          { color: "#E11D48", name: "Crimson Rose" },
                          { color: "#C2410C", name: "Copper" },
                          { color: "#18181B", name: "Matte Onyx" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            aria-label={`Use colour ${c.name}`}
                            onClick={() => setDark(c.color)}
                            className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                              dark === c.color ? "border-amber-500 scale-110 ring-2 ring-amber-500/30" : "border-transparent"
                            }`}
                            style={{ background: c.color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="logo-switch" className="text-xs font-semibold">
                        Center Logo Badge
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Display business logo in center of QR
                      </p>
                    </div>
                    <Switch
                      id="logo-switch"
                      checked={showLogo}
                      onCheckedChange={(v) => setShowLogo(v)}
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs font-bold mt-2"
                    onClick={() => void render()}
                    disabled={busy}
                  >
                    <RefreshCw className={`mr-2 size-3.5 ${busy ? "animate-spin" : ""}`} /> Regenerate QR Code
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DashboardShell>
      </div>

      {/* Printable View - Renders ONLY the exact generated high-res theme PNG */}
      {shop && png && (
        <div id="qr-print-wrapper" className="hidden print:flex">
          <img
            src={png}
            alt={`${shop.name} QR Code`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </>
  );
}

export default QrPage;
