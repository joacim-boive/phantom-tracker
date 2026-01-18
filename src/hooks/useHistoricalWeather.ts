"use client";

import { useState, useEffect, useCallback } from "react";
import type { Coordinates } from "@/types";
import type { HistoricalWeatherPoint } from "@/lib/environmental/history";

interface HistoricalWeatherState {
  data: HistoricalWeatherPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useHistoricalWeather(
  coordinates: Coordinates | null,
  days: number = 30
) {
  const [state, setState] = useState<HistoricalWeatherState>({
    data: [],
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
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
  }, [coordinates, days]);

  useEffect(() => {
    if (coordinates) {
      fetchData();
    }
  }, [coordinates, days, fetchData]);

  return {
    ...state,
    refresh: fetchData,
  };
}
