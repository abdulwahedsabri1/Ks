import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Maximize2,
  Volume2,
  VolumeX,
  Sparkles,
  UtensilsCrossed,
  Building2,
  LayoutDashboard,
  Smartphone,
  CheckCircle2,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VideoSeriesItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  category: "restaurant" | "all-business" | "owner-dashboard" | "mobile";
  videoUrl: string;
  posterUrl?: string;
  accentColor: string; // Tailwind color class or hex
  glowColor: string;
  icon: React.ElementType;
  description: string;
  highlights: string[];
}

export const BUSINESS_VIDEO_SERIES: VideoSeriesItem[] = [
  {
    id: "restaurant-kj",
    title: "Restaurant QR Ordering Experience",
    subtitle: "Diner Guest Scan & WhatsApp Cart Order",
    badge: "Restaurant Video Series",
    category: "restaurant",
    videoUrl: "/mock/Visual_Show_different_busines.mp4",
    posterUrl: "/hero_qr.jpg",
    accentColor: "from-amber-500 to-orange-600",
    glowColor: "rgba(245, 158, 11, 0.25)",
    icon: UtensilsCrossed,
    description:
      "Experience how restaurant diners scan table QR codes, explore rich dish menus with imagery, select item variations, and place instant orders sent directly to staff WhatsApp.",
    highlights: [
      "Zero App Download Required — Instant browser launch",
      "Interactive categorized menu with dish photos & pricing",
      "Item customization & automated WhatsApp cart messaging",
      "Real-time table number transmission",
    ],
  },
  {
    id: "all-business-showcase",
    title: "Multi-Business Showcase Series",
    subtitle: "Restaurants, Cafes, Salons & Retail Outlets",
    badge: "All Business Video",
    category: "all-business",
    videoUrl: "/mock/kj.mp4",
    posterUrl: "/hero_qr.jpg",
    accentColor: "from-emerald-500 to-teal-600",
    glowColor: "rgba(16, 185, 129, 0.25)",
    icon: Building2,
    description:
      "A comprehensive visual walk-through showing how MY Link QR powers restaurants, artisanal cafes, beauty salons, spa centers, and retail stores with tailored aesthetic themes.",
    highlights: [
      "Dynamic multi-industry theme customization",
      "Curated color schemes for high-end brands",
      "Product & service catalog support",
      "Multi-language automatic menu translation",
    ],
  },
  {
    id: "owner-dashboard",
    title: "Restaurant Owner & Staff Dashboard",
    subtitle: "AI Menu Generator, Analytics & QR Print",
    badge: "Admin & AI Dashboard",
    category: "owner-dashboard",
    videoUrl: "/mock/dsf.mp4",
    posterUrl: "/hero_qr.jpg",
    accentColor: "from-cyan-500 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.25)",
    icon: LayoutDashboard,
    description:
      "Watch how business owners easily manage menu items, use AI OCR photo scanning to convert paper menus, track live QR scan analytics, and download print vector QR stands.",
    highlights: [
      "AI OCR paper menu digitizer in seconds",
      "Live scan traffic analytics & customer trends",
      "Print-ready SVG & PNG vector QR stand exports",
      "Instant menu price updates with zero reprint costs",
    ],
  },
  {
    id: "mobile-customer-flow",
    title: "Fast Mobile Ordering View",
    subtitle: "Sub-Second Load & Touch Controls",
    badge: "Mobile View Demo",
    category: "mobile",
    videoUrl: "/mock/Mylinkqr.mp4",
    posterUrl: "/hero_qr.jpg",
    accentColor: "from-purple-500 to-pink-600",
    glowColor: "rgba(168, 85, 247, 0.25)",
    icon: Smartphone,
    description:
      "A fast-paced preview of the mobile user interface designed for maximum conversion and ultra-fast touch response on any smartphone browser.",
    highlights: [
      "Sub-second lightning load speeds",
      "Touch-optimized cart drawer & item selector",
      "Direct phone & location shortcuts",
    ],
  },
];

interface BusinessVideoSeriesProps {
  initialVideoId?: string;
  showTitle?: boolean;
  className?: string;
}

export function BusinessVideoSeries({
  initialVideoId = "restaurant-kj",
  showTitle = true,
  className = "",
}: BusinessVideoSeriesProps) {
  const [activeId, setActiveId] = useState<string>(initialVideoId);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const activeVideo =
    BUSINESS_VIDEO_SERIES.find((v) => v.id === activeId) ?? BUSINESS_VIDEO_SERIES[0]!;

  const handleSelectVideo = (id: string) => {
    setActiveId(id);
    setIsPlaying(true);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById("series-active-video") as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById("series-active-video") as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = document.getElementById("series-active-video") as HTMLVideoElement;
    if (video) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Film className="size-3.5" /> Video Demonstration Series
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Watch Business <span className="text-gradient italic">Video Series</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Select any business series video below to see MY Link QR in action across restaurants, cafes, retail, and owner management dashboards.
          </p>
        </div>
      )}

      {/* Main Video Viewport & Details Container */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8 items-center">
        {/* Video Player Box - Best View Frame */}
        <div className="lg:col-span-8">
          <div
            className="relative rounded-3xl border border-border bg-card shadow-2xl overflow-hidden group transition-all duration-500"
            style={{
              boxShadow: `0 20px 50px -10px ${activeVideo.glowColor}`,
            }}
          >
            {/* Header Status Bar */}
            <div className="bg-card/90 backdrop-blur-md px-5 py-3.5 border-b border-border flex items-center justify-between z-20 relative">
              <div className="flex items-center gap-3">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-foreground truncate">
                  {activeVideo.title}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                {activeVideo.badge}
              </span>
            </div>

            {/* Video Element with Overlay Controls */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                id="series-active-video"
                key={activeVideo.id}
                src={activeVideo.videoUrl}
                poster={activeVideo.posterUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Hover & Center Play Control Overlay */}
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
              >
                <div className="size-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xl backdrop-blur border border-white/20 transform scale-90 group-hover:scale-100 transition-transform">
                  {isPlaying ? (
                    <Pause className="size-7 fill-current" />
                  ) : (
                    <Play className="size-7 fill-current ml-1" />
                  )}
                </div>
              </div>

              {/* Bottom Right Control Bar */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="size-9 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="size-9 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors"
                  title="Full Screen"
                >
                  <Maximize2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Information Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeVideo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl shadow-xl space-y-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-11 rounded-2xl bg-gradient-to-br ${activeVideo.accentColor} text-white flex items-center justify-center shadow-md`}
                >
                  <activeVideo.icon className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Active Series Video
                  </span>
                  <h3 className="font-bold text-lg text-foreground leading-tight">
                    {activeVideo.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeVideo.description}
              </p>

              <div className="border-t border-border pt-4 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" /> Key Feature Highlights
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {activeVideo.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Series Cards Selector Strip */}
      <div className="max-w-6xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BUSINESS_VIDEO_SERIES.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectVideo(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? "bg-card border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20 scale-[1.02]"
                  : "bg-card/40 border-border hover:bg-card/70 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`size-8 rounded-xl flex items-center justify-center ${
                    isActive
                      ? `bg-gradient-to-br ${item.accentColor} text-white`
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                {isActive && (
                  <span className="flex size-2 rounded-full bg-primary animate-ping" />
                )}
              </div>
              <div>
                <p
                  className={`text-xs font-bold truncate ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
