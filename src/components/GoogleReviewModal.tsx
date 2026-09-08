import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MessageSquare,
  Star,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitReview } from "@/hooks/useReviews";

// ─── Types ──────────────────────────────────────────────────────────────────
interface GoogleReviewModalProps {
  open: boolean;
  onClose: () => void;
  shop: {
    id: string;
    name: string;
    logo_url?: string | null;
    niche: string;
    googleReviewLink?: string | null | undefined;
  };
}

type Step = "rating" | "feedback" | "google" | "success";

const REVIEW_TEMPLATES = [
  "Excellent service and great quality! Highly recommended.",
  "Amazing experience! Will definitely visit again.",
  "The staff was very friendly and the quality exceeded my expectations.",
  "Outstanding quality and quick service. 5 stars well deserved!",
  "One of the best experiences I have had. Highly recommended to everyone.",
  "Loved the atmosphere and the attention to detail. Top notch!",
  "A truly wonderful experience. Great value for money and superb service.",
  "Fantastic! Everything from start to finish was handled perfectly.",
  "Very professional and welcoming. I'll be recommending this to my friends.",
  "Exceeded all my expectations. Absolutely flawless execution and service.",
];

const EMOJIS = ["😊", "👍", "🔥", "❤️", "🌟", "👌", "✨", "🎉", "💯", "🙌"];

