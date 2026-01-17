"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FootScene } from "@/components/foot-model";
import { PainSlider } from "@/components/pain";
import type { PainPoint, PainEntry, CreatePainEntry, EnvironmentalData } from "@/types";
import { cn } from "@/lib/utils";

interface EntryFormProps {
  onSubmit: (entry: CreatePainEntry) => Promise<PainEntry | null>;
  environmentalData: EnvironmentalData | null;
  isLoadingEnv: boolean;
  coordinates: { latitude: number; longitude: number } | null;
  editEntry?: PainEntry | null;
  onClose?: () => void;
}

export function EntryForm({
  onSubmit,
  environmentalData,
  isLoadingEnv,
  coordinates,
  editEntry,
  onClose,
}: EntryFormProps) {
  const t = useTranslations();
  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(
    editEntry
      ? {
          x: editEntry.pain_point_x,
          y: editEntry.pain_point_y,
          z: editEntry.pain_point_z,
          name: editEntry.pain_point_name ?? "",
        }
      : null
  );
  const [painLevel, setPainLevel] = useState(editEntry?.pain_level ?? 5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePointSelect = useCallback((point: PainPoint) => {
    setSelectedPoint(point);
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedPoint) {
      toast.error(t("entry.selectPoint"));
      return;
    }

    if (!environmentalData) {
      toast.error("Environmental data not available");
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

      const result = await onSubmit(entry);

      if (result) {
        toast.success(t("entry.success"));
        setSelectedPoint(null);
        setPainLevel(5);
        onClose?.();
      } else {
        toast.error(t("entry.error"));
      }
    } catch {
      toast.error(t("entry.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoint, painLevel, environmentalData, coordinates, onSubmit, onClose, t]);

  const isEditMode = !!editEntry;
  const FormWrapper = isEditMode ? Dialog : "div";
  const ContentWrapper = isEditMode ? DialogContent : Card;

  const formContent = (
    <>
      {isEditMode && (
        <DialogHeader>
          <DialogTitle>{t("entryCard.edit")}</DialogTitle>
        </DialogHeader>
      )}

      <div className={cn(isEditMode ? "space-y-6" : "")}>
        {!isEditMode && (
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              {t("entry.title")}
              {coordinates && (
                <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location detected
                </span>
              )}
            </CardTitle>
          </CardHeader>
        )}

        <CardContent className={cn(!isEditMode && "space-y-6")}>
          {/* 3D Foot Model */}
          <div className="relative">
            <FootScene
              selectedPoint={selectedPoint}
              onPointSelect={handlePointSelect}
            />
            
            {/* Selected point info */}
            <AnimatePresence>
              {selectedPoint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border text-sm"
                >
                  <span className="font-medium">{selectedPoint.name}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pain Level Slider */}
          <PainSlider value={painLevel} onChange={setPainLevel} />

          {/* Environmental data status */}
          {isLoadingEnv && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading environmental data...</span>
            </div>
          )}

          {!isLoadingEnv && !environmentalData && (
            <div className="flex items-center gap-2 text-sm text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span>Could not load environmental data</span>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedPoint || isSubmitting || !environmentalData}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              t("entry.submit")
            )}
          </Button>
        </CardContent>
      </div>
    </>
  );

  if (isEditMode) {
    return (
      <FormWrapper open={!!editEntry} onOpenChange={() => onClose?.()}>
        <ContentWrapper className="max-w-lg">
          {formContent}
        </ContentWrapper>
      </FormWrapper>
    );
  }

  return <ContentWrapper>{formContent}</ContentWrapper>;
}
