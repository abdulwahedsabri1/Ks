import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, ShieldCheck, Lock, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  whatsappNumber: z.string().min(10, "Valid WhatsApp number is required"),
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
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  category: z.string().min(2, "Category is required"),
  businessAddress: z.string().optional(),
  website: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Hotel",
  "Salon",
  "Gym",
  "Boutique",
  "Retail Shop",
  "Other",
];

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
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`);
      });
  }, [search.price]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      category: "",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    setLoading(true);

    try {
      // 1. Try saving payment record to Supabase
      try {
        await supabase.from("payments").insert({
          plan_name: search.plan,
          amount: search.price,
          business_name: data.businessName,
          owner_name: data.ownerName,
          mobile: data.mobileNumber,
          whatsapp: data.whatsappNumber,
          email: data.email,
          city: data.city,
          state: data.state,
          category: data.category,
          business_address: data.businessAddress ?? null,
          website: data.website ?? null,
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

*Business Details:*
- Business Name: ${data.businessName}
- Owner Name: ${data.ownerName}
- Mobile Number: ${data.mobileNumber}
- WhatsApp Number: ${data.whatsappNumber}
- Email: ${data.email}
- Category: ${data.category}
- City: ${data.city}
- State: ${data.state}
${data.businessAddress ? `- Address: ${data.businessAddress}\n` : ""}${data.website ? `- Website: ${data.website}\n` : ""}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/919392318135?text=${encodedMessage}`;

      toast.success("Order details submitting to WhatsApp...");

      // Open WhatsApp link directly
      const opened = window.open(whatsappUrl, "_blank");
      if (!opened) {
        window.location.href = whatsappUrl;
      }

      // Navigate to dashboard
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto p-4 md:p-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Left Column: Summary & Payment */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100/50 backdrop-blur-xl bg-white/80"
            >
              <h2 className="text-2xl font-display font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-lg">{search.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Billing Cycle</span>
                  <span className="font-medium text-gray-900">{search.period.replace('/', '')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">GST</span>
                  <span className="font-medium text-green-600">Included</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-medium text-gray-900">Total Amount</span>
                <span className="text-3xl font-display font-semibold text-primary">₹{search.price}</span>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">Secure UPI Payment</span>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4 flex justify-center items-center min-h-[220px]">
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
                
                <div className="text-center space-y-3 text-sm text-gray-600">
                  <p>Scan with any UPI App to pay <strong>₹{search.price}</strong></p>
                  <div className="flex items-center justify-between font-mono bg-white py-2 px-3 rounded-md border text-gray-800">
                    <span className="text-sm">9392318135-2@axl</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("9392318135-2@axl");
                        toast.success("UPI ID copied to clipboard");
                      }}
                      className="text-primary hover:text-primary/80 p-1"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-sm text-left">
                    <div className="flex justify-between w-full">
                      <span className="text-gray-500">Payee:</span>
                      <span className="font-medium text-gray-800">Abdul Wahed Sabri</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium text-gray-800">₹{search.price}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 grid grid-cols-2 gap-2">
                    <a
                      href={`tez://upi/pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm text-xs"
                    >
                      Google Pay
                    </a>
                    <a
                      href={`phonepe://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm text-xs"
                    >
                      PhonePe
                    </a>
                    <a
                      href={`paytmmp://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-white border border-gray-200 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm text-xs"
                    >
                      Paytm
                    </a>
                    <a
                      href={`upi://pay?pa=9392318135-2@axl&pn=Abdul%20Wahed%20Sabri&am=${search.price}&cu=INR`}
                      className="flex items-center justify-center w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm text-xs"
                    >
                      Other UPI Apps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100/50"
            >
              <div className="flex items-center gap-2 mb-8">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-display font-semibold">Business Registration</h2>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input id="businessName" placeholder="E.g. The Coffee House" {...register("businessName")} />
                    {errors.businessName && <p className="text-sm text-red-500">{errors.businessName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input id="ownerName" placeholder="John Doe" {...register("ownerName")} />
                    {errors.ownerName && <p className="text-sm text-red-500">{errors.ownerName.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input id="mobileNumber" placeholder="9876543210" {...register("mobileNumber")} />
                    {errors.mobileNumber && <p className="text-sm text-red-500">{errors.mobileNumber.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
                    <Input id="whatsappNumber" placeholder="9876543210" {...register("whatsappNumber")} />
                    {errors.whatsappNumber && <p className="text-sm text-red-500">{errors.whatsappNumber.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Business Category *</Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUSINESS_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="Mumbai" {...register("city")} />
                    {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input id="state" placeholder="Maharashtra" {...register("state")} />
                    {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Input id="businessAddress" placeholder="Full address" {...register("businessAddress")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input id="website" placeholder="https://example.com" {...register("website")} />
                </div>

                <Button type="submit" size="lg" className="w-full rounded-full shadow-lg cursor-pointer mt-6" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Complete Checkout
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}


