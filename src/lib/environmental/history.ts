import type { Coordinates } from "@/types";
import { 
  getLocationKey, 
  getCachedWeather, 
  cacheWeatherData 
} from "./weather-cache";

export interface HistoricalWeatherPoint {
  date: string;
  timestamp: number;
  temperature: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  wind_speed: number;
  weather_description: string;
  clouds: number;
}

interface OneCallHistoricalResponse {
  data: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    wind_speed: number;
    clouds: number;
    weather: Array<{
      description: string;
    }>;
  }>;
}

/**
 * Fetch historical weather data for a specific date from OpenWeather API
 */
async function fetchFromOpenWeather(
  coords: Coordinates,
  timestamp: number
): Promise<HistoricalWeatherPoint | null> {
  const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
  
  if (!OPENWEATHERMAP_API_KEY) {
    console.warn("OpenWeatherMap API key not set");
    return null;
  }

  try {
    const { latitude, longitude } = coords;
    
    // Use One Call API 3.0 timemachine for historical data
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${timestamp}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.warn("One Call API 3.0 not available");
        return null;
      }
      throw new Error(`Historical weather API error: ${response.status}`);
    }

    const data: OneCallHistoricalResponse = await response.json();
    
    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Get the noon data point or the first available
    const hourlyData = data.data;
    const noonData = hourlyData.find((h) => {
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= 11 && hour <= 13;
    }) || hourlyData[Math.floor(hourlyData.length / 2)];

    const date = new Date(timestamp * 1000);

    return {
      date: date.toISOString().split("T")[0],
      timestamp: noonData.dt,
      temperature: Math.round(noonData.temp * 10) / 10,
      feels_like: Math.round(noonData.feels_like * 10) / 10,
      pressure: noonData.pressure,
      humidity: noonData.humidity,
      wind_speed: Math.round(noonData.wind_speed * 10) / 10,
      weather_description: noonData.weather?.[0]?.description ?? "unknown",
      clouds: noonData.clouds,
    };
  } catch (error) {
    console.error("Failed to fetch historical weather:", error);
    return null;
  }
}

/**
 * Fetch historical weather data for a date range
 * Uses Supabase cache to minimize API calls
 */
export async function fetchHistoricalWeatherRange(
  coords: Coordinates,
  startDate: Date,
  endDate: Date
): Promise<HistoricalWeatherPoint[]> {
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Calculate days to fetch (max 90)
  const maxDays = 90;
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / oneDay);
  const daysToFetch = Math.min(daysDiff, maxDays);
  
  // Generate list of dates we need
  const datesToFetch: string[] = [];
  const timestampsByDate = new Map<string, number>();
  
  for (let i = 0; i < daysToFetch; i++) {
    const date = new Date(endDate.getTime() - i * oneDay);
    date.setUTCHours(12, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    datesToFetch.push(dateStr);
    timestampsByDate.set(dateStr, Math.floor(date.getTime() / 1000));
  }

  // Get location key for cache lookup
  const locationKey = getLocationKey(coords);
  
  // Check cache first
  const cachedData = await getCachedWeather(locationKey, datesToFetch);
  const cachedCount = cachedData.size;
  
  // Find dates that aren't cached
  const uncachedDates = datesToFetch.filter((date) => !cachedData.has(date));
  
  if (cachedCount > 0) {
    console.log(`[Weather Cache] Hit: ${cachedCount}/${datesToFetch.length} dates cached for ${locationKey}`);
  }
  
  // Fetch uncached dates from OpenWeather API
  const newlyFetched: HistoricalWeatherPoint[] = [];
  
  if (uncachedDates.length > 0) {
    console.log(`[Weather Cache] Fetching ${uncachedDates.length} dates from OpenWeather API`);
    
    // Fetch in parallel batches
    const batchSize = 10;
    
    for (let i = 0; i < uncachedDates.length; i += batchSize) {
      const batch = uncachedDates.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((dateStr) => {
          const timestamp = timestampsByDate.get(dateStr);
          if (!timestamp) return Promise.resolve(null);
          return fetchFromOpenWeather(coords, timestamp);
        })
      );
      
      for (const result of batchResults) {
        if (result) {
          newlyFetched.push(result);
        }
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < uncachedDates.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    
    // Cache the newly fetched data
    if (newlyFetched.length > 0) {
      await cacheWeatherData(locationKey, newlyFetched);
    }
  }

  // Combine cached and newly fetched data
  const results: HistoricalWeatherPoint[] = [
    ...Array.from(cachedData.values()),
    ...newlyFetched,
  ];

  // Sort by date ascending
  results.sort((a, b) => a.date.localeCompare(b.date));
  
  return results;
}

// Re-export for backwards compatibility
export async function fetchHistoricalWeather(
  coords: Coordinates,
  timestamp: number
): Promise<HistoricalWeatherPoint | null> {
  return fetchFromOpenWeather(coords, timestamp);
}
