/**
 * Script to seed mock pain entries with real historical weather data
 * 
 * This script:
 * - Generates 10 pain entries spread over the past year
 * - Fetches real historical weather data from OpenWeather API
 * - Ensures pain entries correlate with rising temperatures
 * - Generates other environmental data for each date
 * - Inserts entries into the database
 */

// Load environment variables FIRST, before any imports that might use them
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { CreatePainEntry, EnvironmentalData, Coordinates } from "../src/types";
import { calculateLunarData } from "../src/lib/environmental/lunar";
import { calculateTemporalData } from "../src/lib/environmental/temporal";
import { FOOT_BLOCKS } from "../src/lib/foot-regions";
import type { HistoricalWeatherPoint } from "../src/lib/environmental/history";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default coordinates (can be overridden)
const DEFAULT_COORDS: Coordinates = {
  latitude: 37.7749, // San Francisco
  longitude: -122.4194,
};

/**
 * Generate mock environmental data for a given date
 */
function generateEnvironmentalData(
  date: Date,
  coords: Coordinates,
  weatherPoint: HistoricalWeatherPoint | null
): EnvironmentalData {
  // Calculate lunar and temporal data
  const lunar = calculateLunarData(date);
  const temporal = calculateTemporalData(date, coords);

  // Use real weather data if available, otherwise use mock
  const weather = weatherPoint
    ? {
        temperature: weatherPoint.temperature,
        feels_like: weatherPoint.feels_like,
        pressure: weatherPoint.pressure,
        pressure_trend: "stable" as const, // Would need previous day data to determine
        pressure_change_3h: 0,
        humidity: weatherPoint.humidity,
        weather_condition: weatherPoint.weather_description.split(" ")[0] || "Clear",
        weather_description: weatherPoint.weather_description,
        wind_speed: weatherPoint.wind_speed,
        clouds: weatherPoint.clouds,
        visibility: 10000, // Default visibility
        aqi: null,
        aqi_label: null,
        location_name: null,
      }
    : {
        temperature: 15.0,
        feels_like: 14.0,
        pressure: 1013,
        pressure_trend: "stable" as const,
        pressure_change_3h: 0,
        humidity: 65,
        weather_condition: "Clear",
        weather_description: "clear sky",
        wind_speed: 3.5,
        clouds: 20,
        visibility: 10000,
        aqi: null,
        aqi_label: null,
        location_name: null,
      };

  // Mock geomagnetic data (API doesn't provide historical)
  const geomagnetic = {
    kp_index: Math.floor(Math.random() * 5) + 1, // 1-5
    kp_label: ["Quiet", "Quiet", "Unsettled", "Active"][Math.floor(Math.random() * 4)],
    storm_level: "G0",
    solar_wind_speed: null,
  };

  // Mock solar data (API doesn't provide historical)
  const solar = {
    xray_flux: `B${(Math.random() * 5 + 1).toFixed(1)}`,
    xray_class: ["A", "B", "C"][Math.floor(Math.random() * 3)],
    flare_probability_24h: Math.random() * 0.3,
  };

  // Mock tidal data (API doesn't provide historical easily)
  const tidal = {
    current_height_m: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
    next_high: new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString(),
    next_low: new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    tidal_phase: (["rising", "falling", "high", "low"] as const)[Math.floor(Math.random() * 4)],
  };

  return {
    weather,
    lunar,
    geomagnetic,
    solar,
    tidal,
    temporal,
    location_name: null,
  };
}

/**
 * Find dates with rising temperatures
 * Fetches weather data in 90-day batches (API limit)
 */
