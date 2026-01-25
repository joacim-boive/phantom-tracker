"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PainEntry } from "@/types";
import { addDays, eachDayOfInterval, format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PainTimelineProps {
  entries: PainEntry[];
  isLoading: boolean;
}

type TimeRange = 7 | 30 | 90;

export function PainTimeline({ entries, isLoading }: PainTimelineProps) {
  const t = useTranslations("dashboard");
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [endDateOffset, setEndDateOffset] = useState<number>(0); // Days offset from today for the end date (0 = today, positive = past)

  // Calculate the current date range
  function calculateDateRange() {
    const baseEndDate = new Date();
    const endDate = addDays(baseEndDate, -endDateOffset);
    const startDate = subDays(endDate, timeRange);
    return { startDate, endDate };
  }

  const currentDateRange = calculateDateRange();

  function calculateChartData() {
    const { startDate, endDate } = currentDateRange;

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

      const avgPain =
        dayEntries.length > 0
          ? dayEntries.reduce((sum, e) => sum + e.pain_level, 0) /
            dayEntries.length
          : null;

      const maxPain =
        dayEntries.length > 0
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
  }

  const chartData = calculateChartData();

  // Calculate date range for display
  const dateRangeDisplay = {
    start: format(currentDateRange.startDate, "MMM d"),
    end: format(currentDateRange.endDate, "MMM d"),
  };

  // Find the oldest entry date to limit backward navigation
  function getOldestEntryDate() {
    if (entries.length === 0) return null;
    const dates = entries.map((e) => new Date(e.created_at).getTime());
    return new Date(Math.min(...dates));
  }

  const oldestEntryDate = getOldestEntryDate();

  // Check if we can navigate forward (towards today)
  const canNavigateForward = endDateOffset > 0;

  // Check if we can navigate backward (into the past)
  function checkCanNavigateBackward() {
    if (!oldestEntryDate) return false;
    const { startDate } = currentDateRange;
    return startDate > oldestEntryDate;
  }

  const canNavigateBackward = checkCanNavigateBackward();

  const handlePrevious = () => {
    // Move the entire range backward by the time range
    setEndDateOffset((prev) => prev + timeRange);
  };

  const handleNext = () => {
    // Move the entire range forward by the time range
    setEndDateOffset((prev) => Math.max(0, prev - timeRange));
  };

  const handleToday = () => {
    setEndDateOffset(0);
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    // Keep the start date the same, adjust the end date
    // The original logic uses subDays(endDate, timeRange) to get startDate,
    // so to reverse it: endDate = addDays(startDate, timeRange)
    const { startDate } = currentDateRange;
    const newEndDate = addDays(startDate, newRange);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);

    // Calculate days difference (positive = past, negative = future)
    const daysDiff = Math.ceil(
      (today.getTime() - newEndDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If new end date is in the future, clamp to today (offset = 0)
    // Otherwise, use the calculated offset
    const newEndDateOffset = Math.max(0, daysDiff);

    setTimeRange(newRange);
    setEndDateOffset(newEndDateOffset);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.some((d) => d.avgPain !== null);

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex flex-row items-center justify-between mb-2'>
          <CardTitle className='flex items-center gap-2'>
            <TrendingUp className='w-5 h-5 text-primary' />
            {t("painTimeline")}
          </CardTitle>

          {/* Time range selector */}
          <div className='flex gap-1'>
            {([7, 30, 90] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size='sm'
                onClick={() => handleTimeRangeChange(range)}
                className='text-xs'
              >
                {range}d
              </Button>
            ))}
          </div>
        </div>

        {/* Navigation controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handlePrevious}
              disabled={!canNavigateBackward}
              className='h-8 px-2'
            >
              <ChevronLeft className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleNext}
              disabled={!canNavigateForward}
              className='h-8 px-2'
            >
              <ChevronRight className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToday}
              disabled={endDateOffset === 0}
              className='h-8 px-2 text-xs'
            >
              Today
            </Button>
          </div>
          <div className='text-sm text-muted-foreground'>
            {dateRangeDisplay.start} - {dateRangeDisplay.end}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className='h-64 flex items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <Calendar className='w-12 h-12 mx-auto mb-2 opacity-50' />
              <p>No data for this time range</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='h-64'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id='painGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor='var(--chart-weather-color)'
                      stopOpacity={0.3}
                    />
                    <stop
                      offset='95%'
                      stopColor='var(--chart-weather-color)'
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--border))'
                  vertical={false}
                />
                <XAxis
                  dataKey='date'
                  stroke='var(--chart-axis-label)'
                  tick={{ fill: "var(--chart-axis-label)" }}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval='preserveStartEnd'
                />
                <YAxis
                  domain={[0, 10]}
                  stroke='var(--chart-axis-label)'
                  tick={{ fill: "var(--chart-axis-label)" }}
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
                      <div className='bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-sm'>
                        <p className='font-medium'>{label}</p>
                        {data.avgPain !== null ? (
                          <>
                            <p>
                              Avg pain:{" "}
                              <span className='font-bold'>
                                {data.avgPain}/10
                              </span>
                            </p>
                            <p>
                              Max pain:{" "}
                              <span className='font-bold'>
                                {data.maxPain}/10
                              </span>
                            </p>
                            <p className='text-muted-foreground'>
                              {data.count} entries
                            </p>
                          </>
                        ) : (
                          <p className='text-muted-foreground'>No entries</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='avgPain'
                  stroke='var(--chart-weather-color)'
                  strokeWidth={2}
                  fill='url(#painGradient)'
                  connectNulls
                  animationDuration={1000}
                  animationEasing='ease-out'
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
