import SunCalc from "suncalc";
import type { TemporalData, Coordinates } from "@/types";

// Solstice dates for calculating days since solstice
const WINTER_SOLSTICE_MONTH = 11; // December (0-indexed)
const WINTER_SOLSTICE_DAY = 21;
const SUMMER_SOLSTICE_MONTH = 5; // June
const SUMMER_SOLSTICE_DAY = 21;

/**
 * Calculate temporal data for a given date and location
 */
export function calculateTemporalData(date: Date, coords: Coordinates): TemporalData {
  const { latitude, longitude } = coords;
  
  // Get sun times for the location
  const sunTimes = SunCalc.getTimes(date, latitude, longitude);
  
  // Calculate day length
  const sunrise = sunTimes.sunrise;
  const sunset = sunTimes.sunset;
  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const day_length_hours = Math.round((dayLengthMs / (1000 * 60 * 60)) * 10) / 10;
  
  // Format sunrise/sunset times
  const sunriseStr = formatTime(sunrise);
  const sunsetStr = formatTime(sunset);
  
  // Calculate days since the most recent solstice
  const days_since_solstice = calculateDaysSinceSolstice(date, latitude >= 0);

  return {
    day_length_hours,
    sunrise: sunriseStr,
    sunset: sunsetStr,
    days_since_solstice,
  };
}

/**
 * Format time to HH:MM string
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Calculate days since the most recent solstice
 */
function calculateDaysSinceSolstice(date: Date, isNorthernHemisphere: boolean): number {
  const year = date.getFullYear();
  
  // In northern hemisphere, winter solstice is in December, summer in June
  // In southern hemisphere, it's reversed
  const winterMonth = isNorthernHemisphere ? WINTER_SOLSTICE_MONTH : SUMMER_SOLSTICE_MONTH;
  const winterDay = isNorthernHemisphere ? WINTER_SOLSTICE_DAY : SUMMER_SOLSTICE_DAY;
  const summerMonth = isNorthernHemisphere ? SUMMER_SOLSTICE_MONTH : WINTER_SOLSTICE_MONTH;
  const summerDay = isNorthernHemisphere ? SUMMER_SOLSTICE_DAY : WINTER_SOLSTICE_DAY;
  
  // Create solstice dates for current and previous year
  const winterSolsticeThisYear = new Date(year, winterMonth, winterDay);
  const winterSolsticePrevYear = new Date(year - 1, winterMonth, winterDay);
  const summerSolsticeThisYear = new Date(year, summerMonth, summerDay);
  
  // Find the most recent solstice
  let mostRecentSolstice: Date;
  
  if (date >= summerSolsticeThisYear) {
    mostRecentSolstice = summerSolsticeThisYear;
  } else if (date >= winterSolsticeThisYear) {
    mostRecentSolstice = winterSolsticeThisYear;
  } else if (winterMonth === 11) {
    // Winter solstice is in December of previous year
    mostRecentSolstice = winterSolsticePrevYear;
  } else {
    mostRecentSolstice = summerSolsticeThisYear;
  }
  
  // Calculate difference in days
  const diffMs = date.getTime() - mostRecentSolstice.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get day length category
 */
export function getDayLengthCategory(hours: number): string {
  if (hours < 8) return "Very Short";
  if (hours < 10) return "Short";
  if (hours < 12) return "Moderate";
  if (hours < 14) return "Long";
  return "Very Long";
}
