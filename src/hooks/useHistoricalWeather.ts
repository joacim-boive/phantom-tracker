"use client";

import type { HistoricalWeatherPoint } from "@/lib/environmental/history";
import type { Coordinates } from "@/types";
import { useEffect, useState } from "react";

interface HistoricalWeatherState {
  data: HistoricalWeatherPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useHistoricalWeather(
  coordinates: Coordinates | null,
  days: number = 30,
) {
  const [state, setState] = useState<HistoricalWeatherState>({
    data: [],
    isLoading: false,
    error: null,
  });

  async function fetchData() {
    if (!coordinates) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/environmental/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          days,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch historical data: ${response.status}`);
      }

      const data: HistoricalWeatherPoint[] = await response.json();

      setState({
        data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }

  useEffect(() => {
    if (coordinates) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates?.latitude, coordinates?.longitude, days]);

  return {
    ...state,
    refresh: fetchData,
  };
}
