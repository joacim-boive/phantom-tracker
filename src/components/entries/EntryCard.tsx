"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { 
  Cloud, 
  Moon, 
  Zap, 
  Pencil, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Gauge
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getPainColorClass, getPainBgClass } from "@/lib/foot-regions";
import { getMoonPhaseEmoji } from "@/lib/environmental/lunar";
import type { PainEntry } from "@/types";

interface EntryCardProps {
  entry: PainEntry;
  onEdit: (entry: PainEntry) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    const success = await onDelete(entry.id);
    if (!success) {
      setIsDeleting(false);
    }
    setShowDeleteDialog(false);
  }, [entry.id, onDelete]);

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return `${t("common.today")} ${format(date, "HH:mm")}`;
    }
    if (isYesterday(date)) {
      return `${t("common.yesterday")} ${format(date, "HH:mm")}`;
    }
    return format(date, "MMM d, HH:mm");
  }, [t]);

  const { weather, lunar, geomagnetic } = entry.environmental_data;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {/* Main row */}
            <div className="flex items-center gap-4">
              {/* Pain level badge */}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "text-xl font-bold",
                  getPainBgClass(entry.pain_level),
                  getPainColorClass(entry.pain_level)
                )}
              >
                {entry.pain_level}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {entry.pain_point_name ?? t("footRegions.arch")}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {Math.round(weather.temperature)}°C
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(entry.created_at)}
                </div>
              </div>

              {/* Quick weather icons */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Cloud className="w-4 h-4" />
                <span className="text-xs">{weather.pressure}</span>
              </div>

              {/* Expand button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Expanded content */}
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t space-y-3">
                {/* Environmental data grid */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {/* Weather */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-weather">
                      <Thermometer className="w-4 h-4" />
                      <span className="font-medium">{t("weather.temperature")}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {weather.temperature}°C ({weather.weather_condition})
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-weather">
                      <Gauge className="w-4 h-4" />
                      <span className="font-medium">{t("weather.pressure")}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {weather.pressure} hPa
                      <span className="text-xs ml-1">
                        ({t(`weather.${weather.pressure_trend}`)})
                      </span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-weather">
                      <Cloud className="w-4 h-4" />
                      <span className="font-medium">{t("weather.humidity")}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {weather.humidity}%
                    </div>
                  </div>

                  {/* Lunar */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-lunar">
                      <Moon className="w-4 h-4" />
                      <span className="font-medium">{t("lunar.title")}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {getMoonPhaseEmoji(lunar.phase)} {lunar.phase_name}
                    </div>
                  </div>

                  {/* Geomagnetic */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-geomagnetic">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">{t("geomagnetic.title")}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Kp {geomagnetic.kp_index} ({geomagnetic.kp_label})
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    {t("entryCard.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("entryCard.delete")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("entryCard.delete")}</DialogTitle>
            <DialogDescription>
              {t("entryCard.confirmDelete")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? t("common.loading") : t("entryCard.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
