import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Upload,
  Link2,
  Star,
  Instagram,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Facebook,
  Twitter,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Set Up Your Business — MY Link QR" }],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { id: 1, title: "Upload Logo", description: "Add your business logo" },
  { id: 2, title: "Google Reviews", description: "Connect Google Reviews" },
  { id: 3, title: "Social Links", description: "Add your social media" },
  { id: 4, title: "All Done!", description: "Your store is ready" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Google Reviews
  const [googleReviewLink, setGoogleReviewLink] = useState("");

  // Step 3: Social Media
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `logos/${user.id}/logo-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("shop-media").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("shop-media").getPublicUrl(path);

      setLogoUrl(publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    void handleLogoUpload(file);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save onboarding data
      const { error: onboardingError } = await supabase.from("onboarding_data").upsert(
        {
          user_id: user.id,
          logo_url: logoUrl,
          google_review_link: googleReviewLink.trim() || null,
          instagram_url: instagram.trim() || null,
          facebook_url: facebook.trim() || null,
          twitter_url: twitter.trim() || null,
          website_url: website.trim() || null,
          completed: true,
        },
        { onConflict: "user_id" },
      );

      if (onboardingError) throw onboardingError;

      // Mark onboarding as complete in profile
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);

      // Update shop with logo and social links
      const updatePayload: Record<string, unknown> = {};
      if (logoUrl) updatePayload["logo_url"] = logoUrl;
      if (instagram.trim() || facebook.trim() || website.trim() || googleReviewLink.trim()) {
        const { data: shop } = await supabase
          .from("shops")
          .select("id, features")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (shop) {
          const existingFeatures = (shop.features as Record<string, unknown>) ?? {};
          const newFeatures = {
            ...existingFeatures,
            ...(instagram.trim() ? { social_link: instagram.trim() } : {}),
            ...(googleReviewLink.trim() ? { google_review_link: googleReviewLink.trim() } : {}),
          };

          await supabase
            .from("shops")
            .update({ ...updatePayload, features: newFeatures })
            .eq("id", shop.id);
        }
      }

      setStep(4);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#080604] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,166,35,0.1),transparent)]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
            <QrCode className="size-4 text-[#F5A623]" />
          </div>
          <span className="font-bold text-white tracking-tight">MY Link QR</span>
        </div>
        <button
          onClick={() => {
            void supabase
              .from("profiles")
              .update({ onboarding_completed: true })
              .eq("id", "")
              .then(() => navigate({ to: "/dashboard" }));
            navigate({ to: "/dashboard" });
          }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Skip for now →
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-[#F5A623]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-3 py-6 px-6">
        {STEPS.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step > s.id
                  ? "bg-emerald-500 text-white"
                  : step === s.id
                    ? "bg-[#F5A623] text-black"
                    : "bg-white/5 border border-white/10 text-white/30"
              }`}
            >
              {step > s.id ? <CheckCircle2 className="size-4" /> : s.id}
            </div>
            {s.id < STEPS.length && (
              <div
                className={`hidden sm:block h-px w-16 transition-all duration-500 ${
                  step > s.id ? "bg-emerald-500/50" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1
                key="step1"
                logoPreview={logoPreview}
                logoUploading={logoUploading}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                onNext={() => setStep(2)}
                logoUrl={logoUrl}
              />
            )}
            {step === 2 && (
              <Step2
                key="step2"
                googleReviewLink={googleReviewLink}
                setGoogleReviewLink={setGoogleReviewLink}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3
                key="step3"
                instagram={instagram}
                setInstagram={setInstagram}
                facebook={facebook}
                setFacebook={setFacebook}
                twitter={twitter}
                setTwitter={setTwitter}
                website={website}
                setWebsite={setWebsite}
                onComplete={handleComplete}
                onBack={() => setStep(2)}
                saving={saving}
              />
            )}
            {step === 4 && (
              <StepDone key="step4" onGo={() => navigate({ to: "/dashboard", replace: true })} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Logo Upload ───────────────────────────────────────────────────────

function Step1({
  logoPreview,
  logoUploading,
  fileInputRef,
  onFileChange,
  onNext,
  logoUrl,
}: {
  logoPreview: string | null;
  logoUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  logoUrl: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-semibold mb-4">
          Step 1 of 3
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Upload your logo</h1>
        <p className="text-white/50">Add your business logo to personalise your QR menu page.</p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 ${
          logoPreview
            ? "border-[#F5A623]/30 bg-[#F5A623]/5"
            : "border-white/10 hover:border-[#F5A623]/30 hover:bg-white/5 bg-white/[0.02]"
        }`}
      >
        {logoUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-10 text-[#F5A623] animate-spin" />
            <p className="text-white/50 text-sm">Uploading…</p>
          </div>
        ) : logoPreview ? (
          <div className="flex flex-col items-center gap-4">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-28 h-28 rounded-2xl object-contain border border-white/10 bg-white/5"
            />
            <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              Logo uploaded! Click to change.
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Upload className="size-7 text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-white/70 font-semibold">Click to upload your logo</p>
              <p className="text-white/30 text-sm mt-1">PNG, JPG, SVG up to 5MB</p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          id="logo-upload-input"
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"
          onClick={onNext}
        >
          Skip for now
        </Button>
        <Button
          className="flex-1 h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold"
          onClick={onNext}
          disabled={logoUploading}
        >
          {logoUrl ? "Continue" : "Skip"}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Step 2: Google Reviews ────────────────────────────────────────────────────

function Step2({
  googleReviewLink,
  setGoogleReviewLink,
  onNext,
  onBack,
}: {
  googleReviewLink: string;
  setGoogleReviewLink: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-semibold mb-4">
          Step 2 of 3
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Google Review Link</h1>
        <p className="text-white/50">
          Add your Google review link so customers can easily leave you a review.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Star className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300/80">
            Businesses with Google Reviews get{" "}
            <span className="font-bold text-amber-300">3x more</span> customer trust.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="google-review-input" className="text-white/70 text-sm font-medium">
            Google Review URL (optional)
          </Label>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <Input
              id="google-review-input"
              type="url"
              placeholder="https://g.page/r/your-business/review"
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 h-11"
            />
          </div>
          <p className="text-xs text-white/30">
            Find this in Google Maps → Your Business → Get more reviews
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-12 px-5 border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Button
          className="flex-1 h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold"
          onClick={onNext}
        >
          Continue
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Step 3: Social Links ──────────────────────────────────────────────────────

function Step3({
  instagram,
  setInstagram,
  facebook,
  setFacebook,
  twitter,
  setTwitter,
  website,
  setWebsite,
  onComplete,
  onBack,
  saving,
}: {
  instagram: string;
  setInstagram: (v: string) => void;
  facebook: string;
  setFacebook: (v: string) => void;
  twitter: string;
  setTwitter: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  onComplete: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const socials = [
    {
      id: "instagram-input",
      icon: Instagram,
      color: "text-pink-400",
      label: "Instagram",
      value: instagram,
      setter: setInstagram,
      placeholder: "https://instagram.com/yourbusiness",
    },
    {
      id: "facebook-input",
      icon: Facebook,
      color: "text-blue-400",
      label: "Facebook",
      value: facebook,
      setter: setFacebook,
      placeholder: "https://facebook.com/yourbusiness",
    },
    {
      id: "twitter-input",
      icon: Twitter,
      color: "text-sky-400",
      label: "Twitter / X",
      value: twitter,
      setter: setTwitter,
      placeholder: "https://twitter.com/yourbusiness",
    },
    {
      id: "website-input",
      icon: Globe,
      color: "text-emerald-400",
      label: "Website",
      value: website,
      setter: setWebsite,
      placeholder: "https://yourbusiness.com",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-semibold mb-4">
          Step 3 of 3
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Social Media Links</h1>
        <p className="text-white/50">
          Connect your social media so customers can follow you. All fields are optional.
        </p>
      </div>

      <div className="space-y-4">
        {socials.map(({ id, icon: Icon, color, label, value, setter, placeholder }) => (
          <div key={id} className="space-y-2">
            <Label
              htmlFor={id}
              className="text-white/70 text-sm font-medium flex items-center gap-2"
            >
              <Icon className={`size-4 ${color}`} />
              {label}
            </Label>
            <Input
              id={id}
              type="url"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 h-11"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="h-12 px-5 border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"
          onClick={onBack}
          disabled={saving}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>
        <Button
          className="flex-1 h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold"
          onClick={onComplete}
          disabled={saving}
          id="onboarding-complete-btn"
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </div>
          ) : (
            <>
              Complete Setup
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Step 4: Done ──────────────────────────────────────────────────────────────

function StepDone({ onGo }: { onGo: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center space-y-8"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
        >
          <CheckCircle2 className="size-12 text-emerald-400" />
        </motion.div>

        <div>
          <h1 className="text-4xl font-bold text-white mb-3">You're all set! 🎉</h1>
          <p className="text-white/50 text-lg">
            Your digital store is live and ready for customers.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {["QR Menu Created", "Business Profile Done", "Store is Live"].map((item) => (
            <span
              key={item}
              className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="size-3.5" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <Button
        id="go-to-dashboard-btn"
        className="h-14 px-10 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-base rounded-xl shadow-[0_0_30px_rgba(245,166,35,0.3)] transition-all hover:scale-[1.02]"
        onClick={onGo}
      >
        Go to Dashboard
        <ArrowRight className="ml-2 size-5" />
      </Button>
    </motion.div>
  );
}
