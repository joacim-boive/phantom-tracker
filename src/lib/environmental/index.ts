import type { Coordinates, EnvironmentalData } from "@/types";
import { fetchGeomagneticData } from "./geomagnetic";
import { calculateLunarData } from "./lunar";
import { fetchSolarData } from "./solar";
import { calculateTemporalData } from "./temporal";
import { fetchTidalData } from "./tidal";
import { fetchWeatherData } from "./weather";

/**
 * Fetch all environmental data for a given location
 */
export async function fetchAllEnvironmentalData(
  coords: Coordinates,
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
    location_name: weather.location_name,
  };
}

export { fetchGeomagneticData } from "./geomagnetic";
export { calculateLunarData } from "./lunar";
export { fetchSolarData } from "./solar";
export { calculateTemporalData } from "./temporal";
export { fetchTidalData } from "./tidal";
export { fetchWeatherData } from "./weather";
