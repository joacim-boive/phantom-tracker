import type { GeomagneticData } from "@/types";

// NOAA Space Weather Prediction Center API
const NOAA_KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";

// Kp index labels
const KP_LABELS: Record<number, string> = {
  0: "Quiet",
  1: "Quiet",
  2: "Quiet",
  3: "Unsettled",
  4: "Active",
  5: "Minor Storm",
  6: "Moderate Storm",
  7: "Strong Storm",
  8: "Severe Storm",
  9: "Extreme Storm",
};

// Storm levels based on Kp index
function getStormLevel(kp: number): string {
  if (kp < 5) return "G0";
  if (kp === 5) return "G1";
  if (kp === 6) return "G2";
  if (kp === 7) return "G3";
  if (kp === 8) return "G4";
  return "G5";
}

/**
 * Fetch geomagnetic data from NOAA Space Weather Prediction Center
 */
export async function fetchGeomagneticData(): Promise<GeomagneticData> {
  try {
    const response = await fetch(NOAA_KP_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Data format: [["time_tag", "Kp", "a_running", "station_count"], ...]
    // Skip header row and get the latest entry
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error("Invalid NOAA data format");
    }

    const latestEntry = data[data.length - 1];
    const kp_index = Math.round(parseFloat(latestEntry[1]));
    
    return {
      kp_index,
      kp_label: KP_LABELS[kp_index] ?? "Unknown",
      storm_level: getStormLevel(kp_index),
      solar_wind_speed: null, // Would need separate API call
    };
  } catch (error) {
    console.error("Failed to fetch geomagnetic data:", error);
    return getMockGeomagneticData();
  }
}

function getMockGeomagneticData(): GeomagneticData {
  return {
    kp_index: 2,
    kp_label: "Quiet",
    storm_level: "G0",
    solar_wind_speed: null,
  };
}

/**
 * Get Kp index color class
 */
export function getKpColorClass(kp: number): string {
  if (kp <= 2) return "text-emerald-500";
  if (kp <= 4) return "text-amber-500";
  if (kp <= 6) return "text-orange-500";
  return "text-rose-500";
}
