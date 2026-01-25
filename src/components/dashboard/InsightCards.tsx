"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CorrelationInsight, PainEntry } from "@/types";
import { motion } from "framer-motion";
import { Gauge, Lightbulb, Moon, TrendingDown, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

interface InsightCardsProps {
  entries: PainEntry[];
  isLoading: boolean;
}

export function InsightCards({ entries, isLoading }: InsightCardsProps) {
  const t = useTranslations("insights");

  function calculateInsights(): CorrelationInsight[] {
    if (entries.length < 5) {
      return [];
    }

    const generatedInsights: CorrelationInsight[] = [];

    // Analyze pressure correlation
    const lowPressureEntries = entries.filter(
      (e) =>
        e.environmental_data.weather?.pressure !== undefined &&
        e.environmental_data.weather.pressure < 1010,
    );
    const highPressureEntries = entries.filter(
      (e) =>
        e.environmental_data.weather?.pressure !== undefined &&
        e.environmental_data.weather.pressure >= 1010,
    );

    if (lowPressureEntries.length >= 3 && highPressureEntries.length >= 3) {
      const avgLowPressurePain =
        lowPressureEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        lowPressureEntries.length;
      const avgHighPressurePain =
        highPressureEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        highPressureEntries.length;

      const diff = avgLowPressurePain - avgHighPressurePain;
      if (Math.abs(diff) > 1) {
        generatedInsights.push({
          id: "pressure",
          type: "pressure",
          title: "Pressure Pattern",
          description:
            diff > 0
              ? `Pain is ${Math.round(Math.abs(diff) * 10) / 10} points higher when pressure is below 1010 hPa`
              : `Pain is ${Math.round(Math.abs(diff) * 10) / 10} points lower when pressure is below 1010 hPa`,
          confidence: Math.min(
            0.9,
            (lowPressureEntries.length + highPressureEntries.length) / 20,
          ),
          icon: "gauge",
        });
      }
    }

    // Analyze lunar phase correlation
    const lunarPhases = ["new_moon", "full_moon"];
    const specialPhaseEntries = entries.filter((e) =>
      lunarPhases.includes(e.environmental_data.lunar.phase),
    );
    const normalPhaseEntries = entries.filter(
      (e) => !lunarPhases.includes(e.environmental_data.lunar.phase),
    );

    if (specialPhaseEntries.length >= 2 && normalPhaseEntries.length >= 3) {
      const avgSpecialPain =
        specialPhaseEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        specialPhaseEntries.length;
      const avgNormalPain =
        normalPhaseEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        normalPhaseEntries.length;

      const diff = avgSpecialPain - avgNormalPain;
      if (diff > 0.5) {
        generatedInsights.push({
          id: "lunar",
          type: "lunar",
          title: "Lunar Pattern",
          description: `Pain is ${Math.round((avgSpecialPain / avgNormalPain - 1) * 100)}% higher during new and full moons`,
          confidence: Math.min(0.8, specialPhaseEntries.length / 10),
          icon: "moon",
        });
      }
    }

    // Analyze geomagnetic activity
    const activeGeoEntries = entries.filter(
      (e) =>
        e.environmental_data.geomagnetic?.kp_index !== undefined &&
        e.environmental_data.geomagnetic.kp_index >= 4,
    );
    const quietGeoEntries = entries.filter(
      (e) =>
        e.environmental_data.geomagnetic?.kp_index !== undefined &&
        e.environmental_data.geomagnetic.kp_index < 4,
    );

    if (activeGeoEntries.length >= 2 && quietGeoEntries.length >= 3) {
      const avgActivePain =
        activeGeoEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        activeGeoEntries.length;
      const avgQuietPain =
        quietGeoEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        quietGeoEntries.length;

      const diff = avgActivePain - avgQuietPain;
      if (diff > 0.5) {
        generatedInsights.push({
          id: "geomagnetic",
          type: "geomagnetic",
          title: "Geomagnetic Pattern",
          description: `Pain increases by ${Math.round(diff * 10) / 10} points during active geomagnetic conditions (Kp≥4)`,
          confidence: Math.min(0.7, activeGeoEntries.length / 8),
          icon: "zap",
        });
      }
    }

    // Analyze pressure trend
    const fallingPressureEntries = entries.filter(
      (e) => e.environmental_data.weather?.pressure_trend === "falling",
    );
    if (fallingPressureEntries.length >= 3) {
      const avgFallingPain =
        fallingPressureEntries.reduce((sum, e) => sum + e.pain_level, 0) /
        fallingPressureEntries.length;
      const avgAllPain =
        entries.reduce((sum, e) => sum + e.pain_level, 0) / entries.length;

      const diff = avgFallingPain - avgAllPain;
      if (diff > 0.3) {
        generatedInsights.push({
          id: "pressure_trend",
          type: "pressure",
          title: "Pressure Trend",
          description: `Pain tends to be higher when barometric pressure is falling`,
          confidence: Math.min(0.75, fallingPressureEntries.length / 10),
          icon: "trending-down",
        });
      }
    }

    return generatedInsights;
  }

  const insights = calculateInsights();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2].map((i) => (
              <Skeleton key={i} className='h-16 w-full' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "gauge":
        return Gauge;
      case "moon":
        return Moon;
      case "zap":
        return Zap;
      case "trending-down":
        return TrendingDown;
      default:
        return Lightbulb;
    }
  };

  const getTypeColor = (type: CorrelationInsight["type"]) => {
    switch (type) {
      case "pressure":
        return "text-weather bg-weather/10";
      case "lunar":
        return "text-lunar bg-lunar/10";
      case "geomagnetic":
        return "text-geomagnetic bg-geomagnetic/10";
      case "solar":
        return "text-solar bg-solar/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2'>
          <Lightbulb className='w-5 h-5 text-amber-500' />
          Correlation Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <div className='text-center py-6 text-muted-foreground'>
            <Lightbulb className='w-12 h-12 mx-auto mb-2 opacity-50' />
            <p>{t("noData")}</p>
            <p className='text-sm'>{t("keepTracking")}</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {insights.map((insight, index) => {
              const Icon = getIcon(insight.icon);

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-xl flex items-start gap-3",
                    getTypeColor(insight.type),
                  )}
                >
                  <Icon className='w-5 h-5 mt-0.5 shrink-0' />
                  <div className='space-y-1 flex-1'>
                    <div className='flex items-center justify-between'>
                      <span className='font-medium text-sm'>
                        {insight.title}
                      </span>
                      <span className='text-xs opacity-70'>
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className='text-sm opacity-90'>{insight.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
