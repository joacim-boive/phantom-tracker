"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Menu, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FootScene } from "@/components/foot-model";
import { PainSlider, QuickAddFAB } from "@/components/pain";
import { EntryList } from "@/components/entries";
import { CurrentConditions, PainOverview, InsightCards } from "@/components/dashboard";
import { PainTimeline, PressureCorrelation, LunarPhaseChart, CalendarHeatmap } from "@/components/charts";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEnvironmentalData } from "@/hooks/useEnvironmentalData";
import { useEntries } from "@/hooks/useEntries";
import type { PainPoint, PainEntry, CreatePainEntry } from "@/types";

export default function HomePage() {
  const t = useTranslations();
  
  // Geolocation and environmental data
  const { coordinates } = useGeolocation();
  const { data: environmentalData, isLoading: isLoadingEnv } = useEnvironmentalData(coordinates);
  
  // Entries state
  const {
    entries,
    isLoading: isLoadingEntries,
    lastEntry,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useEntries();
  
  // Local state
  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(null);
  const [painLevel, setPainLevel] = useState(5);
  const [editingEntry, setEditingEntry] = useState<PainEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle point selection on the 3D model
  const handlePointSelect = useCallback((point: PainPoint) => {
    setSelectedPoint(point);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  // Submit new entry
  const handleSubmit = useCallback(async () => {
    if (!selectedPoint) {
      toast.error(t("entry.selectPoint"));
      return;
    }

    if (!environmentalData) {
      toast.error("Environmental data not available. Please wait...");
      return;
    }

    setIsSubmitting(true);

    try {
      const entry: CreatePainEntry = {
        pain_point_x: selectedPoint.x,
        pain_point_y: selectedPoint.y,
        pain_point_z: selectedPoint.z,
        pain_point_name: selectedPoint.name,
        pain_level: painLevel,
        environmental_data: environmentalData,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      };

      const result = await createEntry(entry);

      if (result) {
        toast.success(t("entry.success"));
        setSelectedPoint(null);
        setPainLevel(5);
        
        // Haptic success
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      } else {
        toast.error(t("entry.error"));
      }
    } catch {
      toast.error(t("entry.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoint, painLevel, environmentalData, coordinates, createEntry, t]);

  // Quick add - duplicate last entry with fresh environmental data
  const handleQuickAdd = useCallback(async (): Promise<boolean> => {
    if (!lastEntry) {
      toast.error("No previous entry to duplicate");
      return false;
    }

    if (!environmentalData) {
      toast.error("Environmental data not available");
      return false;
    }

    const entry: CreatePainEntry = {
      pain_point_x: lastEntry.pain_point_x,
      pain_point_y: lastEntry.pain_point_y,
      pain_point_z: lastEntry.pain_point_z,
      pain_point_name: lastEntry.pain_point_name,
      pain_level: lastEntry.pain_level,
      environmental_data: environmentalData,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
    };

    const result = await createEntry(entry);
    
    if (result) {
      toast.success(t("entry.success"));
      return true;
    }
    
    toast.error(t("entry.error"));
    return false;
  }, [lastEntry, environmentalData, coordinates, createEntry, t]);

  // Edit entry
  const handleEdit = useCallback((entry: PainEntry) => {
    setEditingEntry(entry);
  }, []);

  // Update entry
  const handleUpdateEntry = useCallback(async (entry: PainEntry) => {
    const result = await updateEntry(entry.id, {
      pain_level: entry.pain_level,
    });
    
    if (result) {
      setEditingEntry(null);
      toast.success("Entry updated");
    }
  }, [updateEntry]);

  return (
    <div className="min-h-screen bg-background animated-gradient noise-overlay relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="font-bold text-lg gradient-text">{t("app.name")}</h1>
          </div>
          
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Button variant="ghost" className="justify-start">
                  {t("navigation.dashboard")}
                </Button>
                <Button variant="ghost" className="justify-start">
                  {t("navigation.history")}
                </Button>
                <Button variant="ghost" className="justify-start">
                  {t("navigation.settings")}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Entry Form Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 3D Foot Model */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <FootScene
              selectedPoint={selectedPoint}
              onPointSelect={handlePointSelect}
            />
          </div>

          {/* Pain Level Slider */}
          <div className="bg-card rounded-2xl border p-4">
            <PainSlider value={painLevel} onChange={setPainLevel} />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedPoint || isSubmitting || !environmentalData}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isSubmitting ? t("common.loading") : t("entry.submit")}
          </Button>

          {/* Selected point indicator */}
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-muted-foreground"
            >
              Selected: <span className="font-medium text-foreground">{selectedPoint.name}</span>
            </motion.div>
          )}
        </motion.section>

        {/* Dashboard Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Current Conditions */}
          <CurrentConditions data={environmentalData} isLoading={isLoadingEnv} />
          
          {/* Pain Overview */}
          <PainOverview entries={entries} isLoading={isLoadingEntries} />
        </motion.section>

        {/* Charts Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          {/* Pain Timeline - Full width */}
          <PainTimeline entries={entries} isLoading={isLoadingEntries} />
          
          {/* Correlation Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <PressureCorrelation entries={entries} isLoading={isLoadingEntries} />
            <LunarPhaseChart 
              entries={entries} 
              isLoading={isLoadingEntries}
              currentPhase={environmentalData?.lunar.phase}
            />
            <CalendarHeatmap entries={entries} isLoading={isLoadingEntries} />
          </div>
          
          {/* Insights */}
          <InsightCards entries={entries} isLoading={isLoadingEntries} />
        </motion.section>

        {/* Entry List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <EntryList
            entries={entries}
            isLoading={isLoadingEntries}
            onEdit={handleEdit}
            onDelete={deleteEntry}
          />
        </motion.section>
      </main>

      {/* Quick Add FAB */}
      <QuickAddFAB
        onQuickAdd={handleQuickAdd}
        disabled={!lastEntry || !environmentalData}
      />

      {/* Edit Dialog */}
      {editingEntry && (
        <EditDialog
          entry={editingEntry}
          onSave={handleUpdateEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

// Edit dialog component
function EditDialog({
  entry,
  onSave,
  onClose,
}: {
  entry: PainEntry;
  onSave: (entry: PainEntry) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const [painLevel, setPainLevel] = useState(entry.pain_level);

  const handleSave = useCallback(() => {
    onSave({ ...entry, pain_level: painLevel });
  }, [entry, painLevel, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-2xl border shadow-xl p-6 w-full max-w-md space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("entryCard.edit")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Location: <span className="font-medium text-foreground">{entry.pain_point_name}</span>
          </div>
          
          <PainSlider value={painLevel} onChange={setPainLevel} />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            {t("common.save")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
