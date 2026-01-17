import type { SolarData } from "@/types";

// NOAA Space Weather X-ray flux data
const NOAA_XRAY_URL = "https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json";

/**
 * Fetch solar activity data from NOAA
 */
export async function fetchSolarData(): Promise<SolarData> {
  try {
    const response = await fetch(NOAA_XRAY_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`NOAA Solar API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid NOAA solar data format");
    }

    // Get the latest X-ray flux reading
    const latestEntry = data[data.length - 1];
    const flux = latestEntry.flux;
    
    // Convert flux to X-ray class
    const { xray_class, xray_flux } = classifyXrayFlux(flux);
    
    // Simplified flare probability based on current activity
    const flare_probability_24h = calculateFlareProbability(xray_class);

    return {
      xray_flux,
      xray_class,
      flare_probability_24h,
    };
  } catch (error) {
    console.error("Failed to fetch solar data:", error);
    return getMockSolarData();
  }
}

/**
 * Classify X-ray flux into solar flare classes
 * A < 10^-7, B < 10^-6, C < 10^-5, M < 10^-4, X >= 10^-4
 */
function classifyXrayFlux(flux: number): { xray_class: string; xray_flux: string } {
  if (flux < 1e-7) {
    return { xray_class: "A", xray_flux: `A${(flux / 1e-8).toFixed(1)}` };
  } else if (flux < 1e-6) {
    return { xray_class: "B", xray_flux: `B${(flux / 1e-7).toFixed(1)}` };
  } else if (flux < 1e-5) {
    return { xray_class: "C", xray_flux: `C${(flux / 1e-6).toFixed(1)}` };
  } else if (flux < 1e-4) {
    return { xray_class: "M", xray_flux: `M${(flux / 1e-5).toFixed(1)}` };
  } else {
    return { xray_class: "X", xray_flux: `X${(flux / 1e-4).toFixed(1)}` };
  }
}

/**
 * Estimate flare probability based on current X-ray class
 */
function calculateFlareProbability(xray_class: string): number {
  const probabilities: Record<string, number> = {
    A: 0.05,
    B: 0.1,
    C: 0.2,
    M: 0.4,
    X: 0.7,
  };
  return probabilities[xray_class] ?? 0.1;
}

function getMockSolarData(): SolarData {
  return {
    xray_flux: "B5.2",
    xray_class: "B",
    flare_probability_24h: 0.1,
  };
}

/**
 * Get solar activity color class
 */
export function getSolarColorClass(xray_class: string | null): string {
  if (!xray_class) return "text-muted-foreground";
  if (xray_class === "A" || xray_class === "B") return "text-emerald-500";
  if (xray_class === "C") return "text-amber-500";
  if (xray_class === "M") return "text-orange-500";
  return "text-rose-500";
}
