import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, ExternalLink, QrCode as QrIcon, Sparkles } from "lucide-react";
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

  // Generate dynamic QR code if cleanUpiId is present and no custom upiQrUrl provided
  useEffect(() => {
    if (!cleanUpiId || upiQrUrl) return;

    let upiUri = `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;
    if (amount && amount > 0) {
      upiUri += `&am=${amount.toFixed(2)}`;
    }

    QRCode.toDataURL(upiUri, {
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
          `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiUri)}`,
        );
      });
  }, [cleanUpiId, upiQrUrl, shopName, amount]);

  const copyUpiId = () => {
    if (!cleanUpiId) return;
    navigator.clipboard.writeText(cleanUpiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const displayQr = upiQrUrl || qrCodeDataUrl;
  const payAmountStr = amount && amount > 0 ? `${currency}${amount.toFixed(2)}` : null;

  // Generate payment links
  const getUpiUrl = (scheme: string) => {
    const base = scheme === "tez" ? "tez://upi/pay" : `${scheme}://pay`;
    let url = `${base}?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(shopName)}&cu=INR`;
    if (amount && amount > 0) {
      url += `&am=${amount.toFixed(2)}`;
    }
    return url;
  };

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
                UPI Payment Accepted
              </h4>
              {payAmountStr && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {payAmountStr}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Scan QR code below or pay directly via app
            </p>
          </div>
        </div>
      )}

      {/* Centered QR Code Section */}
      {displayQr && (
        <div className="flex flex-col items-center justify-center py-2 mb-4">
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
              <QrIcon className="size-4" /> Expand
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="text-xs font-medium text-emerald-500 hover:text-emerald-400 mt-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>Scan to Pay</span>
          </button>
        </div>
      )}

      {/* Merchant UPI ID Section */}
      {cleanUpiId && (
        <div className="space-y-1.5 mb-4">
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
              onClick={copyUpiId}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5 flex-shrink-0 text-foreground hover:bg-background border border-border/60 shadow-2xs"
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

      {/* Pay Directly Via App Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          Pay Directly via App
        </label>
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <a
            href={getUpiUrl("tez")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 h-10 px-3 bg-muted/30 hover:bg-muted border border-border/80 text-foreground rounded-lg text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <span>Google Pay</span>
          </a>
          <a
            href={getUpiUrl("phonepe")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 h-10 px-3 bg-muted/30 hover:bg-muted border border-border/80 text-foreground rounded-lg text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <span>PhonePe</span>
          </a>
          <a
            href={getUpiUrl("paytmmp")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 h-10 px-3 bg-muted/30 hover:bg-muted border border-border/80 text-foreground rounded-lg text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <span>Paytm</span>
          </a>
          <a
            href={getUpiUrl("upi")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs text-center"
          >
            <span>Any UPI</span>
            <ExternalLink className="size-3.5 opacity-90 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Lightbox / Zoom Modal for QR Code */}
      {isZoomed && displayQr && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="bg-card text-card-foreground rounded-2xl p-6 max-w-sm w-full flex flex-col items-center text-center space-y-4 shadow-2xl border border-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center w-full pb-2 border-b border-border">
              <span className="font-bold text-foreground text-base truncate pr-2">
                {shopName} — UPI QR
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
            {cleanUpiId && (
              <div className="w-full bg-muted/60 p-2.5 rounded-xl flex items-center justify-between border border-border gap-2 overflow-hidden">
                <span className="text-xs font-mono font-bold text-foreground truncate select-all">
                  {cleanUpiId}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUpiId}
                  className="h-7 text-xs flex-shrink-0"
                >
                  Copy
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Scan with GPay, PhonePe, Paytm, BHIM or any banking app
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
