import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { PLANS } from "@/lib/shop";

export function PricingSection() {
  const navigate = useNavigate();

  const handleCheckout = (p: (typeof PLANS)[0]) => {
    if (p.id === "trial") {
      navigate({ to: "/auth" });
    } else {
      navigate({
        to: "/checkout",
        search: {
          plan: p.name,
          price: p.id === "pro" ? 299 : p.id === "premium" ? 499 : 99,
          period: p.id === "basic" ? "/7 days" : "/mo",
        },
      });
    }
  };

  return (
    <section id="pricing" className="bg-[#F5F0E7] py-24 md:py-32 text-[#100C09] relative overflow-hidden">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-[#F5A623]/30 bg-[#F5A623]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#D99A2B] mb-4"
          >
            <Sparkles className="size-3.5" />
            Simple Plans for Every Business
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 text-[#100C09]"
          >
            Simple plans for <span className="italic text-[#F5A623]">every business</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-[#3A2818]/70 leading-relaxed font-medium"
          >
            No hidden fees. Upgrade or cancel anytime. Start with our basic plan or power up with Pro.
          </motion.p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto items-stretch">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`relative rounded-3xl bg-white p-6 sm:p-7 border ${
                p.highlight
                  ? "border-[#F5A623] shadow-2xl ring-2 ring-[#F5A623]/30"
                  : "border-black/10 shadow-xl hover:border-[#F5A623]/40"
              } flex flex-col justify-between transition-all duration-300`}
            >
              {p.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div>
                <h3 className="font-display text-2xl font-bold mb-1 text-[#100C09]">{p.name}</h3>
                <p className="text-xs text-[#3A2818]/70 mb-6 min-h-[32px] leading-relaxed font-medium">
                  {p.tagline}
                </p>

                <div className="flex items-baseline gap-1 mb-6 border-b border-black/10 pb-6">
                  <span className="font-display text-4xl font-extrabold text-[#100C09]">{p.price}</span>
                  <span className="text-[#3A2818]/70 text-xs font-medium">/period</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs text-[#3A2818]/80 font-medium">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="size-4 rounded-full bg-[#F5A623]/20 text-[#D99A2B] flex items-center justify-center shrink-0">
                        <Check className="size-2.5" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button
                  onClick={() => handleCheckout(p)}
                  size="lg"
                  className={`w-full rounded-full font-bold h-11 text-xs ${
                    p.highlight
                      ? "bg-[#F5A623] text-white hover:bg-[#F5A623]/90 shadow-lg"
                      : "bg-[#F5A623] text-white hover:bg-[#F5A623]/90 shadow-md"
                  }`}
                >
                  Choose {p.name}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
