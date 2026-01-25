"use client";

import type { Coordinates, EnvironmentalData } from "@/types";
import { useQuery } from "@tanstack/react-query";

// Query key factory
const environmentalDataQueryKey = (coords: Coordinates | null) =>
  ["environmental", coords] as const;

// API function
async function fetchEnvironmentalData(
  coordinates: Coordinates,
): Promise<EnvironmentalData> {
  const response = await fetch("/api/environmental", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(coordinates),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch environmental data: ${response.status}`);
  }

  return response.json();
}

export function useEnvironmentalData(coordinates: Coordinates | null) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: environmentalDataQueryKey(coordinates),
    queryFn: () => {
      if (!coordinates) {
        throw new Error("Coordinates are required");
      }
      return fetchEnvironmentalData(coordinates);
    },
    enabled: !!coordinates, // Only fetch when coordinates are available
    // Stale time: data is fresh for 5 minutes (environmental data doesn't change rapidly)
    staleTime: 5 * 60 * 1000,
    // Cache time: keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
    // Refetch every 5 minutes to keep data fresh
    refetchInterval: 5 * 60 * 1000,
  });

  return {
    data: data ?? null,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    isLoading,
    lastUpdated: data ? new Date() : null,
    refresh: refetch,
  };
}
