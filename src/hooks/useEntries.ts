"use client";

import type { CreatePainEntry, PainEntry } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
const entriesQueryKey = ["entries"] as const;

// API functions
async function fetchEntries(): Promise<PainEntry[]> {
  const response = await fetch("/api/entries");
  if (!response.ok) {
    throw new Error(`Failed to fetch entries: ${response.status}`);
  }
  return response.json();
}

async function createEntryAPI(entry: CreatePainEntry): Promise<PainEntry> {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    throw new Error(`Failed to create entry: ${response.status}`);
  }
  return response.json();
}

async function updateEntryAPI(
  id: string,
  updates: Partial<CreatePainEntry>,
): Promise<PainEntry> {
  const response = await fetch(`/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Failed to update entry: ${response.status}`);
  }
  return response.json();
}

async function deleteEntryAPI(id: string): Promise<void> {
  const response = await fetch(`/api/entries/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete entry: ${response.status}`);
  }
}

export function useEntries() {
  const queryClient = useQueryClient();

  // Fetch entries query
  const {
    data: entries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: entriesQueryKey,
    queryFn: fetchEntries,
    // Refetch every 30 seconds to keep data fresh
    refetchInterval: 30 * 1000,
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: createEntryAPI,
    onSuccess: (newEntry) => {
      // Optimistically update the cache
      queryClient.setQueryData<PainEntry[]>(entriesQueryKey, (old) => {
        return old ? [newEntry, ...old] : [newEntry];
      });
      // Optionally refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: entriesQueryKey });
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreatePainEntry>;
    }) => updateEntryAPI(id, updates),
    onSuccess: (updatedEntry) => {
      // Optimistically update the cache
      queryClient.setQueryData<PainEntry[]>(entriesQueryKey, (old) => {
        return old
          ? old.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
          : [updatedEntry];
      });
      // Optionally refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: entriesQueryKey });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: deleteEntryAPI,
    onSuccess: (_, deletedId) => {
      // Optimistically update the cache
      queryClient.setQueryData<PainEntry[]>(entriesQueryKey, (old) => {
        return old ? old.filter((e) => e.id !== deletedId) : [];
      });
      // Optionally refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: entriesQueryKey });
    },
  });

  // Get the most recent entry
  const lastEntry = entries[0] ?? null;

  return {
    entries,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    lastEntry,
    refresh: refetch,
    createEntry: async (entry: CreatePainEntry): Promise<PainEntry | null> => {
      try {
        const result = await createEntryMutation.mutateAsync(entry);
        return result;
      } catch (error) {
        console.error("Failed to create entry:", error);
        return null;
      }
    },
    updateEntry: async (
      id: string,
      updates: Partial<CreatePainEntry>,
    ): Promise<PainEntry | null> => {
      try {
        const result = await updateEntryMutation.mutateAsync({ id, updates });
        return result;
      } catch (error) {
        console.error("Failed to update entry:", error);
        return null;
      }
    },
    deleteEntry: async (id: string): Promise<boolean> => {
      try {
        await deleteEntryMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
  };
}
