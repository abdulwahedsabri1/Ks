import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Store,
  User,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NICHES, slugify } from "@/lib/shop";
import { analyzeEmail } from "@/lib/emailValidation";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — MY Link QR" },
      {
        name: "description",
        content: "Log in or create your MY Link QR account to build a QR menu for your business.",
      },
      { property: "og:title", content: "Sign in — MY Link QR" },
      { property: "og:description", content: "Log in or create your MY Link QR account." },
    ],
  }),
  component: AuthPage,
});

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
    businessName: z.string().trim().min(2, "Business name must be at least 2 characters"),
    businessCategory: z.string().min(1, "Please select a business category"),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const forgotSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

// ── Password Strength ─────────────────────────────────────────────────────────

function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f97316" };
  if (score <= 3) return { score, label: "Good", color: "#eab308" };
  if (score <= 4) return { score, label: "Strong", color: "#22c55e" };
  return { score, label: "Very Strong", color: "#F5A623" };
}

// ── Role-based redirect ───────────────────────────────────────────────────────

async function getRoleRedirectPath(userId: string): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "owner";
    if (role === "admin") return "/admin";
    if (role === "staff") return "/staff";
    return "/dashboard";
  } catch {
    return "/dashboard";
  }
}

// ── Email Analysis ────────────────────────────────────────────────────────────

function EmailAnalysisStatus({
  email,
  onApplySuggestion,
}: {
  email: string;
  onApplySuggestion?: (s: string) => void;
}) {
  if (!email.trim()) return null;
  const analysis = analyzeEmail(email);

  if (analysis.status === "valid") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-1.5">
        <CheckCircle2 className="size-3.5" />
        <span>Valid email address</span>
      </div>
    );
  }
  if (analysis.status === "disposable") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1.5">
        <AlertCircle className="size-3.5" />
        <span>Temporary/disposable emails are not allowed</span>
      </div>
    );
  }
  if (analysis.status === "typo" && analysis.suggestion) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mt-1.5">
        <AlertTriangle className="size-3.5" />
        <span>
          Did you mean{" "}
          <button
            type="button"
            className="underline font-bold hover:text-amber-300 cursor-pointer"
            onClick={() => onApplySuggestion?.(analysis.suggestion!)}
          >
            {analysis.suggestion}
          </button>
          ? Click to fix.
        </span>
      </div>
    );
  }
  if (analysis.status === "invalid" && email.includes("@")) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium mt-1.5">
        <AlertCircle className="size-3.5" />
        <span>{analysis.message}</span>
      </div>
    );
  }
  return null;
}

// ── Forgot Password Modal ─────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0d0a] p-8 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-sm text-white/50 mt-1">We'll send a reset link to your email</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
              <CheckCircle2 className="size-7 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Check your inbox</p>
            <p className="text-white/50 text-sm mt-2">
              A password reset link has been sent to <span className="text-[#F5A623]">{email}</span>
            </p>
            <Button
              className="mt-6 w-full bg-[#F5A623] hover:bg-[#e09615] text-black font-bold"
              onClick={onClose}
            >
              Close
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                <Input
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
                  autoFocus
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Sending…
                </div>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Password Field ────────────────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  showStrength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  showStrength?: boolean;
}) {
  const [show, setShow] = useState(false);
  const strength = showStrength ? passwordStrength(value) : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/70 text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showStrength && value && strength && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: strength.color }}>
            {strength.label}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Auth Tabs ─────────────────────────────────────────────────────────────────

type AuthTab = "login" | "signup";

