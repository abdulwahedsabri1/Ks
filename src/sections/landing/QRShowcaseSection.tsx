import { motion } from "framer-motion";
import { QrCode, Download, Share2, ScanLine, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function QRShowcaseSection() {
  return (
    <section
      id="showcase"
      className="bg-[#18120D] py-24 md:py-32 overflow-hidden border-t border-white/5"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Interactive QR builder mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />

            <div className="relative bg-[#100C09] rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-xl font-medium">QR Customizer</h3>
                <div className="flex gap-2">
                  <div className="size-3 rounded-full bg-red-500/50" />
                  <div className="size-3 rounded-full bg-yellow-500/50" />
                  <div className="size-3 rounded-full bg-green-500/50" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                {/* QR Preview */}
                <div className="bg-white rounded-2xl p-6 aspect-square flex items-center justify-center relative group">
                  <div className="absolute inset-0 border-4 border-primary/0 rounded-2xl transition-colors group-hover:border-primary/50" />
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://myqr.link/demo&color=3A2818&bgcolor=FFFFFF`}
                    alt="Custom QR Code Preview"
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                  {/* Fake Logo Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1 rounded-md shadow-sm">
                      <div className="size-8 bg-[#3A2818] rounded flex items-center justify-center">
                        <span className="text-[#FFC45A] font-display font-bold text-xs">M</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                      Foreground Color
                    </label>
                    <div className="flex gap-2">
                      {["#3A2818", "#100C09", "#F5A623", "#2563EB"].map((color, i) => (
                        <div
                          key={i}
                          className={`size-8 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-[#100C09] ${i === 0 ? "ring-primary" : "ring-transparent"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                      Logo in Center
                    </label>
                    <div className="h-12 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 justify-between cursor-pointer hover:bg-white/10 transition-colors">
                      <span className="text-sm">logo_dark.png</span>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Uploaded
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                      QR Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-10 bg-primary/20 border border-primary/50 rounded-lg flex items-center justify-center text-sm font-medium text-primary">
                        Rounded
                      </div>
                      <div className="h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                        Square
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-6 -right-6 glass-card p-4 rounded-2xl flex items-center gap-4 border border-white/10"
            >
              <div className="size-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                <ScanLine className="size-6" />
              </div>
              <div>
                <p className="font-display font-medium">Scan anywhere</p>
                <p className="text-xs text-muted-foreground">Works natively on iOS & Android</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6">
              Create QR codes <br />
              <span className="italic text-primary">people want to scan</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Generate beautiful, branded QR codes that blend perfectly with your physical
              environment. Download them in high resolution for table tents, stickers, or
              billboards.
            </p>

            <ul className="space-y-6 mb-10">
              {[
                {
                  icon: Palette,
                  title: "Fully customizable",
                  text: "Match your exact brand colors and upload your logo.",
                },
                {
                  icon: Download,
                  title: "Print-ready exports",
                  text: "Download in SVG, PNG, or PDF formats in ultra-high resolution.",
                },
                {
                  icon: Share2,
                  title: "Dynamic routing",
                  text: "Update where the QR code points without ever reprinting.",
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="size-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-lg mb-1">{item.title}</h4>
                    <p className="text-muted-foreground">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link to="/auth">
              <Button
                size="lg"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Try the QR Builder
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
