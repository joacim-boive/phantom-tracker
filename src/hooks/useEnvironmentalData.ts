"use client";

import { useState, useEffect, useCallback } from "react";
import type { EnvironmentalData, Coordinates } from "@/types";

interface EnvironmentalDataState {
  data: EnvironmentalData | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function useEnvironmentalData(coordinates: Coordinates | null) {
  const [state, setState] = useState<EnvironmentalDataState>({
    data: null,
    error: null,
    isLoading: false,
    lastUpdated: null,
  });

  const fetchData = useCallback(async () => {
    if (!coordinates) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/environmental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coordinates),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch environmental data: ${response.status}`);
      }

      const data: EnvironmentalData = await response.json();
      
      setState({
        data,
        error: null,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      }));
    }
  }, [coordinates]);

  useEffect(() => {
    if (coordinates) {
      fetchData();
    }
  }, [coordinates, fetchData]);

  return {
    ...state,
    refresh: fetchData,
  };
}
