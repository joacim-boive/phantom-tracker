"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import type { PainEntry } from "@/types";

interface PainTimelineProps {
  entries: PainEntry[];
  isLoading: boolean;
}

type TimeRange = 7 | 30 | 90;

export function PainTimeline({ entries, isLoading }: PainTimelineProps) {
  const t = useTranslations("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, timeRange);
    
    // Create array of all days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Group entries by day
    const entriesByDay = new Map<string, PainEntry[]>();
    entries.forEach((entry) => {
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
      
      const maxPain = dayEntries.length > 0
        ? Math.max(...dayEntries.map((e) => e.pain_level))
        : null;
      
      return {
        date: format(day, "MMM d"),
        fullDate: dayKey,
        avgPain: avgPain ? Math.round(avgPain * 10) / 10 : null,
        maxPain,
        count: dayEntries.length,
      };
    });
  }, [entries, timeRange]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some((d) => d.avgPain !== null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t("painTimeline")}
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
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data for this time range</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="painGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-medium">{label}</p>
                        {data.avgPain !== null ? (
                          <>
                            <p>Avg pain: <span className="font-bold">{data.avgPain}/10</span></p>
                            <p>Max pain: <span className="font-bold">{data.maxPain}/10</span></p>
                            <p className="text-muted-foreground">{data.count} entries</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">No entries</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgPain"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#painGradient)"
                  connectNulls
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
