import type { TidalData } from "@/types";

// Default NOAA tide station (can be configured via env)
const DEFAULT_STATION_ID = process.env.NOAA_TIDE_STATION_ID ?? "9414290"; // San Francisco

const NOAA_TIDES_BASE_URL = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

/**
 * Fetch tidal data from NOAA CO-OPS
 */
export async function fetchTidalData(): Promise<TidalData | null> {
  try {
    const now = new Date();
    const beginDate = formatDate(now);
    const endDate = formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)); // +24 hours
    
    // Fetch current water level and predictions
    const [waterLevelRes, predictionsRes] = await Promise.all([
      fetch(
        `${NOAA_TIDES_BASE_URL}?station=${DEFAULT_STATION_ID}&product=water_level&datum=MLLW&units=metric&time_zone=gmt&format=json&date=latest`,
        { next: { revalidate: 900 } } // Cache for 15 minutes
      ),
      fetch(
        `${NOAA_TIDES_BASE_URL}?station=${DEFAULT_STATION_ID}&product=predictions&datum=MLLW&units=metric&time_zone=gmt&format=json&begin_date=${beginDate}&end_date=${endDate}&interval=hilo`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      ),
    ]);

    if (!waterLevelRes.ok || !predictionsRes.ok) {
      throw new Error("NOAA Tides API error");
    }

    const waterLevelData = await waterLevelRes.json();
    const predictionsData = await predictionsRes.json();

    // Parse current water level
    const currentHeight = waterLevelData.data?.[0]?.v 
      ? parseFloat(waterLevelData.data[0].v) 
      : 0;

    // Parse high/low predictions
    const predictions = predictionsData.predictions ?? [];
    const upcomingHigh = predictions.find((p: { type: string }) => p.type === "H");
    const upcomingLow = predictions.find((p: { type: string }) => p.type === "L");

    // Determine tidal phase
    const tidal_phase = determineTidalPhase(predictions);

    return {
      current_height_m: Math.round(currentHeight * 100) / 100,
      next_high: upcomingHigh?.t ? formatToISO(upcomingHigh.t) : "",
      next_low: upcomingLow?.t ? formatToISO(upcomingLow.t) : "",
      tidal_phase,
    };
  } catch (error) {
    console.error("Failed to fetch tidal data:", error);
    return null;
  }
}

/**
 * Format date for NOAA API (YYYYMMDD)
 */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

/**
 * Convert NOAA time format to ISO
 */
function formatToISO(noaaTime: string): string {
  // NOAA format: "2026-01-17 14:32"
  return new Date(noaaTime.replace(" ", "T") + ":00Z").toISOString();
}

/**
 * Determine tidal phase based on predictions and current height
 */
function determineTidalPhase(
  predictions: Array<{ type: string; t: string; v: string }>
): TidalData["tidal_phase"] {
  if (predictions.length < 2) return "rising";
  
  const now = new Date();
  const nextEvent = predictions.find(p => new Date(p.t.replace(" ", "T") + "Z") > now);
  
  if (!nextEvent) return "rising";
  
  // If next event is high tide, we're rising; if low tide, we're falling
  if (nextEvent.type === "H") return "rising";
  if (nextEvent.type === "L") return "falling";
  
  return "rising";
}

/**
 * Get tidal phase icon
 */
export function getTidalPhaseIcon(phase: TidalData["tidal_phase"]): string {
  const icons: Record<TidalData["tidal_phase"], string> = {
    rising: "↗️",
    falling: "↘️",
    high: "⬆️",
    low: "⬇️",
  };
  return icons[phase];
}
