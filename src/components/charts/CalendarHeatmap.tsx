"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PainEntry } from "@/types";

interface CalendarHeatmapProps {
  entries: PainEntry[];
  isLoading: boolean;
}

export function CalendarHeatmap({ entries, isLoading }: CalendarHeatmapProps) {
  const { weeks } = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 84); // 12 weeks
    const start = startOfWeek(startDate, { weekStartsOn: 1 });
    
    // Create map of entries by date
    const entriesByDate = new Map<string, { count: number; avgPain: number; maxPain: number }>();
    entries.forEach((entry) => {
      const dateKey = format(new Date(entry.created_at), "yyyy-MM-dd");
      const existing = entriesByDate.get(dateKey);
      if (existing) {
        const newCount = existing.count + 1;
        entriesByDate.set(dateKey, {
          count: newCount,
          avgPain: (existing.avgPain * existing.count + entry.pain_level) / newCount,
          maxPain: Math.max(existing.maxPain, entry.pain_level),
        });
      } else {
        entriesByDate.set(dateKey, {
          count: 1,
          avgPain: entry.pain_level,
          maxPain: entry.pain_level,
        });
      }
    });
    
    // Generate weeks
    const days = eachDayOfInterval({ start, end: today });
    const weeksData: Array<Array<{
      date: Date;
      dateKey: string;
      count: number;
      avgPain: number;
      maxPain: number;
    }>> = [];
    
    let currentWeek: typeof weeksData[0] = [];
    let max = 0;
    
    days.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const data = entriesByDate.get(dateKey) ?? { count: 0, avgPain: 0, maxPain: 0 };
      if (data.count > max) max = data.count;
      
      currentWeek.push({ date: day, dateKey, ...data });
      
      if (currentWeek.length === 7) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeksData.push(currentWeek);
    }
    
    return { weeks: weeksData, maxCount: max };
  }, [entries]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getIntensityClass = (avgPain: number, count: number): string => {
    if (count === 0) return "bg-muted";
    if (avgPain <= 3) return "bg-emerald-500/40";
    if (avgPain <= 5) return "bg-amber-500/40";
    if (avgPain <= 7) return "bg-orange-500/40";
    return "bg-rose-500/40";
  };

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="w-3 h-3 text-[8px] text-muted-foreground flex items-center justify-center"
              >
                {i % 2 === 0 ? label : ""}
              </div>
            ))}
          </div>
          
          {/* Weeks */}
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const isToday = isSameDay(day.date, new Date());
                  
                  return (
                    <motion.div
                      key={day.dateKey}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                      className={cn(
                        "w-3 h-3 rounded-sm transition-colors",
                        getIntensityClass(day.avgPain, day.count),
                        isToday && "ring-1 ring-primary"
                      )}
                      title={`${format(day.date, "MMM d")}: ${day.count} entries${day.count > 0 ? `, avg ${day.avgPain.toFixed(1)}/10` : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
            <div className="w-3 h-3 rounded-sm bg-amber-500/40" />
            <div className="w-3 h-3 rounded-sm bg-orange-500/40" />
            <div className="w-3 h-3 rounded-sm bg-rose-500/40" />
          </div>
          <span>More pain</span>
        </div>
      </CardContent>
    </Card>
  );
}
