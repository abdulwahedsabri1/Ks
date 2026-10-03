import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode as QrIcon, Sparkles, Smartphone, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UpiPaymentBoxProps {
  upiId?: string;
  upiQrUrl?: string | null;
  shopName?: string;
  amount?: number;
  currency?: string;
  className?: string;
  showTitle?: boolean;
}

export function UpiPaymentBox({
  upiId = "",
  upiQrUrl,
  shopName = "Merchant",
  amount,
  currency = "₹",
  className = "",
  showTitle = true,
}: UpiPaymentBoxProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Clean UPI ID string
  const cleanUpiId = upiId.trim();

  // Dynamic UPI payment URI string
  let standardUpiUri = "";
  if (cleanUpiId) {
    standardUpiUri = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;
    if (amount && amount > 0) {
      standardUpiUri += `&am=${amount.toFixed(2)}`;
    }
  }

  // Generate dynamic QR code if cleanUpiId is present and no custom upiQrUrl provided
  useEffect(() => {
    if (!cleanUpiId || upiQrUrl) return;

    QRCode.toDataURL(standardUpiUri, {
      width: 450,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => {
        console.error("Failed to generate UPI QR code:", err);
        setQrCodeDataUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(standardUpiUri)}`,
        );
      });
  }, [cleanUpiId, upiQrUrl, shopName, amount, standardUpiUri]);

  const copyUpiId = (appName?: string) => {
    if (!cleanUpiId) return;
    try {
      navigator.clipboard.writeText(cleanUpiId);
      setCopied(true);
      if (appName) {
        toast.success(`UPI ID copied! Paste in ${appName} or scan QR code.`);
      } else {
        toast.success("UPI ID copied to clipboard!");
      }
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy UPI ID");
    }
  };

  const handleOpenUpiApp = (appName: string, scheme: "phonepe" | "gpay" | "paytm" | "upi") => {
    if (!cleanUpiId) return;

    // Always copy UPI ID to clipboard first so user has it ready
    copyUpiId(appName);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

    if (isMobile) {
      const queryParams = `pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(shopName)}&cu=INR${
        amount && amount > 0 ? `&am=${amount.toFixed(2)}` : ""
      }`;

      let deepLink = "";
      if (scheme === "phonepe") {
        deepLink = `phonepe://pay?${queryParams}`;
      } else if (scheme === "gpay") {
        deepLink = `gpay://upi/pay?${queryParams}`;
      } else if (scheme === "paytm") {
        deepLink = `paytmmp://pay?${queryParams}`;
      } else {
        deepLink = `upi://pay?${queryParams}`;
      }

      // Attempt deep link launch
      window.location.href = deepLink;

      // Fallback to standard upi:// if specific app protocol does not launch
      if (scheme !== "upi") {
        setTimeout(() => {
          window.location.href = `upi://pay?${queryParams}`;
        }, 750);
      }
    }
  };

  const displayQr = upiQrUrl || qrCodeDataUrl;
  const payAmountStr = amount && amount > 0 ? `${currency}${amount.toFixed(2)}` : null;

  if (!cleanUpiId && !upiQrUrl) return null;

  return (
    <div
      className={`rounded-xl border border-border/70 bg-card text-card-foreground p-5 sm:p-6 shadow-sm transition-all overflow-hidden ${className}`}
    >
      {showTitle && (
        <div className="flex items-start gap-3 mb-4 pb-3 border-b border-border/50">
          <div className="size-8 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/30 mt-0.5">
            <Check className="size-4 stroke-[3]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-bold text-base sm:text-lg leading-tight text-foreground tracking-tight">
                Instant UPI Payment
              </h4>
              {payAmountStr && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {payAmountStr}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Pay via PhonePe, GPay, Paytm, or scan QR code directly
            </p>
          </div>
        </div>
      )}

      {/* 1-Tap UPI Apps Launcher Bar */}
      {cleanUpiId && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1">
              <Smartphone className="size-3.5 text-emerald-500" />
              Pay Directly via App
            </span>
            <span className="text-[10px] text-muted-foreground/80 font-medium">1-Tap Payment</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* PhonePe */}
            <button
              type="button"
              onClick={() => handleOpenUpiApp("PhonePe", "phonepe")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#5f259f]/10 hover:bg-[#5f259f]/20 border border-[#5f259f]/30 text-[#5f259f] dark:text-[#a855f7] font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs group cursor-pointer"
            >
              <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm3.834 14.887l-2.12 3.67c-.244.423-.836.568-1.258.324a.916.916 0 01-.324-.324l-1.378-2.385h-1.92v2.164c0 .484-.392.876-.876.876a.876.876 0 01-.876-.876V6.663c0-.484.392-.876.876-.876h3.692c2.035 0 3.685 1.65 3.685 3.685 0 1.545-.95 2.868-2.302 3.415l2.201 3.81c.244.423.099.965-.324 1.209a.917.917 0 01-.581.181zm-2.756-7.348h-2.244v3.535h2.244c.976 0 1.767-.791 1.767-1.767 0-.976-.791-1.768-1.767-1.768z" />
              </svg>
              <span>PhonePe</span>
              <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Google Pay (GPay) */}
            <button
              type="button"
              onClick={() => handleOpenUpiApp("Google Pay", "gpay")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#1a73e8]/10 hover:bg-[#1a73e8]/20 border border-[#1a73e8]/30 text-[#1a73e8] dark:text-[#60a5fa] font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs group cursor-pointer"
            >
              <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.053 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              <span>Google Pay</span>
              <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Paytm */}
            <button
              type="button"
              onClick={() => handleOpenUpiApp("Paytm", "paytm")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#00baf2]/10 hover:bg-[#00baf2]/20 border border-[#00baf2]/30 text-[#002e6e] dark:text-[#38bdf8] font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs group cursor-pointer"
            >
              <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.5 7.5h-3.9v9h1.7v-3.4h2.2c1.7 0 2.8-.9 2.8-2.8s-1.1-2.8-2.8-2.8zm-2.2 4.1v-2.6h2.2c.7 0 1.2.3 1.2 1.3s-.5 1.3-1.2 1.3h-2.2zM12.9 7.5h-1.8L9.3 13 7.5 7.5H5.7l2.7 7.7v1.3h1.8v-1.3l2.7-7.7zm-8.8 4.3H1.8V7.5H0v9h1.8v-5.4h2.3c.7 0 1.2.3 1.2 1.3v4.1h1.8v-4.4c.1-1.6-.9-2.6-3-2.6z" />
              </svg>
              <span>Paytm</span>
              <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* BHIM / Any UPI */}
            <button
              type="button"
              onClick={() => handleOpenUpiApp("UPI App", "upi")}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs transition-all duration-150 active:scale-95 shadow-2xs group cursor-pointer"
            >
              <span className="font-extrabold tracking-tighter text-xs">BHIM</span>
              <span>UPI App</span>
              <ArrowUpRight className="size-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* Centered QR Code Section */}
      {displayQr && (
        <div className="flex flex-col items-center justify-center py-2 mb-4 bg-muted/20 border border-border/40 rounded-xl p-3">
          <div
            onClick={() => setIsZoomed(true)}
            className="group relative bg-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 shadow-md hover:shadow-lg cursor-pointer transition-all duration-200"
            title="Click to expand QR Code"
          >
            <img
              src={displayQr}
              alt="UPI QR Code"
              className="size-44 sm:size-48 object-contain rounded"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-xs font-semibold gap-1">
              <QrIcon className="size-4" /> Expand QR
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="text-xs font-medium text-emerald-500 hover:text-emerald-400 mt-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>Click to Expand QR Code</span>
          </button>
        </div>
      )}

      {/* Merchant UPI ID Section */}
      {cleanUpiId && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Merchant UPI ID
          </label>
          <div className="flex items-center justify-between gap-2 bg-muted/40 border border-border/80 rounded-lg px-3.5 py-2.5 min-w-0 w-full shadow-2xs">
            <code className="text-xs sm:text-sm font-mono font-semibold text-foreground truncate select-all flex-1 min-w-0">
              {cleanUpiId}
            </code>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => copyUpiId()}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex-shrink-0 text-foreground hover:bg-background border border-border/60 shadow-2xs cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom Modal for QR Code */}
      {isZoomed && displayQr && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="bg-card text-card-foreground rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 shadow-2xl border border-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center w-full pb-2 border-b border-border">
              <span className="font-bold text-foreground text-base truncate pr-2">
                {shopName} — Scan & Pay
              </span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="text-muted-foreground hover:text-foreground p-1 font-bold text-base rounded-md"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner">
              <img src={displayQr} alt="UPI QR Code Enlarged" className="size-60 object-contain" />
            </div>

            {payAmountStr && (
              <div className="text-sm font-extrabold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                Amount to Pay: {payAmountStr}
              </div>
            )}

            {cleanUpiId && (
              <div className="w-full bg-muted/60 p-2.5 rounded-xl flex items-center justify-between border border-border gap-2 overflow-hidden">
                <span className="text-xs font-mono font-bold text-foreground truncate select-all">
                  {cleanUpiId}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyUpiId()}
                  className="h-7 text-xs flex-shrink-0"
                >
                  Copy
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Scan with PhonePe, Google Pay, Paytm, BHIM or any UPI app
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

