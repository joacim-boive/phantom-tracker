import type { PainEntry } from "@/types";
import {
  Cloud,
  Droplets,
  Gauge,
  Magnet,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type ConditionType =
  | "temperature"
  | "pressure"
  | "humidity"
  | "wind"
  | "lunar"
  | "geomagnetic"
  | "solar"
  | "tidal"
  | "sunrise"
  | "sunset";

export interface ConditionConfig {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  colorClass: string;
  bgClass: string;
  bgIndicator: string;
  unit: string;
  facts: string[];
  getValueFromEntry: (entry: PainEntry) => number | null;
  formatValue: (value: number) => string;
  yAxisDomain?: [number | "auto", number | "auto"];
}

export const conditionConfig: Record<ConditionType, ConditionConfig> = {
  temperature: {
    icon: Thermometer,
    titleKey: "weather.temperature",
    descriptionKey: "conditions.temperature.description",
    colorClass: "text-weather",
    bgClass: "bg-weather/10",
    bgIndicator: "bg-weather",
    unit: "°C",
    facts: [
      "conditions.temperature.fact1",
      "conditions.temperature.fact2",
      "conditions.temperature.fact3",
      "conditions.temperature.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.weather?.temperature ?? null,
    formatValue: (value) => `${value.toFixed(1)}°C`,
    yAxisDomain: ["auto", "auto"],
  },
  pressure: {
    icon: Gauge,
    titleKey: "weather.pressure",
    descriptionKey: "conditions.pressure.description",
    colorClass: "text-weather",
    bgClass: "bg-weather/10",
    bgIndicator: "bg-weather",
    unit: "hPa",
    facts: [
      "conditions.pressure.fact1",
      "conditions.pressure.fact2",
      "conditions.pressure.fact3",
      "conditions.pressure.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.weather?.pressure ?? null,
    formatValue: (value) => `${value} hPa`,
    yAxisDomain: ["auto", "auto"],
  },
  humidity: {
    icon: Droplets,
    titleKey: "weather.humidity",
    descriptionKey: "conditions.humidity.description",
    colorClass: "text-weather",
    bgClass: "bg-weather/10",
    bgIndicator: "bg-weather",
    unit: "%",
    facts: [
      "conditions.humidity.fact1",
      "conditions.humidity.fact2",
      "conditions.humidity.fact3",
      "conditions.humidity.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.weather?.humidity ?? null,
    formatValue: (value) => `${value}%`,
    yAxisDomain: [0, 100],
  },
  wind: {
    icon: Wind,
    titleKey: "weather.wind",
    descriptionKey: "conditions.wind.description",
    colorClass: "text-weather",
    bgClass: "bg-weather/10",
    bgIndicator: "bg-weather",
    unit: "m/s",
    facts: [
      "conditions.wind.fact1",
      "conditions.wind.fact2",
      "conditions.wind.fact3",
      "conditions.wind.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.weather?.wind_speed ?? null,
    formatValue: (value) => `${value.toFixed(1)} m/s`,
    yAxisDomain: [0, "auto"],
  },
  lunar: {
    icon: Moon,
    titleKey: "lunar.title",
    descriptionKey: "conditions.lunar.description",
    colorClass: "text-lunar",
    bgClass: "bg-lunar/10",
    bgIndicator: "bg-lunar",
    unit: "%",
    facts: [
      "conditions.lunar.fact1",
      "conditions.lunar.fact2",
      "conditions.lunar.fact3",
      "conditions.lunar.fact4",
    ],
    getValueFromEntry: (entry) =>
      Math.round(entry.environmental_data.lunar.illumination * 100),
    formatValue: (value) => `${value}%`,
    yAxisDomain: [0, 100],
  },
  geomagnetic: {
    icon: Magnet,
    titleKey: "geomagnetic.title",
    descriptionKey: "conditions.geomagnetic.description",
    colorClass: "text-geomagnetic",
    bgClass: "bg-geomagnetic/10",
    bgIndicator: "bg-geomagnetic",
    unit: "Kp",
    facts: [
      "conditions.geomagnetic.fact1",
      "conditions.geomagnetic.fact2",
      "conditions.geomagnetic.fact3",
      "conditions.geomagnetic.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.geomagnetic?.kp_index ?? null,
    formatValue: (value) => `Kp ${value}`,
    yAxisDomain: [0, 9],
  },
  solar: {
    icon: Sun,
    titleKey: "solar.title",
    descriptionKey: "conditions.solar.description",
    colorClass: "text-solar",
    bgClass: "bg-solar/10",
    bgIndicator: "bg-solar",
    unit: "",
    facts: [
      "conditions.solar.fact1",
      "conditions.solar.fact2",
      "conditions.solar.fact3",
      "conditions.solar.fact4",
    ],
    getValueFromEntry: (entry) => {
      if (!entry.environmental_data.solar) return null;
      const flareProb = entry.environmental_data.solar.flare_probability_24h;
      return flareProb !== null ? flareProb : null;
    },
    formatValue: (value) => `${value}%`,
    yAxisDomain: [0, 100],
  },
  tidal: {
    icon: Waves,
    titleKey: "tidal.title",
    descriptionKey: "conditions.tidal.description",
    colorClass: "text-tidal",
    bgClass: "bg-tidal/10",
    bgIndicator: "bg-tidal",
    unit: "m",
    facts: [
      "conditions.tidal.fact1",
      "conditions.tidal.fact2",
      "conditions.tidal.fact3",
      "conditions.tidal.fact4",
    ],
    getValueFromEntry: (entry) =>
      entry.environmental_data.tidal?.current_height_m ?? null,
    formatValue: (value) => `${value.toFixed(2)}m`,
    yAxisDomain: ["auto", "auto"],
  },
  sunrise: {
    icon: Sunrise,
    titleKey: "temporal.sunrise",
    descriptionKey: "conditions.sunrise.description",
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    bgIndicator: "bg-amber-500",
    unit: "",
    facts: [
      "conditions.sunrise.fact1",
      "conditions.sunrise.fact2",
      "conditions.sunrise.fact3",
      "conditions.sunrise.fact4",
    ],
    getValueFromEntry: (entry) => {
      // Convert sunrise time to minutes from midnight for charting
      const time = entry.environmental_data.temporal.sunrise;
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    },
    formatValue: (value) => {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    },
    yAxisDomain: [0, 720], // 0-12 hours in minutes
  },
  sunset: {
    icon: Sunset,
    titleKey: "temporal.sunset",
    descriptionKey: "conditions.sunset.description",
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    bgIndicator: "bg-orange-500",
    unit: "",
    facts: [
      "conditions.sunset.fact1",
      "conditions.sunset.fact2",
      "conditions.sunset.fact3",
      "conditions.sunset.fact4",
    ],
    getValueFromEntry: (entry) => {
      // Convert sunset time to minutes from midnight for charting
      const time = entry.environmental_data.temporal.sunset;
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    },
    formatValue: (value) => {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    },
    yAxisDomain: [720, 1440], // 12-24 hours in minutes
  },
};

export function getConditionIcon(type: ConditionType): LucideIcon {
  return conditionConfig[type].icon;
}

export function getConditionColor(type: ConditionType): string {
  return conditionConfig[type].colorClass;
}

interface CurrentValueResult {
  value: number;
  trend?: "rising" | "falling" | "stable";
  extra?: string;
}

/**
 * Get the current value for a condition type from environmental data
 */
export function getCurrentValue(
  type: ConditionType,
  data: import("@/types").EnvironmentalData,
): CurrentValueResult | null {
  switch (type) {
    case "temperature":
      if (!data.weather) return null;
      return {
        value: data.weather.temperature,
        extra: `Feels like ${data.weather.feels_like}°C`,
      };
    case "pressure":
      if (!data.weather) return null;
      return {
        value: data.weather.pressure,
        trend: data.weather.pressure_trend,
      };
    case "humidity":
      if (!data.weather) return null;
      return {
        value: data.weather.humidity,
        extra: data.weather.weather_description,
      };
    case "wind":
      if (!data.weather) return null;
      return {
        value: data.weather.wind_speed,
      };
    case "lunar":
      return {
        value: Math.round(data.lunar.illumination * 100),
        extra: `${data.lunar.phase_name} - ${data.lunar.distance_trend}`,
      };
    case "geomagnetic":
      if (!data.geomagnetic) return null;
      return {
        value: data.geomagnetic.kp_index,
        extra: data.geomagnetic.kp_label,
      };
    case "solar":
      if (!data.solar) return null;
      if (data.solar.flare_probability_24h !== null) {
        return {
          value: data.solar.flare_probability_24h,
          extra: data.solar.xray_class
            ? `X-ray class: ${data.solar.xray_class}`
            : undefined,
        };
      }
      return null;
    case "tidal":
      if (data.tidal) {
        return {
          value: data.tidal.current_height_m,
          trend:
            data.tidal.tidal_phase === "rising"
              ? "rising"
              : data.tidal.tidal_phase === "falling"
                ? "falling"
                : "stable",
          extra: `Next high: ${data.tidal.next_high}, Next low: ${data.tidal.next_low}`,
        };
      }
      return null;
    case "sunrise": {
      const [hours, minutes] = data.temporal.sunrise.split(":").map(Number);
      return {
        value: hours * 60 + minutes,
        extra: `Day length: ${data.temporal.day_length_hours.toFixed(1)} hours`,
      };
    }
    case "sunset": {
      const [hours, minutes] = data.temporal.sunset.split(":").map(Number);
      return {
        value: hours * 60 + minutes,
        extra: `${data.temporal.days_since_solstice} days since solstice`,
      };
    }
    default:
      return null;
  }
}
