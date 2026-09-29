import { ReverseGeocodeResult } from "@/types/address";

/**
 * Reverse geocode latitude and longitude coordinates into Indian address components.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const roundedLat = Number(latitude.toFixed(6));
  const roundedLon = Number(longitude.toFixed(6));
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${roundedLat},${roundedLon}`;

  const defaultResult: ReverseGeocodeResult = {
    latitude: roundedLat,
    longitude: roundedLon,
    googleMapsUrl: mapsUrl,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLon}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "SaiSrujanaSareeStore/1.0 (contact@saisrujana.com)",
          "Accept-Language": "en-IN,en",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;

        const houseNo =
          addr.house_number ||
          addr.building ||
          addr.flat ||
          addr.house_name ||
          "";

        const street =
          addr.road ||
          addr.street ||
          addr.residential ||
          addr.pedestrian ||
          addr.suburb ||
          "";

        const area =
          addr.neighbourhood ||
          addr.suburb ||
          addr.subdistrict ||
          addr.locality ||
          "";

        const landmark =
          addr.amenity ||
          addr.landmark ||
          addr.place ||
          addr.commercial ||
          "";

        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.city_district ||
          "Armoor";

        const district =
          addr.county ||
          addr.state_district ||
          addr.district ||
          "Nizamabad";

        const state =
          addr.state ||
          "Telangana";

        const pincode =
          addr.postcode ? addr.postcode.replace(/[^0-9]/g, "").slice(0, 6) : "";

        const formatted =
          data.display_name ||
          [houseNo, street, area, city, district, state, pincode]
            .filter(Boolean)
            .join(", ");

        return {
          houseNo: houseNo || undefined,
          street: street || undefined,
          area: area || undefined,
          landmark: landmark || undefined,
          city: city || undefined,
          district: district || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
          formattedAddress: formatted,
          latitude: roundedLat,
          longitude: roundedLon,
          googleMapsUrl: mapsUrl,
        };
      }
    }
  } catch (err) {
    console.warn("Reverse geocoding network error (using coordinate fallback):", err);
  }

  return defaultResult;
}

/**
 * Request high-accuracy GPS coordinates using browser navigator.geolocation.
 */
export function getCurrentBrowserCoordinates(
  options: {
    timeoutMs?: number;
  } = {}
): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (
          isNaN(lat) ||
          isNaN(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180
        ) {
          reject(new Error("Invalid GPS coordinates received from device."));
          return;
        }

        resolve({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lon.toFixed(6)),
        });
      },
      (error) => {
        let msg = "Could not detect your current location.";
        if (error.code === 1) {
          msg = "Location permission was denied. Please allow location access in your browser or device settings.";
        } else if (error.code === 2) {
          msg = "Location is currently unavailable on your device. Please try again or enter your address manually.";
        } else if (error.code === 3) {
          msg = "Location request timed out. Please retry.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: options.timeoutMs || 15000,
        maximumAge: 0, // Never use cached/stale coordinates
      }
    );
  });
}
