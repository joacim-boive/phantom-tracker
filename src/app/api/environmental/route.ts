import { NextRequest, NextResponse } from "next/server";
import { fetchAllEnvironmentalData } from "@/lib/environmental";
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

    const environmentalData = await fetchAllEnvironmentalData(coordinates);

    return NextResponse.json(environmentalData);
  } catch (error) {
    console.error("Environmental API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch environmental data" },
      { status: 500 }
    );
  }
}
