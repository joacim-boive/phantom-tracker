import type { EnvironmentalData, Coordinates } from "@/types";
import { fetchWeatherData } from "./weather";
import { calculateLunarData } from "./lunar";
import { fetchGeomagneticData } from "./geomagnetic";
import { fetchSolarData } from "./solar";
import { fetchTidalData } from "./tidal";
import { calculateTemporalData } from "./temporal";

/**
 * Fetch all environmental data for a given location
 */
export async function fetchAllEnvironmentalData(
  coords: Coordinates
): Promise<EnvironmentalData> {
  const now = new Date();
  
  // Fetch all data in parallel for performance
  const [weather, geomagnetic, solar, tidal] = await Promise.all([
    fetchWeatherData(coords),
    fetchGeomagneticData(),
    fetchSolarData(),
    fetchTidalData(),
  ]);

  // Calculate local data (no API needed)
  const lunar = calculateLunarData(now);
  const temporal = calculateTemporalData(now, coords);

  return {
    weather,
    lunar,
    geomagnetic,
    solar,
    tidal,
    temporal,
  };
}

export { fetchWeatherData } from "./weather";
export { calculateLunarData } from "./lunar";
export { fetchGeomagneticData } from "./geomagnetic";
export { fetchSolarData } from "./solar";
export { fetchTidalData } from "./tidal";
export { calculateTemporalData } from "./temporal";
