"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Activity, TrendingUp, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getPainColorClass, getPainColor } from "@/lib/foot-regions";
import type { PainEntry } from "@/types";

interface PainOverviewProps {
  entries: PainEntry[];
  isLoading: boolean;
}

type TimeRange = 7 | 30 | 90;

export function PainOverview({ entries, isLoading }: PainOverviewProps) {
  const t = useTranslations("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const stats = useMemo(() => {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        averagePainLevel: 0,
        mostAffectedRegion: "N/A",
        mostAffectedPercentage: 0,
        entriesInPeriod: 0,
        filteredEntries: [] as PainEntry[],
      };
    }

    // Calculate date range, normalized to start of day (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - timeRange);

    // Filter entries from the selected period
    const filteredEntries = entries.filter((e) => {
      const entryDate = new Date(e.created_at);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= startDate;
    });

    // Use filtered entries for stats, but fall back to all entries if no filtered entries
    const entriesForStats = filteredEntries.length > 0 ? filteredEntries : entries;

    // Calculate average pain level
    const avgPain =
      entriesForStats.reduce((sum, e) => sum + e.pain_level, 0) /
      (entriesForStats.length || 1);

    // Find most affected region
    const regionCounts: Record<string, number> = {};
    entriesForStats.forEach((e) => {
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
        ? Math.round((topRegion[1] / entriesForStats.length) * 100)
        : 0,
      entriesInPeriod: filteredEntries.length,
      filteredEntries,
    };
  }, [entries, timeRange]);

  // Prepare chart data for trend graph
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - timeRange);

    // Create array of all days in range
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Group entries by day
    const entriesByDay = new Map<string, PainEntry[]>();
    stats.filteredEntries.forEach((entry) => {
      const day = format(new Date(entry.created_at), "yyyy-MM-dd");
      if (!entriesByDay.has(day)) {
        entriesByDay.set(day, []);
      }
      entriesByDay.get(day)!.push(entry);
    });

    // Build chart data
    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const dayEntries = entriesByDay.get(dayKey) ?? [];

      const avgPain = dayEntries.length > 0
        ? dayEntries.reduce((sum, e) => sum + e.pain_level, 0) / dayEntries.length
        : null;

      return {
        date: format(day, timeRange === 7 ? "EEE" : timeRange === 30 ? "MMM d" : "MMM d"),
        fullDate: dayKey,
        avgPain: avgPain ? Math.round(avgPain * 10) / 10 : null,
        count: dayEntries.length,
      };
    });
  }, [stats.filteredEntries, timeRange]);

  const hasData = chartData.some((d) => d.avgPain !== null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      icon: Calendar,
      label: `${timeRange}d`,
      value: stats.entriesInPeriod,
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
      label: t("totalEntries"),
      value: stats.totalEntries,
      suffix: "",
      color: "text-muted-foreground",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            {t("painOverview")}
          </CardTitle>
          
          {/* Time range selector */}
          <div className="flex gap-1">
            {([7, 30, 90] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
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

        {/* Trend graph */}
        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground rounded-lg border border-dashed">
            <div className="text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noDataForPeriod")}</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--chart-axis-label)"
                  tick={{ fill: "var(--chart-axis-label)" }}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={timeRange === 7 ? 0 : timeRange === 30 ? "preserveStartEnd" : "preserveStartEnd"}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="var(--chart-axis-label)"
                  tick={{ fill: "var(--chart-axis-label)" }}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const painLevel = data.avgPain ?? 0;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-xs text-muted-foreground mb-1">
                            {data.fullDate}
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getPainColor(painLevel) }}
                            />
                            <span className="text-sm font-medium">
                              {data.avgPain !== null ? `${data.avgPain}/10` : "No data"}
                            </span>
                            {data.count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({data.count} {data.count === 1 ? "entry" : "entries"})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPain"
                  stroke={getPainColor(stats.averagePainLevel || 5)}
                  strokeWidth={2}
                  dot={{ r: 3, fill: getPainColor(stats.averagePainLevel || 5) }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
