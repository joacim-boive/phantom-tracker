import SunCalc from "suncalc";
import type { LunarData } from "@/types";

// Moon phase names based on illumination and age
const PHASE_NAMES: Record<string, string> = {
  new_moon: "New Moon",
  waxing_crescent: "Waxing Crescent",
  first_quarter: "First Quarter",
  waxing_gibbous: "Waxing Gibbous",
  full_moon: "Full Moon",
  waning_gibbous: "Waning Gibbous",
  last_quarter: "Last Quarter",
  waning_crescent: "Waning Crescent",
};

// Average lunar month in days
const LUNAR_MONTH = 29.53059;

// Average moon distance in km
const AVERAGE_MOON_DISTANCE = 384400;

/**
 * Calculate lunar data for a given date
 */
export function calculateLunarData(date: Date): LunarData {
  const moonIllum = SunCalc.getMoonIllumination(date);
  
  // Calculate moon phase name
  const phase = getMoonPhaseName(moonIllum.phase);
  
  // Age in days (0-29.53)
  const age_days = Math.round(moonIllum.phase * LUNAR_MONTH * 10) / 10;
  
  // Approximate distance based on phase (simplified)
  // In reality, this would require more complex orbital calculations
  const distanceVariation = Math.cos(moonIllum.phase * 2 * Math.PI) * 21000;
  const distance_km = Math.round(AVERAGE_MOON_DISTANCE + distanceVariation);
  
  // Determine if moon is approaching or receding
  // Simplified: approaching during first half of cycle, receding during second half
  const distance_trend = moonIllum.phase < 0.5 ? "approaching" : "receding";

  return {
    phase,
    phase_name: PHASE_NAMES[phase] ?? "Unknown",
    illumination: Math.round(moonIllum.fraction * 100) / 100,
    distance_km,
    distance_trend,
    age_days,
  };
}

/**
 * Get the moon phase name based on phase value (0-1)
 */
function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625) return "new_moon";
  if (phase < 0.1875) return "waxing_crescent";
  if (phase < 0.3125) return "first_quarter";
  if (phase < 0.4375) return "waxing_gibbous";
  if (phase < 0.5625) return "full_moon";
  if (phase < 0.6875) return "waning_gibbous";
  if (phase < 0.8125) return "last_quarter";
  if (phase < 0.9375) return "waning_crescent";
  return "new_moon";
}

/**
 * Get moon phase emoji
 */
export function getMoonPhaseEmoji(phase: string): string {
  const emojis: Record<string, string> = {
    new_moon: "🌑",
    waxing_crescent: "🌒",
    first_quarter: "🌓",
    waxing_gibbous: "🌔",
    full_moon: "🌕",
    waning_gibbous: "🌖",
    last_quarter: "🌗",
    waning_crescent: "🌘",
  };
  return emojis[phase] ?? "🌙";
}