// ─── Confetti Component ──────────────────────────────────────────────────────
function Confetti() {
  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          className="absolute block size-2 rounded-sm opacity-0"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${0.8 + Math.random() * 1.5}s ease-in ${Math.random() * 0.8}s forwards`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Animated Star ───────────────────────────────────────────────────────────
function StarBtn({
  filled,
  hovered,
  onClick,
  onEnter,
  onLeave,
  index,
}: {
  filled: boolean;
  hovered: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Rate ${index + 1} stars`}
      whileHover={{ scale: 1.25 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="p-1 focus:outline-none"
    >
      <Star
        className={`size-10 transition-all duration-150 ${
          filled || hovered
            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            : "text-white/20 fill-transparent"
        }`}
      />
    </motion.button>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export function GoogleReviewModal({ open, onClose, shop }: GoogleReviewModalProps) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function reset() {
    setStep("rating");
    setRating(0);
    setHovered(0);
    setReviewText("");
    setFeedbackText("");
    setCustomerName("");
    setCustomerPhone("");
    setCopied(false);
    setShowConfetti(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function selectRating(val: number) {
    setRating(val);
    if (val === 5) setShowConfetti(true);
    setTimeout(() => {
      if (val >= 4) setStep("google");
      else setStep("feedback");
    }, 400);
  }

  async function submitFeedback() {
    if (!feedbackText.trim()) {
      toast.error("Please share your feedback before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await submitReview({
        shop_id: shop.id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        rating,
        feedback_comment: feedbackText,
        review_type: "negative",
        redirected_to_google: false,
      });
      setStep("success");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function postOnGoogle() {
    if (!shop.googleReviewLink) {
      toast.error("No Google Review link configured for this business.");
      return;
    }
    // Save to DB first
    try {
      await submitReview({
        shop_id: shop.id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        rating,
        review_comment: reviewText || null,
        review_type: "positive",
        redirected_to_google: true,
      });
    } catch {
      // Non-fatal — still redirect
    }
    // Copy to clipboard
    if (reviewText) {
      try {
        await navigator.clipboard.writeText(reviewText);
        setCopied(true);
        toast.success("Review text copied! Just paste it on Google.");
      } catch {
        toast.info("Tip: Copy your review text before submitting on Google.");
      }
    }
    setTimeout(() => {
      window.open(shop.googleReviewLink!, "_blank", "noreferrer");
      setStep("success");
    }, 1200);
  }

  async function copyText() {
    if (!reviewText) return;
    await navigator.clipboard.writeText(reviewText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117]/95 shadow-2xl shadow-black/60 backdrop-blur-xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {showConfetti && <Confetti />}

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            {/* ─── Header ─── */}
            <div className="flex items-center gap-3 border-b border-white/10 px-5 pt-5 pb-4">
              {shop.logo_url ? (
                <img
                  src={shop.logo_url}
                  alt={shop.name}
                  className="size-12 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="size-12 rounded-xl bg-amber-500/20 grid place-items-center shrink-0">
                  <Star className="size-6 text-amber-400" />
                </div>
              )}
              <div>
                <p className="text-xs text-white/50">{shop.niche}</p>
                <h2 className="font-bold text-base leading-tight">{shop.name}</h2>
              </div>
            </div>

            {/* ─── Content Area ─── */}
            <div className="px-5 py-5 min-h-[260px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* STEP: Rating */}
                {step === "rating" && (
                  <motion.div
                    key="rating"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center text-center gap-4"
                  >
                    <p className="text-white/60 text-sm">How was your experience at</p>
                    <p className="font-bold text-xl">{shop.name}?</p>
                    <p className="text-white/40 text-xs">Tap a star to rate</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <StarBtn
                          key={val}
                          index={val - 1}
                          filled={val <= rating}
                          hovered={val <= hovered}
                          onClick={() => selectRating(val)}
                          onEnter={() => setHovered(val)}
                          onLeave={() => setHovered(0)}
                        />
                      ))}
                    </div>
                    {rating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-amber-400 font-semibold text-sm"
                      >
                        {rating === 5
                          ? "⭐ Excellent!"
                          : rating === 4
                            ? "😊 Great!"
                            : rating === 3
                              ? "😐 Okay"
                              : rating === 2
                                ? "😕 Poor"
                                : "😞 Terrible"}
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* STEP: Feedback (1–3 star) */}
                {step === "feedback" && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            className={`size-4 ${v <= rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        We're sorry your experience wasn't perfect.
                      </p>
                      <p className="text-white/50 text-sm mt-1">
                        Please tell us how we can improve.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-white/60">Your Name (optional)</Label>
                          <Input
                            className="mt-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                            placeholder="John"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-white/60">Phone (optional)</Label>
                          <Input
                            className="mt-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                            placeholder="9876543210"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <Textarea
                        ref={textareaRef}
                        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 resize-none h-28"
                        placeholder="Share what we could do better…"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={submitFeedback}
                      disabled={submitting || !feedbackText.trim()}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-10"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="size-4 mr-2" />
                      )}
                      Submit Feedback
                    </Button>
                  </motion.div>
                )}

                {/* STEP: Google Review (4–5 star) */}
                {step === "google" && (
                  <motion.div
                    key="google"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <Star
                            key={v}
                            className={`size-4 ${v <= rating ? "fill-amber-400 text-amber-400" : "text-white/20"}`}
                          />
                        ))}
                      </div>
                      <span className="text-amber-400 font-semibold text-sm">
                        {rating === 5 ? "Excellent!" : "Great!"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        We're glad you enjoyed our service! 🎉
                      </p>
                      <p className="text-white/50 text-sm mt-1">
                        Share your experience on Google to help others.
                      </p>
                    </div>

                    {/* Customer info */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-white/60">Your Name (optional)</Label>
                        <Input
                          className="mt-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                          placeholder="John"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-white/60">Phone (optional)</Label>
                        <Input
                          className="mt-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/30"
                          placeholder="9876543210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Suggested templates */}
                    <div>
                      <p className="text-xs text-white/40 mb-2">
                        💡 Suggested templates (click to use):
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
                        {REVIEW_TEMPLATES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setReviewText(t)}
                            className="text-left text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg px-2.5 py-2 border border-white/5 transition-colors"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review textarea */}
                    <div className="relative">
                      <Textarea
                        className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 resize-none h-24 pr-10"
                        placeholder="Write your review here (it will be copied to clipboard)…"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
                      />
                      <button
                        type="button"
                        onClick={copyText}
                        className="absolute right-2 top-2 rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex gap-1 flex-wrap">
                          {EMOJIS.map((em) => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => setReviewText((t) => (t + em).slice(0, 500))}
                              className="text-base hover:scale-125 transition-transform"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-white/30">{reviewText.length}/500</span>
                      </div>
                    </div>

                    {/* Post on Google button */}
                    <motion.button
                      type="button"
                      onClick={postOnGoogle}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white font-semibold text-gray-800 shadow-lg shadow-white/10 transition"
                    >
                      {/* Google G logo */}
                      <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden>
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span className="text-sm">Post Review on Google</span>
                      <ExternalLink className="size-4 text-gray-500" />
                      {/* Pulse ring */}
                      <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400/30 animate-ping opacity-30" />
                    </motion.button>

                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-xs text-emerald-400"
                      >
                        ✅ Your review text has been copied. Just paste it into Google Review!
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* STEP: Success */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center gap-4 py-6"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="size-20 rounded-full bg-emerald-500/20 grid place-items-center"
                    >
                      <ThumbsUp className="size-9 text-emerald-400" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-xl">Thank you!</p>
                      <p className="text-white/50 text-sm mt-1">
                        {rating >= 4
                          ? "Your Google review helps us grow. We truly appreciate it! 🙏"
                          : "Your feedback has been received. We will work on improving your experience."}
                      </p>
                    </div>
                    <Button
                      onClick={handleClose}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10"
                    >
                      Close
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
