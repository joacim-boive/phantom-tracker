import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PainEntry, CreatePainEntry } from "@/types";

// In-memory store for development without Supabase
const memoryStore: PainEntry[] = [];

export async function GET() {
  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("pain_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json(data);
    }

    // Return from memory store if Supabase not configured
    return NextResponse.json(memoryStore);
  } catch (error) {
    console.error("Failed to fetch entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePainEntry = await request.json();

    // Validate required fields
    if (
      typeof body.pain_point_x !== "number" ||
      typeof body.pain_point_y !== "number" ||
      typeof body.pain_point_z !== "number" ||
      typeof body.pain_level !== "number" ||
      body.pain_level < 1 ||
      body.pain_level > 10
    ) {
      return NextResponse.json(
        { error: "Invalid pain entry data" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("pain_entries")
        .insert([body])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(data, { status: 201 });
    }

    // Store in memory if Supabase not configured
    const newEntry: PainEntry = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body,
      user_id: null,
    };
    
    memoryStore.unshift(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry:", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 }
    );
  }
}
