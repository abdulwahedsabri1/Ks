import { useState } from "react";
import {
  Instagram,
  Heart,
  Play,
  Volume2,
  VolumeX,
  ExternalLink,
  Grid,
  Film,
  CheckCircle2,
  UserPlus,
  QrCode,
  Sparkles,
} from "lucide-react";

export interface InstagramReelItem {
  id: string;
  videoUrl: string;
  views: string;
  likes: string;
  caption: string;
  tag: string;
}

const INSTAGRAM_REELS: InstagramReelItem[] = [
  {
    id: "reel-1",
    videoUrl: "/mock/Visual_Show_different_busines.mp4",
    views: "12.4K",
    likes: "1,240",
    caption:
      "Transform any business into a premium digital experience! 🚀 #mylinkqr #qrorder #restauranttech",
    tag: "Featured Reel",
  },
  {
    id: "reel-2",
    videoUrl: "/mock/kj.mp4",
    views: "8.9K",
    likes: "942",
    caption:
      "'Nobody care about your Small business posts' — Until you offer instant QR ordering! 💡",
    tag: "Growth Reel",
  },
  {
    id: "reel-3",
    videoUrl: "/mock/dsf.mp4",
    views: "15.8K",
    likes: "2,180",
    caption:
      "Restaurant Owner & AI Dashboard in action! Convert paper menus in seconds with AI OCR 📄⚡",
    tag: "Dashboard",
  },
  {
    id: "reel-4",
    videoUrl: "/mock/Mylinkqr.mp4",
    views: "6.7K",
    likes: "730",
    caption: "Sub-second touch speed on any smartphone browser. Zero app install needed! 📱🔥",
    tag: "Mobile UX",
  },
  {
    id: "reel-5",
    videoUrl: "/mock/Visual_Show_different_busines.mp4",
    views: "11.2K",
    likes: "1,050",
    caption: "Multi-theme catalog for Cafes, Beauty Salons, Spas & Retail stores ✨",
    tag: "Showcase",
  },
  {
    id: "reel-6",
    videoUrl: "/mock/kj.mp4",
    views: "14.1K",
    likes: "1,890",
    caption: "How customers order food directly via WhatsApp in 3 simple steps 🛒💬",
    tag: "WhatsApp Cart",
  },
];

export function InstagramProfileFeed() {
  const [activeTab, setActiveTab] = useState<"reels" | "posts">("reels");
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({
    "reel-1": true,
    "reel-2": true,
    "reel-3": true,
    "reel-4": true,
    "reel-5": true,
    "reel-6": true,
  });

  const toggleMute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedStates((prev) => ({ ...prev, [id]: !prev[id] }));
    const video = document.getElementById(`inst-video-${id}`) as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-pink-500/30 bg-card/95 p-4 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Instagram Profile Header Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-5 pb-6 border-b border-border">
        {/* Profile Avatar with Gold Glowing Ring */}
        <div className="relative group shrink-0">
          <div className="size-24 sm:size-28 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-1 shadow-lg">
            <div className="w-full h-full bg-black rounded-full p-1 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-pink-600/30 rounded-full flex flex-col items-center justify-center text-amber-400">
                <QrCode className="size-10 text-amber-400 animate-pulse" />
                <span className="text-[9px] font-extrabold text-white tracking-tighter uppercase mt-0.5">
                  MY Link QR
                </span>
              </div>
            </div>
          </div>
          <span className="absolute bottom-1 right-1 size-6 rounded-full bg-pink-600 text-white flex items-center justify-center border-2 border-background shadow-md">
            <Instagram className="size-3.5" />
          </span>
        </div>

        {/* Profile Info Details */}
        <div className="flex-1 text-center md:text-left space-y-3">
          {/* Top Bar: Handle, Verified, Follow Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              mylinkqr
              <CheckCircle2 className="size-4 fill-sky-500 text-white" />
            </h2>
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/mylinkqr"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-md flex items-center gap-1.5"
              >
                <UserPlus className="size-3.5" /> Follow
              </a>
              <a
                href="https://instagram.com/mylinkqr"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors flex items-center gap-1.5"
              >
                Message
              </a>
            </div>
          </div>

          {/* Followers Stats */}
          <div className="flex items-center justify-center md:justify-start gap-6 text-xs sm:text-sm text-foreground">
            <div>
              <span className="font-bold">11</span>{" "}
              <span className="text-muted-foreground">posts</span>
            </div>
            <div>
              <span className="font-bold">77</span>{" "}
              <span className="text-muted-foreground">followers</span>
            </div>
            <div>
              <span className="font-bold">19</span>{" "}
              <span className="text-muted-foreground">following</span>
            </div>
          </div>

          {/* Bio Text (Exact lines from official Instagram screenshot) */}
          <div className="space-y-1 text-xs text-foreground/90 leading-relaxed font-medium">
            <p className="font-bold text-foreground">My Link Qr</p>
            <p>🚀 Your Business. One Smart Link.</p>
            <p>🔗 Menu • Booking • Orders • Services • More</p>
            <p>📌 Turn Your Customers Digital.</p>
            <a
              href="https://instagram.com/mylinkqr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-pink-500 font-bold hover:underline"
            >
              <Instagram className="size-3.5" /> instagram.com/mylinkqr
            </a>
          </div>
        </div>
      </div>

      {/* Story Highlights Bar */}
      <div className="flex items-center gap-4 py-1 overflow-x-auto no-scrollbar border-b border-border">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="size-12 rounded-full p-0.5 border-2 border-pink-500/50">
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-xs">
              <Sparkles className="size-5 text-amber-500" />
            </div>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">Process</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-center gap-8 border-b border-border text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab("reels")}
          className={`py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "reels"
              ? "border-pink-500 text-pink-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Film className="size-4" /> Profile Video Reels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={`py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-pink-500 text-pink-500"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid className="size-4" /> Grid Posts
        </button>
      </div>

      {/* Instagram Reels Video Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INSTAGRAM_REELS.map((reel) => {
          const isMuted = mutedStates[reel.id] ?? true;

          return (
            <div
              key={reel.id}
              className="relative aspect-[9/16] rounded-2xl bg-black overflow-hidden group border border-border/50 hover:border-pink-500/50 transition-all duration-300 shadow-md cursor-pointer"
            >
              {/* HTML5 Video Element */}
              <video
                id={`inst-video-${reel.id}`}
                src={reel.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Reel Tag Badge */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="bg-black/60 backdrop-blur text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                  {reel.tag}
                </span>
              </div>

              {/* Mute Control Top Right */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <button
                  type="button"
                  onClick={(e) => toggleMute(reel.id, e)}
                  className="size-7 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center border border-white/10 hover:bg-black/80 transition-colors"
                >
                  {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                </button>
              </div>

              {/* Bottom Reel Caption & Engagement Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-col justify-end text-white space-y-1 z-10">
                <p className="text-[10px] line-clamp-2 leading-tight font-medium text-white/90">
                  {reel.caption}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-white/80 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Play className="size-3 fill-current text-white" /> {reel.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="size-3 fill-current text-pink-500" /> {reel.likes}
                    </span>
                  </div>
                  <a
                    href="https://instagram.com/mylinkqr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:underline flex items-center gap-0.5"
                  >
                    View <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs text-muted-foreground">
          Follow <strong className="text-foreground">@mylinkqr</strong> for new daily video demos &
          customer highlights!
        </p>
        <a
          href="https://instagram.com/mylinkqr"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-md"
        >
          <Instagram className="size-4" /> Open instagram.com/mylinkqr
        </a>
      </div>
    </div>
  );
}
