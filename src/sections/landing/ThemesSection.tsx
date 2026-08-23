import { motion } from "framer-motion";
import { Sparkles, Palette, LayoutTemplate } from "lucide-react";

const themes = [
  {
    id: "luxury",
    name: "Luxury Dark",
    description: "Perfect for fine dining and premium services.",
    color: "bg-[#100C09]",
    accent: "bg-[#FFC45A]",
    card: "bg-white/10",
    line: "bg-white/20",
    style: "rounded-sm",
  },
  {
    id: "minimal",
    name: "Minimalist Light",
    description: "Clean, airy, and modern. Great for cafes.",
    color: "bg-[#F5F0E7]",
    accent: "bg-[#100C09]",
    card: "bg-white",
    line: "bg-black/10",
    style: "rounded-2xl",
  },
  {
    id: "warm_amber",
    name: "Warm Amber",
    description: "Inviting and elegant, perfect for retail.",
    color: "bg-[#FFFAF5]",
    accent: "bg-[#D99A2B]",
    card: "bg-white shadow-sm border border-[#D99A2B]/15",
    line: "bg-[#D99A2B]/20",
    style: "rounded-xl",
  },
];

export function ThemesSection() {
  return (
    <section className="bg-[#F5F0E7] py-24 md:py-32 relative overflow-hidden text-[#100C09]">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-4 py-2 text-sm text-[#3A2818] backdrop-blur-sm mb-6">
              <Palette className="size-4 text-primary" />
              <span>Pixel-perfect customization</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-6">
              Match your brand <br className="hidden sm:block" />
              <span className="italic text-primary">perfectly</span>
            </h2>
            <p className="text-lg text-[#3A2818]/70">
              Don't settle for generic PDFs. Use our powerful theme engine to customize colors,
              typography, border radius, and layouts to perfectly align with your brand identity.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group relative"
            >
              {/* Theme Card Preview */}
              <div className="aspect-[4/5] w-full bg-white rounded-3xl border border-black/5 shadow-xl p-6 flex flex-col items-center justify-center overflow-hidden relative mb-6">
                <div
                  className={`absolute inset-0 ${theme.color} opacity-20 transition-opacity group-hover:opacity-40`}
                />

                {/* Mock UI inside theme */}
                <div
                  className={`w-3/4 aspect-[9/19] ${theme.color} ${theme.style} shadow-2xl relative p-4 flex flex-col gap-4 border border-white/10 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-4`}
                >
                  <div className={`w-1/2 h-4 ${theme.accent} rounded-full opacity-80`} />
                  <div className="space-y-2 mt-4">
                    <div
                      className={`w-full h-12 ${theme.card} ${theme.style} flex items-center px-3 gap-3`}
                    >
                      <div className={`size-8 ${theme.accent} ${theme.style} opacity-80`} />
                      <div className={`h-2 w-1/2 ${theme.line} rounded-full`} />
                    </div>
                    <div
                      className={`w-full h-12 ${theme.card} ${theme.style} flex items-center px-3 gap-3`}
                    >
                      <div className={`size-8 ${theme.accent} ${theme.style} opacity-80`} />
                      <div className={`h-2 w-1/2 ${theme.line} rounded-full`} />
                    </div>
                  </div>
                  <div
                    className={`mt-auto w-full h-10 ${theme.accent} ${theme.style} opacity-90`}
                  />
                </div>
              </div>

              <h3 className="font-display text-2xl font-semibold mb-2">{theme.name}</h3>
              <p className="text-[#3A2818]/70">{theme.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
