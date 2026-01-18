import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Coordinates } from "@/types";
import type { HistoricalWeatherPoint } from "./history";

/**
 * Generate a location key from coordinates
 * Rounds to 2 decimal places (~1km precision) for cache sharing
 */
export function getLocationKey(coords: Coordinates): string {
  const lat = Math.round(coords.latitude * 100) / 100;
  const lon = Math.round(coords.longitude * 100) / 100;
  return `${lat},${lon}`;
}

/**
 * Parse a location key back to coordinates
 */
export function parseLocationKey(key: string): Coordinates {
  const [lat, lon] = key.split(",").map(Number);
  return { latitude: lat, longitude: lon };
}

interface WeatherCacheRow {
  location_key: string;
  date: string;
  temperature: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  weather_description: string | null;
  clouds: number | null;
}

/**
 * Get cached weather data for a location and date range
 * Returns a map of date -> weather data for quick lookup
 */
export async function getCachedWeather(
  locationKey: string,
  dates: string[]
): Promise<Map<string, HistoricalWeatherPoint>> {
  const cache = new Map<string, HistoricalWeatherPoint>();

  if (!isSupabaseConfigured() || !supabase) {
    return cache;
  }

  try {
    const { data, error } = await supabase
      .from("weather_cache")
      .select("*")
      .eq("location_key", locationKey)
      .in("date", dates);

    if (error) {
      console.error("Failed to fetch from weather cache:", error);
      return cache;
    }

    if (data) {
      for (const row of data as WeatherCacheRow[]) {
        cache.set(row.date, {
          date: row.date,
          timestamp: new Date(row.date).getTime() / 1000,
          temperature: row.temperature,
          feels_like: row.feels_like,
          pressure: row.pressure,
          humidity: row.humidity,
          wind_speed: row.wind_speed,
          weather_description: row.weather_description ?? "unknown",
          clouds: row.clouds ?? 0,
        });
      }
    }
  } catch (error) {
    console.error("Weather cache lookup error:", error);
  }

  return cache;
}

/**
 * Store weather data in the cache
 * Uses upsert to handle conflicts gracefully
 */
export async function cacheWeatherData(
  locationKey: string,
  data: HistoricalWeatherPoint[]
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase || data.length === 0) {
    return;
  }

  try {
    const rows = data.map((point) => ({
      location_key: locationKey,
      date: point.date,
      temperature: point.temperature,
      feels_like: point.feels_like,
      pressure: point.pressure,
      humidity: point.humidity,
      wind_speed: point.wind_speed,
      weather_description: point.weather_description,
      clouds: point.clouds,
    }));

    const { error } = await supabase
      .from("weather_cache")
      .upsert(rows, { 
        onConflict: "location_key,date",
        ignoreDuplicates: true 
      });

    if (error) {
      console.error("Failed to cache weather data:", error);
    } else {
      console.log(`[Weather Cache] Stored ${rows.length} entries for ${locationKey}`);
    }
  } catch (error) {
    console.error("Weather cache write error:", error);
  }
}

/**
 * Check how many dates are already cached
 * Useful for logging/debugging
 */
export async function getCacheStats(
  locationKey: string
): Promise<{ count: number; oldestDate: string | null; newestDate: string | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { count: 0, oldestDate: null, newestDate: null };
  }

  try {
    const { data, error } = await supabase
      .from("weather_cache")
      .select("date")
      .eq("location_key", locationKey)
      .order("date", { ascending: true });

    if (error || !data || data.length === 0) {
      return { count: 0, oldestDate: null, newestDate: null };
    }

    return {
      count: data.length,
      oldestDate: data[0].date,
      newestDate: data[data.length - 1].date,
    };
  } catch {
    return { count: 0, oldestDate: null, newestDate: null };
  }
}
