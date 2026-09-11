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
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NICHES, slugify } from "@/lib/shop";
import { analyzeEmail, checkRateLimit } from "@/lib/emailValidation";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 1;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Retry attempt ${attempt} failed, retrying in 1s...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempt++;
    }
  }
  throw new Error("Maximum retries reached");
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signupSchema = z
  .object({
    businessName: z.string().trim().min(2, "Business name must be at least 2 characters"),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
    businessCategory: z.string().min(1, "Please select a business category"),
    phoneNumber: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[0-9+\s()-]{10,20}$/, "Please enter a valid phone number"),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
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

// ── Terms & Privacy Modal ───────────────────────────────────────────────────

function TermsModal({
  initialTab = "terms",
  onClose,
  onAccept,
}: {
  initialTab?: "terms" | "privacy";
  onClose: () => void;
  onAccept: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0f0d0a] shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "terms"
                  ? "bg-[#F5A623] text-black shadow-lg"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "privacy"
                  ? "bg-[#F5A623] text-black shadow-lg"
                  : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              Privacy Policy
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-white/70 leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#F5A623]/40 [&::-webkit-scrollbar-thumb]:rounded-full">
          {activeTab === "terms" ? (
            <>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h3>
                <p>
                  By creating an account on MY Link QR, you agree to these Terms of Service. If you
                  are registering on behalf of a store, restaurant, or business entity, you
                  represent that you have legal authority to bind that entity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  2. Business & Contact Information
                </h3>
                <p>
                  You agree to provide accurate business details, including valid contact numbers
                  and email addresses. You are responsible for maintaining account confidentiality
                  and all activities under your account.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">3. Menu Content & Ownership</h3>
                <p>
                  You retain complete ownership of all uploaded content (item names, descriptions,
                  images, prices). You warrant that uploaded items do not violate trademark or local
                  trade regulations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  4. Service Availability & Subscription
                </h3>
                <p>
                  MY Link QR provides dynamic digital menu QR codes. Free trial access enables full
                  menu setup and preview. Subscriptions can be managed or canceled anytime from your
                  store settings.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">1. Data We Collect</h3>
                <p>
                  We collect your full name, business name, phone number, and email address to set
                  up your store workspace and provide seamless menu management services.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">2. How We Use Your Data</h3>
                <p>
                  Your information is used strictly to power your digital menu dashboard, display
                  WhatsApp ordering links for your customers, and provide technical support. We
                  never sell your personal data.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">3. Security & Storage</h3>
                <p>
                  All database transactions are protected with 256-bit SSL encryption provided by
                  Supabase. Your passwords and credentials are securely hashed and encrypted.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          <p className="text-xs text-white/40">
            Click Accept to agree to the terms and launch your digital store.
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onAccept}
              className="bg-[#F5A623] hover:bg-[#e09615] text-black font-bold shadow-[0_0_15px_rgba(245,166,35,0.3)] flex items-center gap-2"
            >
              <span>Accept & Launch Store</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
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
  const isSigningUp = useRef(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("remembered_email") || "";
    }
    return "";
  });
  const [loginPassword, setLoginPassword] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("remembered_password") || "";
    }
    return "";
  });
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_remember_me") === "true";
    }
    return false;
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [businessName, setBusinessName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [businessCategory, setBusinessCategory] = useState(NICHES[0]!);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signupErrorModal, setSignupErrorModal] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<"terms" | "privacy">("terms");

  function handleAcceptTermsAndLaunch() {
    setTermsAccepted(true);
    setShowTermsModal(false);
    toast.success("Terms accepted!");
    void handleSignup(undefined, true);
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "openid email profile",
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error("Failed to connect to Google Login");
    } finally {
      setGoogleLoading(false);
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    let done = false;
    const go = async (userId: string) => {
      if (done || isSigningUp.current) return;
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

    const rateCheck = checkRateLimit(`login_${parsed.data.email.toLowerCase().trim()}`, 5, 60000);
    if (!rateCheck.allowed) {
      toast.error(`Too many login attempts. Please wait ${rateCheck.retryAfter} seconds.`);
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
        // Handle Remember Me — save email & password if checked
        if (rememberMe) {
          localStorage.setItem("auth_remember_me", "true");
          localStorage.setItem("remembered_email", cleanEmail);
          localStorage.setItem("remembered_password", parsed.data.password);
        } else {
          localStorage.removeItem("auth_remember_me");
          localStorage.removeItem("remembered_email");
          localStorage.removeItem("remembered_password");
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

  async function handleSignup(e?: React.FormEvent, overrideTerms = false) {
    e?.preventDefault();

    const parsed = signupSchema.safeParse({
      businessName,
      username: signupUsername,
      businessCategory,
      phoneNumber,
      email: signupEmail,
      password: signupPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors below.");
      return;
    }
    setErrors({});

    const emailAnalysis = analyzeEmail(signupEmail);
    if (emailAnalysis.isDisposable) {
      setErrors({ email: "Temporary or disposable emails are not allowed." });
      return;
    }
    if (!emailAnalysis.isValid) {
      setErrors({ email: emailAnalysis.message ?? "Please enter a valid email." });
      return;
    }

    const rateCheck = checkRateLimit(`signup_${signupEmail.toLowerCase().trim()}`, 3, 300000);
    if (!rateCheck.allowed) {
      toast.error(`Too many signup attempts. Please wait ${rateCheck.retryAfter} seconds.`);
      return;
    }

    if (!termsAccepted && !overrideTerms) {
      toast.error("Please accept the Terms of Service to continue.");
      return;
    }

    console.log("Signup button clicked");
    console.log("Form validation passed");

    const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
    const supabaseKey =
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_ANON_KEY"];

    console.log("SUPABASE_URL:", !!supabaseUrl);
    console.log("SUPABASE_KEY:", !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push("VITE_SUPABASE_URL");
      if (!supabaseKey) missingVars.push("VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY");

      console.error("Missing configuration:", missingVars.join(", "));
      setSignupErrorModal("Supabase configuration not found");
      return;
    }

    console.log("Supabase URL Loaded");
    console.log("Supabase Key Loaded");
    setSignupLoading(true);
    isSigningUp.current = true;

    try {
      await Promise.race([
        (async () => {
          console.log("Connecting to Supabase");
          // Connection health check
          const { error: healthError } = await supabase.from("profiles").select("id").limit(1);
          if (healthError) {
            console.error(healthError);
            throw new Error(`Backend Connection Failed: ${healthError.message}`);
          }

          console.log("Signup Started");
          const cleanEmail = parsed.data.email.toLowerCase().trim();

          console.log("Creating Auth User");
          console.log("Email:", cleanEmail);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: parsed.data.password,
            options: {
              data: {
                full_name: parsed.data.businessName.trim(),
              },
            },
          });

          if (authError) {
            console.error("Auth Error:", authError);
            throw new Error(authError.message);
          }

          console.log("Auth Created");
          const activeUserId = authData.user?.id;
          if (!activeUserId)
            throw new Error("Email already registered or authentication provider disabled.");

          console.log("Generating Slug");
          const { slugify } = await import("@/lib/shop");
          const baseSlug = parsed.data.username.trim();
          let finalSlug = baseSlug;
          let counter = 2;

          while (true) {
            const { data: existing } = await supabase
              .from("shops")
              .select("id")
              .eq("slug", finalSlug)
              .maybeSingle();
            if (!existing) break;
            finalSlug = `${baseSlug}-${counter}`;
            counter++;
          }

          console.log("Creating Shop");
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await withRetry(async () => {
            const { data: existingShop } = await supabase
              .from("shops")
              .select("id")
              .eq("owner_id", activeUserId)
              .maybeSingle();

            if (existingShop) return;

            const { error: shopError } = await supabase.from("shops").insert({
              owner_id: activeUserId,
              name: parsed.data.businessName.trim(),
              slug: finalSlug,
              niche: parsed.data.businessCategory,
              phone: parsed.data.phoneNumber.trim(),
              whatsapp: parsed.data.phoneNumber.trim(),
              status: "active",
              plan: "trial",
              plan_started_at: new Date().toISOString(),
              plan_expires_at: expiresAt.toISOString(),
            });
            if (shopError) throw shopError;
          });
          console.log("Shop Created");

          console.log("Auto Login");
          // Force sign in to guarantee session existence
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: parsed.data.password,
          });

          if (signInError && signInError.message !== "Email not confirmed") {
            // Ignore email not confirmed if they successfully created the session some other way
            console.error("Sign In Error:", signInError);
          }

          // Verify session exists
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData.session) {
            throw new Error("Authentication Failed");
          }
          console.log("Session Created");

          console.log("Realtime Synced");
          console.log("Dashboard Created");
          console.log("Redirecting");

          toast.success("🎉 Account created successfully.\nLet's set up your store!", {
            duration: 5000,
          });
          navigate({ to: "/onboarding", replace: true });
        })(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), 15000);
        }),
      ]);
    } catch (err: any) {
      console.error("Auth Error:", err);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("registered") || msg.includes("already") || msg.includes("exists")) {
        setErrors({ email: "This email already has an account — log in instead." });
      } else {
        setSignupErrorModal(err.message || "An unexpected error occurred during signup.");
      }
      isSigningUp.current = false;
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

                  {/* Google Login button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{googleLoading ? "Connecting..." : "Continue with Google"}</span>
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
                        onChange={(e) => {
                          setBusinessName(e.target.value);
                          setErrors((prev) => ({ ...prev, ["businessName"]: "" }));
                        }}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${errors["businessName"] ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                      />
                    </div>
                    {errors["businessName"] && (
                      <p className="text-red-400 text-xs font-medium">{errors["businessName"]}</p>
                    )}
                  </div>

                  {/* Username / Store Link */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-white/70 text-sm font-medium">
                      Store URL (Username)
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="e.g. jashan-resturant"
                        value={signupUsername}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                          setSignupUsername(val);
                          setErrors((prev) => ({ ...prev, ["username"]: "" }));
                        }}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${errors["username"] ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                      />
                    </div>
                    {signupUsername.length > 0 && (
                      <p className="text-[10px] text-emerald-400/80 mt-1 pl-1">
                        Your link: mylinkqr.in/shop/{signupUsername}
                      </p>
                    )}
                    {errors["username"] && (
                      <p className="text-red-400 text-xs font-medium">{errors["username"]}</p>
                    )}
                  </div>

                  {/* Business Category */}
                  <div className="space-y-2">
                    <Label className="text-white/70 text-sm font-medium">Business Category</Label>
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                      {NICHES.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setBusinessCategory(n);
                            setErrors((prev) => ({ ...prev, ["businessCategory"]: "" }));
                          }}
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
                    {errors["businessCategory"] && (
                      <p className="text-red-400 text-xs font-medium">
                        {errors["businessCategory"]}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone" className="text-white/70 text-sm font-medium">
                      Phone Number / Mobile
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          setErrors((prev) => ({ ...prev, ["phoneNumber"]: "" }));
                        }}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${errors["phoneNumber"] ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                      />
                      {phoneNumber && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {phoneNumber.trim().length >= 10 ? (
                            <CheckCircle2 className="size-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="size-4 text-amber-400" />
                          )}
                        </div>
                      )}
                    </div>
                    {errors["phoneNumber"] && (
                      <p className="text-red-400 text-xs font-medium">{errors["phoneNumber"]}</p>
                    )}
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
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          setErrors((prev) => ({ ...prev, ["email"]: "" }));
                        }}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${errors["email"] ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                      />
                    </div>
                    {errors["email"] && (
                      <p className="text-red-400 text-xs font-medium">{errors["email"]}</p>
                    )}
                    <EmailAnalysisStatus
                      email={signupEmail}
                      onApplySuggestion={(s) => {
                        setSignupEmail(s);
                        setErrors((prev) => ({ ...prev, ["email"]: "" }));
                      }}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <PasswordField
                      id="signup-password"
                      label="Password"
                      value={signupPassword}
                      onChange={(val) => {
                        setSignupPassword(val);
                        setErrors((prev) => ({ ...prev, ["password"]: "" }));
                      }}
                      showStrength
                      placeholder="Min. 6 characters"
                    />
                    {errors["password"] && (
                      <p className="text-red-400 text-xs font-medium">{errors["password"]}</p>
                    )}
                  </div>

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
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, ["confirmPassword"]: "" }));
                        }}
                        className={`pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 h-11 ${
                          (confirmPassword && confirmPassword !== signupPassword) ||
                          errors["confirmPassword"]
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
                    {errors["confirmPassword"] && confirmPassword === signupPassword && (
                      <p className="text-xs text-red-400 font-medium">
                        {errors["confirmPassword"]}
                      </p>
                    )}
                  </div>

                  {/* Terms */}
                  <div
                    className="flex items-start gap-3 cursor-pointer group select-none"
                    onClick={() => setTermsAccepted((t) => !t)}
                  >
                    <button
                      type="button"
                      id="terms-checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTermsAccepted((t) => !t);
                      }}
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                        termsAccepted
                          ? "bg-[#F5A623] border-[#F5A623]"
                          : "bg-transparent border-white/20 hover:border-white/40 group-hover:border-white/50"
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
                    <label className="text-xs text-white/50 leading-relaxed cursor-pointer group-hover:text-white/70">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTermsModalTab("terms");
                          setShowTermsModal(true);
                        }}
                        className="text-[#F5A623] hover:underline font-medium focus:outline-none"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTermsModalTab("privacy");
                          setShowTermsModal(true);
                        }}
                        className="text-[#F5A623] hover:underline font-medium focus:outline-none"
                      >
                        Privacy Policy
                      </button>
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

      {/* Terms of Service & Privacy Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <TermsModal
            initialTab={termsModalTab}
            onClose={() => setShowTermsModal(false)}
            onAccept={handleAcceptTermsAndLaunch}
          />
        )}
      </AnimatePresence>

      {/* Backend Error Modal */}
      <AnimatePresence>
        {signupErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#120e09] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 opacity-50" />
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                  <AlertCircle className="size-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Signup Failed</h3>
                <div className="text-sm text-white/70 mb-6 bg-white/5 border border-white/5 rounded-lg p-3 w-full text-left font-mono break-words">
                  <span className="text-white/40 uppercase text-[10px] tracking-wider mb-1 block">
                    Reason:
                  </span>
                  {signupErrorModal}
                </div>
                <Button
                  onClick={() => setSignupErrorModal(null)}
                  className="w-full h-11 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
