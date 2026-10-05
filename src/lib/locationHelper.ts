export interface ExactLocationResult {
  address: string;
  city: string;
  pincode: string;
  placeName: string;
  gpsLink: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface LocationSearchResult {
  displayName: string;
  latitude: number;
  longitude: number;
  city?: string;
  pincode?: string;
}

/**
 * Perform high-precision reverse geocoding using OpenStreetMap Nominatim first,
 * with zoom=18 and address details for house/building, street, landmark, area, city, pincode.
 */
export async function fetchExactLocationFromCoords(
  latitude: number,
  longitude: number
): Promise<ExactLocationResult> {
  const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  // 1. Try Nominatim (OpenStreetMap reverse geocode - zoom 18 for maximum precision)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const addr = data.address || {};

        // Exact building, shop, amenity, landmark, house name/number
        const placeName =
          data.name ||
          addr.building ||
          addr.amenity ||
          addr.shop ||
          addr.office ||
          addr.tourism ||
          addr.landmark ||
          addr.house_name ||
          "";

        const houseNum = addr.house_number ? `Door/House #${addr.house_number}` : "";
        const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.highway || "";
        const subArea =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.residential ||
          addr.colony ||
          addr.city_district ||
          addr.subdistrict ||
          "";

        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.county ||
          "";

        const state = addr.state || "";
        const pincode = addr.postcode || "";

        // Build exact detailed address string
        const parts = [placeName, houseNum, road, subArea].filter(Boolean);
        let formattedAddress = parts.join(", ");

        if (!formattedAddress && data.display_name) {
          formattedAddress = data.display_name;
        } else if (formattedAddress) {
          if (city && !formattedAddress.toLowerCase().includes(city.toLowerCase())) {
            formattedAddress += `, ${city}`;
          }
          if (state && !formattedAddress.toLowerCase().includes(state.toLowerCase())) {
            formattedAddress += `, ${state}`;
          }
        }

        if (formattedAddress) {
          return {
            address: formattedAddress,
            city: city || "",
            pincode: pincode || "",
            placeName: placeName || formattedAddress.split(",")[0] || "",
            gpsLink: mapUrl,
            latitude,
            longitude,
            displayName: data.display_name || formattedAddress,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error:", err);
  }

  // 2. Fallback to BigDataCloud reverse geocode client
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const city = data.city || data.locality || data.principalSubdivision || "";
        const pincode = data.postcode || "";
        const parts = [data.locality, data.city, data.principalSubdivision].filter(Boolean);
        const streetAddress = parts.length > 0 ? parts.join(", ") : `GPS Pin (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;

        return {
          address: streetAddress,
          city,
          pincode,
          placeName: data.locality || city,
          gpsLink: mapUrl,
          latitude,
          longitude,
          displayName: streetAddress,
        };
      }
    }
  } catch (err) {
    console.warn("BigDataCloud fallback failed:", err);
  }

  return {
    address: `GPS Pin (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
    city: "",
    pincode: "",
    placeName: "GPS Location",
    gpsLink: mapUrl,
    latitude,
    longitude,
    displayName: `GPS Pin (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
  };
}

/**
 * Search locations via Nominatim API for map search autocomplete
 */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        displayName: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || "",
        pincode: item.address?.postcode || "",
      }));
    }
  } catch (err) {
    console.warn("Search location error:", err);
  }
  return [];
}
