"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { EntryCard } from "./EntryCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { PainEntry } from "@/types";

interface EntryListProps {
  entries: PainEntry[];
  isLoading: boolean;
  onEdit: (entry: PainEntry) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export function EntryList({
  entries,
  isLoading,
  onEdit,
  onDelete,
}: EntryListProps) {
  const t = useTranslations("dashboard");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No pain entries yet.</p>
        <p className="text-sm mt-1">Tap the foot model to log your first entry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("recentEntries")}</h2>
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
