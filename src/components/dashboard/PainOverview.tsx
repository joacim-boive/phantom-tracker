"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getPainColorClass } from "@/lib/foot-regions";
import type { PainEntry } from "@/types";

interface PainOverviewProps {
  entries: PainEntry[];
  isLoading: boolean;
}

export function PainOverview({ entries, isLoading }: PainOverviewProps) {
  const t = useTranslations("dashboard");

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        averagePainLevel: 0,
        mostAffectedRegion: "N/A",
        mostAffectedPercentage: 0,
        entriesLast30Days: 0,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEntries = entries.filter(
      (e) => new Date(e.created_at) >= thirtyDaysAgo
    );

    // Calculate average pain level
    const avgPain =
      recentEntries.reduce((sum, e) => sum + e.pain_level, 0) /
      (recentEntries.length || 1);

    // Find most affected region
    const regionCounts: Record<string, number> = {};
    recentEntries.forEach((e) => {
      const region = e.pain_point_name ?? "Unknown";
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    const sortedRegions = Object.entries(regionCounts).sort(
      (a, b) => b[1] - a[1]
    );
    const topRegion = sortedRegions[0];

    return {
      totalEntries: entries.length,
      averagePainLevel: Math.round(avgPain * 10) / 10,
      mostAffectedRegion: topRegion?.[0] ?? "N/A",
      mostAffectedPercentage: topRegion
        ? Math.round((topRegion[1] / recentEntries.length) * 100)
        : 0,
      entriesLast30Days: recentEntries.length,
    };
  }, [entries]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: Calendar,
      label: t("last30Days"),
      value: stats.entriesLast30Days,
      suffix: t("entries"),
      color: "text-primary",
    },
    {
      icon: Activity,
      label: t("avgPain"),
      value: stats.averagePainLevel,
      suffix: "/10",
      color: getPainColorClass(Math.round(stats.averagePainLevel)),
    },
    {
      icon: MapPin,
      label: t("mostAffected"),
      value: stats.mostAffectedRegion,
      suffix: `(${stats.mostAffectedPercentage}%)`,
      color: "text-primary",
    },
    {
      icon: TrendingUp,
      label: "Total entries",
      value: stats.totalEntries,
      suffix: "",
      color: "text-muted-foreground",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          {t("painOverview")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-xl bg-muted/50"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <item.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("text-xl font-bold", item.color)}>
                  {item.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.suffix}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
