// Pain entry types
export interface PainPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  regionId?: string; // The unique ID of the selected foot region/block
}

export interface PainEntry {
  id: string;
  created_at: string;
  updated_at: string;
  pain_point_x: number;
  pain_point_y: number;
  pain_point_z: number;
  pain_point_name: string | null;
  pain_level: number;
  environmental_data: EnvironmentalData;
  latitude: number | null;
  longitude: number | null;
  user_id: string | null;
}

export interface CreatePainEntry {
  pain_point_x: number;
  pain_point_y: number;
  pain_point_z: number;
  pain_point_name: string | null;
  pain_level: number;
  environmental_data: EnvironmentalData;
  latitude: number | null;
  longitude: number | null;
}

// Environmental data types
export interface EnvironmentalData {
  weather: WeatherData | null;
  lunar: LunarData;
  geomagnetic: GeomagneticData | null;
  solar: SolarData | null;
  tidal: TidalData | null;
  temporal: TemporalData;
  location_name: string | null;
}

export interface WeatherData {
  temperature: number;
  feels_like: number;
  pressure: number;
  pressure_trend: "rising" | "falling" | "stable";
  pressure_change_3h: number;
  humidity: number;
  weather_condition: string;
  weather_description: string;
  wind_speed: number;
  clouds: number;
  visibility: number;
  aqi: number | null;
  aqi_label: string | null;
  location_name: string | null;
}

export interface LunarData {
  phase: string;
  phase_name: string;
  illumination: number;
  distance_km: number;
  distance_trend: "approaching" | "receding";
  age_days: number;
}

export interface GeomagneticData {
  kp_index: number;
  kp_label: string;
  storm_level: string;
  solar_wind_speed: number | null;
}

export interface SolarData {
  xray_flux: string | null;
  xray_class: string | null;
  flare_probability_24h: number | null;
}

export interface TidalData {
  current_height_m: number;
  next_high: string;
  next_low: string;
  tidal_phase: "rising" | "falling" | "high" | "low";
}

export interface TemporalData {
  day_length_hours: number;
  sunrise: string;
  sunset: string;
  days_since_solstice: number;
}

// Foot region types
export interface FootRegion {
  id: string;
  name: string;
  center: { x: number; y: number; z: number };
  radius: number;
}

// Schematic foot block definition
export interface FootBlock {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
}

// Correlation types
export interface CorrelationInsight {
  id: string;
  type: "pressure" | "lunar" | "geomagnetic" | "solar" | "tidal" | "temporal";
  title: string;
  description: string;
  confidence: number;
  icon: string;
}

// Dashboard stats
export interface DashboardStats {
  totalEntries: number;
  averagePainLevel: number;
  mostAffectedRegion: string;
  mostAffectedPercentage: number;
  entriesLast30Days: number;
}

// Geolocation
export interface Coordinates {
  latitude: number;
  longitude: number;
}
