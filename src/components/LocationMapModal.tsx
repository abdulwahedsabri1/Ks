import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Search, Check, Loader2, Compass, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchExactLocationFromCoords,
  searchLocations,
  ExactLocationResult,
  LocationSearchResult,
} from "@/lib/locationHelper";

interface LocationMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLat?: number;
  initialLng?: number;
  onSelectLocation: (result: ExactLocationResult) => void;
}

export function LocationMapModal({
  open,
  onOpenChange,
  initialLat = 17.385044, // Default to Hyderabad coordinates if none provided
  initialLng = 78.486671,
  onSelectLocation,
}: LocationMapModalProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [loading, setLoading] = useState<boolean>(false);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<ExactLocationResult | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const leafletLoadedRef = useRef<boolean>(false);

  // Sync initial props when opened
  useEffect(() => {
    if (open) {
      const targetLat = initialLat || 17.385044;
      const targetLng = initialLng || 78.486671;
      setLat(targetLat);
      setLng(targetLng);
      loadLocationDetails(targetLat, targetLng);
    }
  }, [open, initialLat, initialLng]);

  // Load Leaflet dynamically
  useEffect(() => {
    if (!open) return;

    const loadLeaflet = async () => {
      if ((window as any).L) {
        leafletLoadedRef.current = true;
        initLeafletMap();
        return;
      }

      // Inject Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Inject Leaflet JS
      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          leafletLoadedRef.current = true;
          initLeafletMap();
        };
        document.body.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkInterval);
            leafletLoadedRef.current = true;
            initLeafletMap();
          }
        }, 100);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [open]);

  const initLeafletMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng]);
      }
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Custom Icon
    const customIcon = L.divIcon({
      className: "custom-map-pin-icon",
      html: `<div style="background-color: #f59e0b; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245,158,11,0.5); border: 3px solid #ffffff;">
              <div style="background-color: #ffffff; width: 12px; height: 12px; border-radius: 50%;"></div>
            </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    marker.on("dragend", (e: any) => {
      const newPos = e.target.getLatLng();
      setLat(newPos.lat);
      setLng(newPos.lng);
      loadLocationDetails(newPos.lat, newPos.lng);
    });

    map.on("click", (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      setLat(clickLat);
      setLng(clickLng);
      loadLocationDetails(clickLat, clickLng);
    });

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;

    // Trigger map resize fix inside Radix dialog
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  };

  const loadLocationDetails = async (targetLat: number, targetLng: number) => {
    setLoading(true);
    const result = await fetchExactLocationFromCoords(targetLat, targetLng);
    setSelectedLocation(result);
    setLoading(false);
  };

  const updateMapPosition = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    if (mapInstanceRef.current && (window as any).L) {
      mapInstanceRef.current.setView([newLat, newLng], 17);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([newLat, newLng]);
      }
    }
    loadLocationDetails(newLat, newLng);
  };

  const handleGetCurrentGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("GPS Geolocation is not supported by your browser");
      return;
    }

    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: gpsLat, longitude: gpsLng } = position.coords;
        updateMapPosition(gpsLat, gpsLng);
        setLocatingGps(false);
        toast.success("Exact GPS location pinned!");
      },
      (err) => {
        setLocatingGps(false);
        console.warn("GPS error:", err);
        toast.error("Could not capture exact GPS. Please select location on map.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchLocations(query);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    setSearchQuery(result.displayName);
    setSearchResults([]);
    updateMapPosition(result.latitude, result.longitude);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onOpenChange(false);
      toast.success("Exact location attached successfully!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-zinc-950 text-white border-zinc-800">
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b border-zinc-800">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
            <Compass className="size-5 text-amber-400" />
            Pinpoint Exact Delivery Location
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Drag the marker or tap anywhere on the map to select your exact building, gate, or address.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex-1 flex flex-col space-y-3 overflow-y-auto">
          {/* Search Box */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
                <Input
                  placeholder="Search street, area, building, landmark..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-amber-500"
                />
                {searching && <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-amber-400" />}
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleGetCurrentGps}
                disabled={locatingGps}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shrink-0 text-xs h-9 px-3"
              >
                {locatingGps ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : (
                  <Navigation className="size-3.5 mr-1" />
                )}
                {locatingGps ? "Locating..." : "Use GPS"}
              </Button>
            </div>

            {/* Search Suggestions dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-11 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 transition flex items-start gap-2 border-b border-zinc-800 last:border-b-0"
                  >
                    <MapPin className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{item.displayName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[260px] sm:h-[300px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Instruction Overlay */}
            <div className="absolute top-2 left-2 z-20 bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow">
              <MapPin className="size-3" />
              <span>Drag pin or click map to move</span>
            </div>

            {loading && (
              <div className="absolute inset-0 z-30 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center">
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-amber-400 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg">
                  <Loader2 className="size-4 animate-spin" />
                  Fetching exact place details...
                </div>
              </div>
            )}
          </div>

          {/* Selected Address Preview Box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Selected Location Name
                  </span>
                  <p className="text-sm font-bold text-zinc-100 leading-snug">
                    {selectedLocation?.address || "Locating exact address..."}
                  </p>
                </div>
              </div>
            </div>

            {(selectedLocation?.city || selectedLocation?.pincode) && (
              <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 border-t border-zinc-800/60">
                {selectedLocation.city && (
                  <span>
                    City: <strong className="text-zinc-200">{selectedLocation.city}</strong>
                  </span>
                )}
                {selectedLocation.pincode && (
                  <span>
                    Pincode: <strong className="text-zinc-200">{selectedLocation.pincode}</strong>
                  </span>
                )}
                <span className="ml-auto text-[10px] text-emerald-400 font-mono">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirmLocation}
            disabled={!selectedLocation || loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold px-5"
          >
            <Check className="size-4 mr-1.5" />
            Confirm Exact Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
