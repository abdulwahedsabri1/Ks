import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QrCode, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/shop";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

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

async function ensureShopExists(
  userId: string,
  profile: {
    full_name: string | null;
    business_name: string | null;
    business_category: string | null;
    email: string | null;
  },
) {
  // Check if shop exists
  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (!existingShop) {
    const biz = profile.business_name?.trim() || profile.full_name?.trim() || "My Business";
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from("shops").insert({
      owner_id: userId,
      name: biz,
      slug: `${slugify(biz)}-${Math.random().toString(36).slice(2, 6)}`,
      niche: profile.business_category ?? "Restaurant",
      status: "active",
      plan: "trial",
      plan_expires_at: expiresAt.toISOString(),
    });
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let handled = false;

    async function handleCallback() {
      if (handled) return;
      handled = true;

      try {
        // Supabase JS v2 automatically handles the code exchange from the URL
        // when using PKCE flow (default). We just need to get the current session.
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setStatus("error");
          setMessage(error.message);
          setTimeout(() => navigate({ to: "/auth" }), 3000);
          return;
        }

        if (!session?.user) {
          // Possibly an email confirmation — check URL for type
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.replace("#", "?"));
          const type =
            params.get("type") ?? new URLSearchParams(window.location.search).get("type");

          if (type === "recovery") {
            navigate({ to: "/auth/reset-password" });
            return;
          }

          // Try refreshing
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (!refreshed.session) {
            setStatus("error");
            setMessage("Session not found. Please try signing in again.");
            setTimeout(() => navigate({ to: "/auth" }), 3000);
            return;
          }
        }

        const user = session?.user ?? (await supabase.auth.getUser()).data.user;
        if (!user) {
          setStatus("error");
          setMessage("Could not retrieve user. Please try again.");
          setTimeout(() => navigate({ to: "/auth" }), 3000);
          return;
        }

        setMessage("Setting up your account…");

        // Fetch the profile that the trigger should have created
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Ensure a shop workspace exists
        await ensureShopExists(user.id, {
          full_name:
            profile?.full_name ??
            user.user_metadata?.["full_name"] ??
            user.user_metadata?.["name"] ??
            null,
          business_name: profile?.business_name ?? user.user_metadata?.["business_name"] ?? null,
          business_category:
            profile?.business_category ?? user.user_metadata?.["business_category"] ?? null,
          email: profile?.email ?? user.email ?? null,
        });

        setMessage("Redirecting…");
        setStatus("success");

        const path = await getRoleRedirectPath(user.id);
        setTimeout(() => navigate({ to: path, replace: true }), 1000);
      } catch (err) {
        console.error("Callback error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again.");
        setTimeout(() => navigate({ to: "/auth" }), 3000);
      }
    }

    void handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#080604] flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(245,166,35,0.08),transparent)]" />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center">
            <QrCode className="size-6 text-[#F5A623]" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">MY Link QR</span>
        </div>

        {/* Status indicator */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
          {status === "loading" && (
            <div className="w-8 h-8 border-2 border-[#F5A623]/20 border-t-[#F5A623] rounded-full animate-spin" />
          )}
          {status === "success" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <CheckCircle2 className="size-10 text-emerald-400" />
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
            >
              <XCircle className="size-10 text-red-400" />
            </motion.div>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold text-white mb-2">
            {status === "loading" && "Signing you in…"}
            {status === "success" && "You're in! 🎉"}
            {status === "error" && "Sign-in failed"}
          </h1>
          <p className="text-white/50 text-sm">{message}</p>
        </div>

        {status === "error" && (
          <a
            href="/auth"
            className="px-6 py-2.5 rounded-xl bg-[#F5A623] text-black font-semibold text-sm hover:bg-[#e09615] transition-colors"
          >
            Back to Sign In
          </a>
        )}
      </motion.div>
    </div>
  );
}