// ── Main Auth Page ────────────────────────────────────────────────────────────

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [showForgot, setShowForgot] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState(NICHES[0]!);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    let done = false;
    const go = async (userId: string) => {
      if (done) return;
      done = true;
      const path = await getRoleRedirectPath(userId);
      navigate({ to: path, replace: true });
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void go(data.session.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) void go(session.user.id);
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // ── Login ────────────────────────────────────────────────────────────────

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    setLoginLoading(true);
    try {
      const cleanEmail = parsed.data.email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: parsed.data.password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) {
          toast.error("Wrong email or password. Please check and try again.");
        } else if (msg.includes("email") && msg.includes("confirm")) {
          toast.error("Please verify your email first. Check your inbox.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.session && data.user) {
        // Handle Remember Me — extend session if checked
        if (rememberMe) {
          localStorage.setItem("auth_remember_me", "true");
        } else {
          localStorage.removeItem("auth_remember_me");
        }

        toast.success("Welcome back! 🎉");
        const path = await getRoleRedirectPath(data.user.id);
        navigate({ to: path, replace: true });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Signup ───────────────────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    const parsed = signupSchema.safeParse({
      fullName,
      businessName,
      businessCategory,
      email: signupEmail,
      password: signupPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please fix the errors above");
      return;
    }

    const emailAnalysis = analyzeEmail(signupEmail);
    if (emailAnalysis.isDisposable) {
      toast.error("Temporary or disposable emails are not allowed. Please use a real email.");
      return;
    }
    if (!emailAnalysis.isValid) {
      toast.error(emailAnalysis.message ?? "Please enter a valid email address.");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }

    setSignupLoading(true);
    try {
      const cleanEmail = parsed.data.email.toLowerCase().trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: parsed.data.fullName.trim(),
            business_name: parsed.data.businessName.trim(),
            business_category: parsed.data.businessCategory,
            niche: parsed.data.businessCategory,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("registered")) {
          toast.error("This email already has an account — log in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create shop workspace for the new user
        const { error: shopError } = await supabase.from("shops").insert({
          owner_id: data.user.id,
          name: parsed.data.businessName.trim(),
          slug: `${slugify(parsed.data.businessName.trim())}-${Math.random().toString(36).slice(2, 6)}`,
          niche: parsed.data.businessCategory,
          status: "active",
          plan: "trial",
          plan_expires_at: expiresAt.toISOString(),
        });

        if (shopError) {
          console.warn("Shop creation notice:", shopError.message);
        }

        if (data.session) {
          toast.success("🎉 Account created! Welcome to MY Link QR!");
          navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success(
            "Account created! Please check your inbox to verify your email, then log in.",
            { duration: 6000 },
          );
          setActiveTab("login");
          setLoginEmail(cleanEmail);
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  }


  return (
    <>
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 bg-[#080604]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,166,35,0.12),transparent)]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623]/3 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ── Left Panel ── */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
          {/* Panel background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0b07] via-[#120e09] to-[#080604] border-r border-white/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_30%_40%,rgba(245,166,35,0.08),transparent)]" />

          {/* Floating decorative QR grid */}
          <div className="absolute bottom-0 right-0 w-72 h-72 opacity-[0.03]">
            <div className="grid grid-cols-8 gap-1 w-full h-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-sm"
                  style={{ opacity: Math.random() > 0.5 ? 1 : 0 }}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
                <QrCode className="size-5 text-[#F5A623]" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">MY Link QR</span>
            </Link>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-semibold mb-6">
              <Sparkles className="size-3.5" />
              Trusted by 1,000+ businesses across India
            </div>
            <h2 className="font-bold text-5xl text-white leading-[1.1] tracking-tight">
              One QR code. <span className="text-[#F5A623]">Your entire business</span>, on every
              phone.
            </h2>
            <p className="mt-5 text-lg text-white/50 leading-relaxed">
              Restaurants, salons, bakeries and boutiques use MY Link QR to publish live digital
              experiences and engage customers without limits.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {[
                "Digital QR Menu",
                "WhatsApp Ordering",
                "Google Reviews",
                "Analytics",
                "AI Menu Generator",
              ].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["R", "P", "S", "A"].map((l, i) => (
                <div
                  key={l}
                  className="w-8 h-8 rounded-full border-2 border-[#0f0b07] flex items-center justify-center text-xs font-bold text-black"
                  style={{
                    backgroundColor: ["#F5A623", "#e09615", "#cc8510", "#b57510"][i],
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40">
              Join <span className="text-white/70 font-semibold">1,000+ businesses</span> already on
              MY Link QR
            </p>
          </div>
        </div>

        {/* ── Right Panel (Form) ── */}
        <div className="flex items-center justify-center p-6 min-h-screen">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Mobile logo */}
            <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
                <QrCode className="size-5 text-[#F5A623]" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">MY Link QR</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {activeTab === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1.5 text-white/50 text-sm">
                {activeTab === "login"
                  ? "Sign in to manage your business"
                  : "Get your free digital QR menu in seconds"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="relative flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
              <motion.div
                className="absolute top-1 bottom-1 rounded-lg bg-[#F5A623]/15 border border-[#F5A623]/30"
                initial={false}
                animate={{
                  left: activeTab === "login" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              />
              {(["login", "signup"] as AuthTab[]).map((tab) => (
                <button
                  key={tab}
                  id={`auth-tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                    activeTab === tab ? "text-[#F5A623]" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white/70 text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@business.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-white/70 text-sm font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs text-[#F5A623] hover:text-[#e09615] font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <PasswordField
                      id="login-password"
                      label=""
                      value={loginPassword}
                      onChange={setLoginPassword}
                    />
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="remember-me-checkbox"
                      onClick={() => setRememberMe((r) => !r)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        rememberMe
                          ? "bg-[#F5A623] border-[#F5A623]"
                          : "bg-transparent border-white/20 hover:border-white/40"
                      }`}
                      aria-checked={rememberMe}
                      role="checkbox"
                    >
                      {rememberMe && (
                        <svg
                          viewBox="0 0 12 10"
                          className="w-3 h-3 fill-none stroke-black stroke-2"
                        >
                          <path d="M1 5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <label
                      htmlFor="remember-me-checkbox"
                      className="text-sm text-white/50 cursor-pointer select-none"
                      onClick={() => setRememberMe((r) => !r)}
                    >
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Login button */}
                  <Button
                    type="submit"
                    id="login-submit-btn"
                    disabled={loginLoading}
                    className="w-full h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(245,166,35,0.25)]"
                  >
                    {loginLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Signing in…
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>


                  <p className="text-center text-xs text-white/30">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-[#F5A623] hover:text-[#e09615] font-semibold transition-colors"
                    >
                      Sign up free
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  onSubmit={handleSignup}
                  className="space-y-5"
                >
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-white/70 text-sm font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11"
                      />
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-biz" className="text-white/70 text-sm font-medium">
                      Business Name
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="signup-biz"
                        type="text"
                        placeholder="e.g. Gourmet Bistro"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11"
                      />
                    </div>
                  </div>

                  {/* Business Category */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">Business Category</Label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {NICHES.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setBusinessCategory(n)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            businessCategory === n
                              ? "bg-[#F5A623]/15 text-[#F5A623] border-[#F5A623]/40"
                              : "bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/70"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white/70 text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@business.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11"
                      />
                    </div>
                    <EmailAnalysisStatus
                      email={signupEmail}
                      onApplySuggestion={(s) => setSignupEmail(s)}
                    />
                  </div>

                  {/* Password */}
                  <PasswordField
                    id="signup-password"
                    label="Password"
                    value={signupPassword}
                    onChange={setSignupPassword}
                    showStrength
                    placeholder="Min. 8 characters"
                  />

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white/70 text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${
                          confirmPassword && confirmPassword !== signupPassword
                            ? "border-red-500/50"
                            : confirmPassword && confirmPassword === signupPassword
                              ? "border-emerald-500/50"
                              : ""
                        }`}
                      />
                      {confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {confirmPassword === signupPassword ? (
                            <CheckCircle2 className="size-4 text-emerald-400" />
                          ) : (
                            <X className="size-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmPassword && confirmPassword !== signupPassword && (
                      <p className="text-xs text-red-400 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      id="terms-checkbox"
                      onClick={() => setTermsAccepted((t) => !t)}
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                        termsAccepted
                          ? "bg-[#F5A623] border-[#F5A623]"
                          : "bg-transparent border-white/20 hover:border-white/40"
                      }`}
                      aria-checked={termsAccepted}
                      role="checkbox"
                    >
                      {termsAccepted && (
                        <svg
                          viewBox="0 0 12 10"
                          className="w-3 h-3 fill-none stroke-black stroke-2"
                        >
                          <path d="M1 5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <label
                      className="text-xs text-white/50 leading-relaxed cursor-pointer"
                      onClick={() => setTermsAccepted((t) => !t)}
                    >
                      I agree to the{" "}
                      <Link to="/terms" className="text-[#F5A623] hover:underline font-medium">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-[#F5A623] hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    id="signup-submit-btn"
                    disabled={signupLoading}
                    className="w-full h-12 bg-[#F5A623] hover:bg-[#e09615] text-black font-bold text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(245,166,35,0.25)]"
                  >
                    {signupLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Creating your store…
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        Launch Digital Store
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>


                  <p className="text-center text-xs text-white/30">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-[#F5A623] hover:text-[#e09615] font-semibold transition-colors"
                    >
                      Log in
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mt-8 text-xs text-white/25">
              <ShieldCheck className="size-3.5" />
              <span>256-bit SSL encryption · Secured by Supabase</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>
    </>
  );
}
