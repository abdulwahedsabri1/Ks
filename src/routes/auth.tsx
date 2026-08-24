import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QrCode, Store, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NICHES, slugify } from "@/lib/shop";

import { analyzeEmail } from "@/lib/emailValidation";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

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

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [niche, setNiche] = useState(NICHES[0]!);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handle(mode: "login" | "signup") {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
      return;
    }

    // Email Analysis & Disposable Email Security Guard
    const emailAnalysis = analyzeEmail(email);
    if (mode === "signup") {
      if (emailAnalysis.isDisposable) {
        toast.error(
          "Temporary or disposable emails are forbidden for account registration. Please use a real email.",
        );
        return;
      }
      if (!emailAnalysis.isValid) {
        toast.error(emailAnalysis.message ?? "Please enter a valid email address.");
        return;
      }
    }
    setLoading(true);
    try {
      const cleanEmail = parsed.data.email.toLowerCase().trim();
      const cleanPassword = parsed.data.password;

      if (mode === "login") {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        // Fallback provision for generated customer accounts (e.g. rafeek-7kz7@mylinkqr.com)
        if (error && (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials"))) {
          const slugPrefix = cleanEmail.split("@")[0];
          const { data: matchedShops } = await supabase
            .from("shops")
            .select("*")
            .or(`slug.eq.${slugPrefix},slug.ilike.${slugPrefix}`);

          if (matchedShops && matchedShops.length > 0) {
            const targetShop = matchedShops[0]!;
            const signUpRes = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPassword,
              options: {
                data: {
                  full_name: targetShop.name,
                  business_name: targetShop.name,
                },
              },
            });

            if (signUpRes.data?.session && signUpRes.data?.user) {
              await supabase
                .from("shops")
                .update({ owner_id: signUpRes.data.user.id })
                .eq("id", targetShop.id);

              toast.success(`Account activated! Welcome to ${targetShop.name}`);
              navigate({ to: "/dashboard", replace: true });
              return;
            } else if (signUpRes.data?.user) {
              // Retry login after registration
              const retryLogin = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
              });
              if (retryLogin.data?.session) {
                await supabase
                  .from("shops")
                  .update({ owner_id: retryLogin.data.user.id })
                  .eq("id", targetShop.id);

                toast.success(`Signed in as ${targetShop.name}`);
                navigate({ to: "/dashboard", replace: true });
                return;
              }
            }
          }
        }

        if (error) {
          toast.error(
            error.message.toLowerCase().includes("invalid")
              ? "Wrong email or password. Please check and try again."
              : error.message,
          );
          return;
        }
        if (data.session) {
          toast.success("Welcome back");
          navigate({ to: "/dashboard", replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name.trim(),
              business_name: businessName.trim(),
              phone: phone.trim(),
              niche: niche,
            },
          },
        });
        if (error) {
          toast.error(
            error.message.toLowerCase().includes("registered")
              ? "This email already has an account — log in instead."
              : error.message,
          );
          return;
        }
        if (data.session && data.user) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await supabase.from("shops").insert({
            owner_id: data.user.id,
            name: businessName.trim(),
            slug: `${slugify(businessName.trim())}-${Math.random().toString(36).slice(2, 6)}`,
            niche: niche,
            whatsapp: phone.trim() || null,
            status: "active",
            plan: "trial",
            plan_expires_at: expiresAt.toISOString(),
          });
          navigate({ to: "/dashboard", replace: true });
        } else toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-hero-gradient p-12 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="relative z-20 flex items-center gap-2 font-display text-xl font-bold">
            <QrCode className="size-8 text-primary" /> MY Link QR
          </div>
        </Link>
        <div className="max-w-2xl text-white mt-12">
          <h2 className="font-display text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
            One QR code. Your entire business, on every phone.
          </h2>
          <p className="mt-6 text-lg lg:text-xl text-white/70 leading-relaxed font-medium">
            Restaurants, salons, bakeries and boutiques use MY Link QR to publish live digital
            experiences and engage customers without limits.
          </p>
        </div>
        <p className="text-sm font-medium text-white/50">
          Trusted by local businesses across India.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your shop, or create a free account.
          </p>

          <Tabs defaultValue="login" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent
              value="login"
              className="mt-6 space-y-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handle("login");
              }}
            >
              <Field id="email" label="Email" value={email} onChange={setEmail} type="email" />
              <Field
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
              />
              <Button className="w-full" disabled={loading} onClick={() => handle("login")}>
                Log in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-5">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl font-bold">Create Your Business</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Get your unique QR code and digital menu in seconds
                </p>
              </div>

              <Field
                id="businessName"
                label="Business Name"
                value={businessName}
                onChange={setBusinessName}
                placeholder="e.g. Gourmet Bistro"
                icon={Store}
              />
              <Field
                id="name"
                label="Owner Full Name"
                value={name}
                onChange={setName}
                placeholder="John Doe"
                icon={User}
              />
              <Field
                id="email2"
                label="Email Address"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="john@business.com"
                icon={Mail}
                showEmailAnalysis
              />
              <Field
                id="password2"
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="••••••••"
                icon={Lock}
              />
              <Field
                id="phone"
                label="WhatsApp / Phone Number"
                value={phone}
                onChange={setPhone}
                placeholder="+1 555 019 2838"
                icon={Phone}
              />

              <div className="space-y-3 pt-2">
                <Label className="font-semibold text-muted-foreground">Business Niche</Label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNiche(n)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                        niche === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-bold mt-6"
                disabled={loading}
                onClick={() => handle("signup")}
              >
                Launch Digital Store <ArrowRight className="ml-2 size-5" />
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium mt-1.5">
        <CheckCircle2 className="size-3.5" />
        <span>Valid email address</span>
      </div>
    );
  }

  if (analysis.status === "disposable") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1.5">
        <AlertCircle className="size-3.5" />
        <span>Temporary/disposable emails are not allowed for registration</span>
      </div>
    );
  }

  if (analysis.status === "typo" && analysis.suggestion) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium mt-1.5">
        <AlertTriangle className="size-3.5" />
        <span>
          Did you mean{" "}
          <button
            type="button"
            className="underline font-bold hover:text-amber-400 cursor-pointer"
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

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon: Icon,
  showEmailAnalysis = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  showEmailAnalysis?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-semibold text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={Icon ? "pl-9" : ""}
        />
      </div>
      {showEmailAnalysis && (
        <EmailAnalysisStatus email={value} onApplySuggestion={(s) => onChange(s)} />
      )}
    </div>
  );
}