async function findRisingTemperatureDates(
  coords: Coordinates,
  startDate: Date,
  endDate: Date,
  numEntries: number
): Promise<Array<{ date: Date; weather: HistoricalWeatherPoint; tempIncrease: number }>> {
  // Dynamically import to avoid loading supabase.ts before env vars are set
  const { fetchHistoricalWeatherRange } = await import("../src/lib/environmental/history");
  
  // Fetch historical weather for a range of dates in batches (90 days max per API call)
  console.log("Fetching historical weather data...");
  
  const allWeatherData: HistoricalWeatherPoint[] = [];
  const batchDays = 90;
  const oneDay = 24 * 60 * 60 * 1000;
  
  let currentEnd = endDate;
  let batchNum = 1;
  
  while (currentEnd > startDate) {
    const currentStart = new Date(Math.max(currentEnd.getTime() - batchDays * oneDay, startDate.getTime()));
    
    console.log(`Fetching batch ${batchNum}: ${currentStart.toISOString().split("T")[0]} to ${currentEnd.toISOString().split("T")[0]}`);
    
    const batchData = await fetchHistoricalWeatherRange(coords, currentStart, currentEnd);
    allWeatherData.push(...batchData);
    
    currentEnd = new Date(currentStart.getTime() - oneDay);
    batchNum++;
    
    // Small delay between batches to avoid rate limiting
    if (currentEnd > startDate) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  
  if (allWeatherData.length < 2) {
    console.error("Not enough weather data to find rising temperatures");
    return [];
  }

  // Sort by date
  allWeatherData.sort((a, b) => a.date.localeCompare(b.date));
  console.log(`Fetched ${allWeatherData.length} days of weather data`);

  // Find dates where temperature is rising compared to previous day
  const risingDates: Array<{ date: Date; weather: HistoricalWeatherPoint; tempIncrease: number }> = [];
  
  for (let i = 1; i < allWeatherData.length; i++) {
    const prev = allWeatherData[i - 1];
    const curr = allWeatherData[i];
    
    const tempIncrease = curr.temperature - prev.temperature;
    
    if (tempIncrease > 0) {
      risingDates.push({
        date: new Date(curr.date + "T12:00:00Z"),
        weather: curr,
        tempIncrease,
      });
    }
  }

  console.log(`Found ${risingDates.length} days with rising temperatures`);

  // Sort by temperature increase (descending) and take top entries
  risingDates.sort((a, b) => b.tempIncrease - a.tempIncrease);
  
  // Select entries spread throughout the year
  const selected: Array<{ date: Date; weather: HistoricalWeatherPoint; tempIncrease: number }> = [];
  const step = Math.max(1, Math.floor(risingDates.length / numEntries));
  
  for (let i = 0; i < risingDates.length && selected.length < numEntries; i += step) {
    selected.push({
      date: risingDates[i].date,
      weather: risingDates[i].weather,
      tempIncrease: risingDates[i].tempIncrease,
    });
  }

  // If we don't have enough, fill with remaining top entries
  for (const entry of risingDates) {
    if (selected.length >= numEntries) break;
    if (!selected.find(s => s.date.toISOString().split("T")[0] === entry.date.toISOString().split("T")[0])) {
      selected.push({
        date: entry.date,
        weather: entry.weather,
        tempIncrease: entry.tempIncrease,
      });
    }
  }

  // Sort selected by date
  selected.sort((a, b) => a.date.getTime() - b.date.getTime());

  return selected.slice(0, numEntries);
}

/**
 * Main function to seed mock data
 */
async function seedMockData() {
  console.log("Starting mock data seeding...");

  const coords = DEFAULT_COORDS;
  const numEntries = 10;

  // Calculate date range (past year)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  console.log(`Date range: ${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]}`);

  // Find dates with rising temperatures
  const painDates = await findRisingTemperatureDates(coords, startDate, endDate, numEntries);

  if (painDates.length === 0) {
    console.error("No dates with rising temperatures found");
    process.exit(1);
  }

  console.log(`Found ${painDates.length} dates with rising temperatures`);

  // Generate pain entries
  const entries: CreatePainEntry[] = [];

  for (let i = 0; i < painDates.length; i++) {
    const { date, weather, tempIncrease } = painDates[i];
    
    // Select a random foot region
    const footBlock = FOOT_BLOCKS[Math.floor(Math.random() * FOOT_BLOCKS.length)];
    
    // Generate environmental data
    const environmentalData = generateEnvironmentalData(date, coords, weather);
    
    // Generate pain level (5-9, correlated with temperature increase)
    // Higher temperature increases get higher pain levels
    const basePainLevel = 5;
    const tempIncreaseFactor = Math.min(4, Math.max(0, Math.floor(tempIncrease * 2))); // Scale based on temp increase
    const painLevel = Math.min(9, Math.max(5, basePainLevel + tempIncreaseFactor));

    const entry: CreatePainEntry = {
      pain_point_x: footBlock.position.x,
      pain_point_y: footBlock.position.y,
      pain_point_z: footBlock.position.z,
      pain_point_name: footBlock.name,
      pain_level: painLevel,
      environmental_data: environmentalData,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    entries.push(entry);
    
    console.log(`Generated entry ${i + 1}/${painDates.length} for ${date.toISOString().split("T")[0]} (temp: ${weather.temperature}°C, increase: +${tempIncrease.toFixed(1)}°C, pain: ${painLevel})`);
  }

  // Insert entries into database
  console.log("\nInserting entries into database...");
  
  // Insert in batches to avoid overwhelming the database
  const batchSize = 5;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    // We need to set created_at manually for historical dates
    const entriesWithDates = batch.map((entry, idx) => ({
      ...entry,
      created_at: painDates[i + idx].date.toISOString(),
      updated_at: painDates[i + idx].date.toISOString(),
    }));

    const { error } = await supabase
      .from("pain_entries")
      .insert(entriesWithDates);

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
    } else {
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} entries)`);
    }
  }

  console.log("\n✅ Mock data seeding completed!");
  console.log(`Inserted ${entries.length} pain entries with rising temperature correlation`);
}

// Run the script
seedMockData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
