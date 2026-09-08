import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, ShieldCheck, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { Route } from "@/routes/checkout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "qrcode";

import { analyzeEmail } from "@/lib/emailValidation";

const checkoutSchema = z.object({
  ownerName: z.string().min(2, "Full name is required"),
  businessName: z.string().min(2, "Business name is required"),
  email: z
    .string()
    .email("Valid email is required")
    .superRefine((val, ctx) => {
      const analysis = analyzeEmail(val);
      if (analysis.isDisposable) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Temporary or disposable emails are forbidden for registration",
        });
      } else if (!analysis.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: analysis.message || "Invalid email address format",
        });
      }
    }),
  mobileNumber: z.string().min(10, "Valid phone number is required"),
  businessAddress: z.string().min(3, "Business address is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const search = useSearch({ from: Route.id });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const price = search.price || 99;
    const upiUri = `upi://pay?pa=9392318135-2@axl&pn=${encodeURIComponent("Abdul Wahed Sabri")}&am=${price}&cu=INR`;
    QRCode.toDataURL(upiUri, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => {
        console.error("Failed to generate QR code locally:", err);
        setQrCodeUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`,
        );
      });
  }, [search.price]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    setLoading(true);

    try {
      // 1. Save payment record to Supabase
      try {
        await supabase.from("payments").insert({
          plan_name: search.plan,
          amount: search.price,
          business_name: data.businessName,
          owner_name: data.ownerName,
          mobile: data.mobileNumber,
          whatsapp: data.mobileNumber,
          email: data.email,
          city: "N/A",
          state: "N/A",
          category: "General",
          business_address: data.businessAddress,
          screenshot_url: "",
          status: "Pending",
        });
      } catch (dbErr) {
        console.warn("Supabase database insert warning:", dbErr);
      }

      // 2. Trigger WhatsApp Notification to 9392318135
      const message = `*NEW ORDER / BUSINESS REGISTRATION*

*Plan Details:*
- Plan: ${search.plan}
- Amount: ₹${search.price}
- Billing Cycle: ${search.period}

*Customer Details:*
- Name: ${data.ownerName}
- Business Name: ${data.businessName}
- Phone Number: ${data.mobileNumber}
- Email: ${data.email}
- Address: ${data.businessAddress}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/919392318135?text=${encodedMessage}`;

      toast.success("Order details submitting to WhatsApp...");

      const opened = window.open(whatsappUrl, "_blank");
      if (!opened) {
        window.location.href = whatsappUrl;
      }

      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Column: Order Summary & Payment */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-3xl p-6 md:p-8 shadow-lift border border-border"
            >
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Plan</span>
                  <span className="font-bold text-foreground text-base capitalize">
                    {search.plan}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Billing Cycle</span>
                  <span className="font-semibold text-foreground">
                    {search.period.replace("/", "")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">GST</span>
                  <span className="font-bold text-emerald-500">Included</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold text-foreground">Total Amount</span>
                <span className="text-3xl font-display font-extrabold text-primary">
                  ₹{search.price}
                </span>
              </div>

              <div className="bg-muted/40 rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary text-sm">Secure UPI Payment</span>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 flex justify-center items-center min-h-[220px]">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt={`UPI QR Code for ₹${search.price}`}
                      className="w-52 h-52 object-contain"
                    />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  )}
                </div>

                <div className="text-center space-y-3 text-xs text-muted-foreground">
                  <p>
                    Scan with any UPI App to pay{" "}
                    <strong className="text-foreground">₹{search.price}</strong>
                  </p>
                  <div className="flex items-center justify-between font-mono bg-card py-2 px-3 rounded-xl border border-border text-foreground">
                    <span className="text-xs font-semibold">9392318135-2@axl</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("9392318135-2@axl");
                        toast.success("UPI ID copied to clipboard");
                      }}
                      className="text-primary hover:text-primary/80 p-1 cursor-pointer"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-left">
                    <div className="flex justify-between w-full">
                      <span className="text-muted-foreground">Payee:</span>
                      <span className="font-bold text-foreground">Abdul Wahed Sabri</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-foreground">₹{search.price}</span>
                    </div>
                  </div>

                  <div className="pt-3 grid grid-cols-2 gap-2">
                    <a
                      href={`tez://upi/pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-semibold shadow-sm text-xs"
                    >
                      Google Pay
                    </a>
                    <a
                      href={`phonepe://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-semibold shadow-sm text-xs"
                    >
                      PhonePe
                    </a>
                    <a
                      href={`paytmmp://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors font-semibold shadow-sm text-xs"
                    >
                      Paytm
                    </a>
                    <a
                      href={`upi://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-sm text-xs"
                    >
                      Other UPI Apps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Simplified Registration Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-3xl p-6 md:p-8 shadow-lift border border-border"
            >
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Business Registration
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="ownerName"
                      className="font-bold text-foreground text-xs sm:text-sm"
                    >
                      Full Name *
                    </Label>
                    <Input
                      id="ownerName"
                      placeholder="John Doe"
                      {...register("ownerName")}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-11 text-xs sm:text-sm font-medium"
                    />
                    {errors.ownerName && (
                      <p className="text-xs font-semibold text-red-500">
                        {errors.ownerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="businessName"
                      className="font-bold text-foreground text-xs sm:text-sm"
                    >
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      placeholder="e.g. Gourmet Bistro"
                      {...register("businessName")}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-11 text-xs sm:text-sm font-medium"
                    />
                    {errors.businessName && (
                      <p className="text-xs font-semibold text-red-500">
                        {errors.businessName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="font-bold text-foreground text-xs sm:text-sm">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      {...register("email")}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-11 text-xs sm:text-sm font-medium"
                    />
                    {errors.email && (
                      <p className="text-xs font-semibold text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="mobileNumber"
                      className="font-bold text-foreground text-xs sm:text-sm"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="mobileNumber"
                      placeholder="9876543210"
                      {...register("mobileNumber")}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-11 text-xs sm:text-sm font-medium"
                    />
                    {errors.mobileNumber && (
                      <p className="text-xs font-semibold text-red-500">
                        {errors.mobileNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="businessAddress"
                    className="font-bold text-foreground text-xs sm:text-sm"
                  >
                    Address *
                  </Label>
                  <Input
                    id="businessAddress"
                    placeholder="Full business address"
                    {...register("businessAddress")}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground/60 h-11 text-xs sm:text-sm font-medium"
                  />
                  {errors.businessAddress && (
                    <p className="text-xs font-semibold text-red-500">
                      {errors.businessAddress.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow font-bold text-sm h-12 cursor-pointer mt-6"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Complete Registration & Pay
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
