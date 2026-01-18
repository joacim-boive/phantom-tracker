import { NextRequest, NextResponse } from "next/server";
import { fetchHistoricalWeatherRange } from "@/lib/environmental/history";
import type { Coordinates } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const coordinates: Coordinates = {
      latitude: body.latitude,
      longitude: body.longitude,
    };

    if (typeof coordinates.latitude !== "number" || typeof coordinates.longitude !== "number") {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const days = typeof body.days === "number" ? body.days : 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const historicalData = await fetchHistoricalWeatherRange(
      coordinates,
      startDate,
      endDate
    );

    return NextResponse.json(historicalData);
  } catch (error) {
    console.error("Historical weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical weather data" },
      { status: 500 }
    );
  }
}
