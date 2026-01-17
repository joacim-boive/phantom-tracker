"use client";

import { useState, useEffect, useCallback } from "react";
import type { PainEntry, CreatePainEntry } from "@/types";

interface EntriesState {
  entries: PainEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useEntries() {
  const [state, setState] = useState<EntriesState>({
    entries: [],
    isLoading: true,
    error: null,
  });

  const fetchEntries = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/entries");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch entries: ${response.status}`);
      }

      const entries: PainEntry[] = await response.json();
      
      setState({
        entries,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const createEntry = useCallback(async (entry: CreatePainEntry): Promise<PainEntry | null> => {
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`Failed to create entry: ${response.status}`);
      }

      const newEntry: PainEntry = await response.json();
      
      // Add to local state
      setState(prev => ({
        ...prev,
        entries: [newEntry, ...prev.entries],
      }));

      return newEntry;
    } catch (error) {
      console.error("Failed to create entry:", error);
      return null;
    }
  }, []);

  const updateEntry = useCallback(async (
    id: string,
    updates: Partial<CreatePainEntry>
  ): Promise<PainEntry | null> => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update entry: ${response.status}`);
      }

      const updatedEntry: PainEntry = await response.json();
      
      // Update local state
      setState(prev => ({
        ...prev,
        entries: prev.entries.map(e => 
          e.id === id ? updatedEntry : e
        ),
      }));

      return updatedEntry;
    } catch (error) {
      console.error("Failed to update entry:", error);
      return null;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete entry: ${response.status}`);
      }

      // Remove from local state
      setState(prev => ({
        ...prev,
        entries: prev.entries.filter(e => e.id !== id),
      }));

      return true;
    } catch (error) {
      console.error("Failed to delete entry:", error);
      return false;
    }
  }, []);

  // Get the most recent entry
  const lastEntry = state.entries[0] ?? null;

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    ...state,
    lastEntry,
    refresh: fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
