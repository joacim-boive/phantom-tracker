import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Reference to memory store (shared with parent route in real app would need proper state management)
// For now, this is a simplified approach
const memoryStore: Array<{
  id: string;
  [key: string]: unknown;
}> = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("pain_entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Entry not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json(data);
    }

    // Memory store fallback
    const entry = memoryStore.find(e => e.id === id);
    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to fetch entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    // Validate pain_level if provided
    if (body.pain_level !== undefined) {
      if (
        typeof body.pain_level !== "number" ||
        body.pain_level < 1 ||
        body.pain_level > 10
      ) {
        return NextResponse.json(
          { error: "Pain level must be between 1 and 10" },
          { status: 400 }
        );
      }
    }

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from("pain_entries")
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Entry not found" },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json(data);
    }

    // Memory store fallback
    const index = memoryStore.findIndex(e => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    memoryStore[index] = {
      ...memoryStore[index],
      ...body,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(memoryStore[index]);
  } catch (error) {
    console.error("Failed to update entry:", error);
    return NextResponse.json(
      { error: "Failed to update entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from("pain_entries")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true });
    }

    // Memory store fallback
    const index = memoryStore.findIndex(e => e.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    memoryStore.splice(index, 1);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete entry:", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 }
    );
  }
}
