"use client";

import { CurrentConditions } from "@/components/dashboard/CurrentConditions";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { PainOverview } from "@/components/dashboard/PainOverview";
import { EntryList } from "@/components/entries/EntryList";
import { PainSlider } from "@/components/pain/PainSlider";
import { QuickAddFAB } from "@/components/pain/QuickAddFAB";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntries } from "@/hooks/useEntries";
import { useEnvironmentalData } from "@/hooks/useEnvironmentalData";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { CreatePainEntry, PainEntry, PainPoint } from "@/types";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Dynamic imports for heavy components
const FootScene = dynamic(
  () => import("@/components/foot-model/FootScene").then((m) => m.FootScene),
  {
    ssr: false,
    loading: () => (
      <div className='w-full aspect-square max-h-[400px] flex items-center justify-center'>
        <Skeleton className='w-32 h-32 rounded-full' />
      </div>
    ),
  },
);

const PainTimelineDynamic = dynamic(
  () => import("@/components/charts/PainTimeline").then((m) => m.PainTimeline),
  {
    loading: () => <Skeleton className='w-full h-64' />,
  },
);

const PressureCorrelationDynamic = dynamic(
  () =>
    import("@/components/charts/PressureCorrelation").then(
      (m) => m.PressureCorrelation,
    ),
  {
    loading: () => <Skeleton className='w-full h-64' />,
  },
);

const LunarPhaseChartDynamic = dynamic(
  () =>
    import("@/components/charts/LunarPhaseChart").then(
      (m) => m.LunarPhaseChart,
    ),
  {
    loading: () => <Skeleton className='w-full h-64' />,
  },
);

const CalendarHeatmapDynamic = dynamic(
  () =>
    import("@/components/charts/CalendarHeatmap").then(
      (m) => m.CalendarHeatmap,
    ),
  {
    loading: () => <Skeleton className='w-full h-64' />,
  },
);

export default function HomePage() {
  const t = useTranslations();

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/e341db58-6e00-4988-9b30-182f7e67fa87", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "page.tsx:HomePage-mount",
        message: "HomePage component mounted",
        data: {},
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
  }, []);
  // #endregion

  // Geolocation and environmental data
  const { coordinates } = useGeolocation();
  const { data: environmentalData, isLoading: isLoadingEnv } =
    useEnvironmentalData(coordinates);

  // #region agent log
  useEffect(() => {
    fetch("http://127.0.0.1:7242/ingest/e341db58-6e00-4988-9b30-182f7e67fa87", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "page.tsx:HomePage-render",
        message: "HomePage render with data",
        data: {
          hasCoordinates: !!coordinates,
          hasEnvData: !!environmentalData,
          isLoadingEnv,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
  }, [coordinates, environmentalData, isLoadingEnv]);
  // #endregion

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
  function handlePointSelect(point: PainPoint) {
    setSelectedPoint(point);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  // Submit new entry
  async function handleSubmit() {
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
  }

  // Quick add - duplicate last entry with fresh environmental data
  async function handleQuickAdd(): Promise<boolean> {
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
  }

  // Edit entry
  function handleEdit(entry: PainEntry) {
    setEditingEntry(entry);
  }

  // Update entry
  async function handleUpdateEntry(entry: PainEntry) {
    const result = await updateEntry(entry.id, {
      pain_level: entry.pain_level,
    });

    if (result) {
      setEditingEntry(null);
      toast.success("Entry updated");
    }
  }

  return (
    <div className='min-h-screen bg-background animated-gradient noise-overlay relative'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b'>
        <div className='container mx-auto px-4 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Image
              src='/icons/pain-phantom-logo.png'
              alt=''
              width={24}
              height={24}
              className='w-6 h-6'
              aria-hidden='true'
              unoptimized
            />
            <h1 className='font-bold text-lg gradient-text'>{t("app.name")}</h1>
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='md:hidden'>
                <Menu className='w-5 h-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='right' className='w-72'>
              <nav className='flex flex-col gap-4 mt-8'>
                <Button variant='ghost' className='justify-start'>
                  {t("navigation.dashboard")}
                </Button>
                <Button variant='ghost' className='justify-start'>
                  {t("navigation.history")}
                </Button>
                <Button variant='ghost' className='justify-start'>
                  {t("navigation.settings")}
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main className='container mx-auto px-4 py-6 space-y-6 pb-24'>
        {/* Entry Form Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='space-y-4'
        >
          {/* 3D Foot Model */}
          <div className='bg-card rounded-2xl border overflow-hidden'>
            <FootScene
              selectedPoint={selectedPoint}
              onPointSelect={handlePointSelect}
            />
          </div>

          {/* Pain Level Slider */}
          <div className='bg-card rounded-2xl border p-4'>
            <PainSlider value={painLevel} onChange={setPainLevel} />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedPoint || isSubmitting || !environmentalData}
            className='w-full h-12 text-lg'
            size='lg'
          >
            {isSubmitting ? t("common.loading") : t("entry.submit")}
          </Button>

          {/* Selected point indicator */}
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-center text-sm text-muted-foreground'
            >
              Selected:{" "}
              <span className='font-medium text-foreground'>
                {selectedPoint.name}
              </span>
            </motion.div>
          )}
        </motion.section>

        {/* Dashboard Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='grid gap-6 md:grid-cols-2'
        >
          {/* Current Conditions */}
          <CurrentConditions
            data={environmentalData}
            isLoading={isLoadingEnv}
          />

          {/* Pain Overview */}
          <PainOverview entries={entries} isLoading={isLoadingEntries} />
        </motion.section>

        {/* Charts Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className='space-y-6'
        >
          {/* Pain Timeline - Full width */}
          <PainTimelineDynamic entries={entries} isLoading={isLoadingEntries} />

          {/* Correlation Charts Grid */}
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <PressureCorrelationDynamic
              entries={entries}
              isLoading={isLoadingEntries}
            />
            <LunarPhaseChartDynamic
              entries={entries}
              isLoading={isLoadingEntries}
              currentPhase={environmentalData?.lunar.phase}
            />
            <CalendarHeatmapDynamic
              entries={entries}
              isLoading={isLoadingEntries}
            />
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

  function handleSave() {
    onSave({ ...entry, pain_level: painLevel });
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='bg-card rounded-2xl border shadow-xl p-6 w-full max-w-md space-y-6'
      >
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>{t("entryCard.edit")}</h2>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X className='w-5 h-5' />
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='text-sm text-muted-foreground'>
            Location:{" "}
            <span className='font-medium text-foreground'>
              {entry.pain_point_name}
            </span>
          </div>

          <PainSlider value={painLevel} onChange={setPainLevel} />
        </div>

        <div className='flex gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1'>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className='flex-1'>
            {t("common.save")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
