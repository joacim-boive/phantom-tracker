"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistoricalWeather } from "@/hooks/useHistoricalWeather";
import type { ConditionConfig, ConditionType } from "@/lib/conditions";
import type { HistoricalWeatherPoint } from "@/lib/environmental/history";
import { getPainColor } from "@/lib/foot-regions";
import type { Coordinates, PainEntry } from "@/types";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Calendar, Info, Loader2, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ConditionHistoryChartProps {
  type: ConditionType;
  entries: PainEntry[];
  isLoading: boolean;
  config: ConditionConfig;
  coordinates: Coordinates | null;
}

type TimeRange = "7d" | "30d" | "90d";

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  conditionValue: number | null;
  painLevel: number | null;
  painColor: string;
  hasPain: boolean;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

/**
 * Extract condition value from historical weather data based on type
 */
function getConditionValueFromHistory(
  type: ConditionType,
  point: HistoricalWeatherPoint,
): number | null {
  switch (type) {
    case "temperature":
      return point.temperature;
    case "pressure":
      return point.pressure;
    case "humidity":
      return point.humidity;
    case "wind":
      return point.wind_speed;
    default:
      // For non-weather conditions (lunar, solar, etc.), we don't have historical data
      return null;
  }
}

export function ConditionHistoryChart({
  type,
  entries,
  isLoading: isLoadingEntries,
  config,
  coordinates,
}: ConditionHistoryChartProps) {
  const t = useTranslations();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const days = TIME_RANGE_DAYS[timeRange];
  const { data: historicalWeather, isLoading: isLoadingHistory } =
    useHistoricalWeather(coordinates, days);

  // Check if this condition type supports historical weather data
  const supportsHistoricalWeather = [
    "temperature",
    "pressure",
    "humidity",
    "wind",
  ].includes(type);

  function calculateConditionData() {
    // Create a map of dates to weather data
    const weatherByDate = new Map<string, HistoricalWeatherPoint>();
    if (supportsHistoricalWeather && historicalWeather) {
      for (const point of historicalWeather) {
        weatherByDate.set(point.date, point);
      }
    }

    // Create a map of dates to pain entries
    const painByDate = new Map<string, PainEntry[]>();
    for (const entry of entries) {
      const dateKey = format(parseISO(entry.created_at), "yyyy-MM-dd");
      const existing = painByDate.get(dateKey) || [];
      existing.push(entry);
      painByDate.set(dateKey, existing);
    }

    // Get all unique dates
    const allDates = new Set<string>();
    weatherByDate.forEach((_, date) => allDates.add(date));
    painByDate.forEach((_, date) => allDates.add(date));

    // Build chart data
    const data: ChartDataPoint[] = [];
    let totalConditionValue = 0;
    let conditionCount = 0;
    let totalPain = 0;
    let painCount = 0;

    allDates.forEach((dateKey) => {
      const weatherPoint = weatherByDate.get(dateKey);
      const painEntries = painByDate.get(dateKey);

      // Get condition value from historical weather
      let conditionValue: number | null = null;
      if (weatherPoint && supportsHistoricalWeather) {
        conditionValue = getConditionValueFromHistory(type, weatherPoint);
      } else if (painEntries && painEntries.length > 0) {
        // Fall back to condition value from pain entries
        const values = painEntries
          .map((e) => config.getValueFromEntry(e))
          .filter((v): v is number => v !== null);
        if (values.length > 0) {
          conditionValue =
            values.reduce((sum, v) => sum + v, 0) / values.length;
        }
      }

      // Get average pain for the day
      let avgPain: number | null = null;
      if (painEntries && painEntries.length > 0) {
        avgPain =
          painEntries.reduce((sum, e) => sum + e.pain_level, 0) /
          painEntries.length;
        totalPain += avgPain;
        painCount++;
      }

      if (conditionValue !== null) {
        totalConditionValue += conditionValue;
        conditionCount++;
      }

      // Only add data point if we have at least condition or pain data
      if (conditionValue !== null || avgPain !== null) {
        data.push({
          date: dateKey,
          dateLabel: format(parseISO(dateKey), "MMM d"),
          conditionValue,
          painLevel: avgPain !== null ? Math.round(avgPain * 10) / 10 : null,
          painColor: avgPain !== null ? getPainColor(Math.round(avgPain)) : "",
          hasPain: avgPain !== null && avgPain > 0,
        });
      }
    });

    // Sort by date
    data.sort((a, b) => a.date.localeCompare(b.date));

    const avgCondition =
      conditionCount > 0 ? totalConditionValue / conditionCount : 0;
    const avgPainLevel = painCount > 0 ? totalPain / painCount : 0;

    return {
      chartData: data,
      stats:
        data.length > 0
          ? {
              avgCondition,
              avgPainLevel,
              dataPoints: data.length,
            }
          : null,
      hasPainData: painCount > 0,
    };
  }

  const { chartData, stats, hasPainData } = calculateConditionData();

  const isLoading =
    isLoadingEntries || (supportsHistoricalWeather && isLoadingHistory);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2'>
          <CardTitle className='flex items-center gap-2'>
            <config.icon className={`w-5 h-5 ${config.colorClass}`} />
            {t("conditions.historicalData")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-80'>
            <div className='flex flex-col items-center gap-2 text-muted-foreground'>
              <Loader2 className='w-8 h-8 animate-spin' />
              <span className='text-sm'>{t("conditions.loadingHistory")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = chartData.length >= 1;
  const Icon = config.icon;

  // Get the chart line color - using direct color values for Recharts compatibility
  const chartColor =
    type === "lunar"
      ? "#a78bfa" // purple
      : type === "geomagnetic"
        ? "#f87171" // red/coral
        : type === "solar"
          ? "#fbbf24" // amber/gold
          : type === "tidal"
            ? "#38bdf8" // sky blue
            : "#2dd4bf"; // teal - primary chart color for weather

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "7d", label: t("conditions.timeRange.7d") },
    { value: "30d", label: t("conditions.timeRange.30d") },
    { value: "90d", label: t("conditions.timeRange.90d") },
  ];

  return (
    <Card>
      <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2'>
        <CardTitle className='flex items-center gap-2'>
          <Icon className={`w-5 h-5 ${config.colorClass}`} />
          {t("conditions.historicalData")}
        </CardTitle>

        <div className='flex items-center gap-1'>
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? "secondary" : "ghost"}
              size='sm'
              onClick={() => setTimeRange(option.value)}
              className='text-xs px-2 py-1 h-7'
            >
              {option.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className='h-80 flex items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <TrendingUp className='w-12 h-12 mx-auto mb-2 opacity-50' />
              <p>{t("conditions.noData")}</p>
              <p className='text-xs'>{t("conditions.noDataHint")}</p>
              {!supportsHistoricalWeather && (
                <p className='text-xs mt-2'>
                  {t("conditions.noHistoricalApiHint")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='space-y-4'
          >
            {/* Stats Summary */}
            {stats && (
              <div className='grid grid-cols-3 gap-4 mb-4'>
                <div className={`p-3 rounded-lg ${config.bgClass}`}>
                  <div className='text-xs text-muted-foreground'>
                    {t("conditions.avgCondition")}
                  </div>
                  <div className={`text-lg font-bold ${config.colorClass}`}>
                    {config.formatValue(stats.avgCondition)}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-muted/50'>
                  <div className='text-xs text-muted-foreground'>
                    {t("conditions.avgPain")}
                  </div>
                  <div className='text-lg font-bold'>
                    {hasPainData ? `${stats.avgPainLevel.toFixed(1)}/10` : "—"}
                  </div>
                </div>
                <div className='p-3 rounded-lg bg-muted/50'>
                  <div className='text-xs text-muted-foreground'>
                    {t("conditions.dataPoints")}
                  </div>
                  <div className='text-lg font-bold flex items-center gap-1'>
                    <Calendar className='w-4 h-4' />
                    {stats.dataPoints}
                  </div>
                </div>
              </div>
            )}

            {/* Info banner when no pain data */}
            {!hasPainData && (
              <div className='flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground'>
                <Info className='w-4 h-4 shrink-0' />
                <span>{t("conditions.noPainDataYet")}</span>
              </div>
            )}

            {/* Chart */}
            <div className='h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='#374151'
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey='dateLabel'
                    stroke='#9ca3af'
                    tick={{ fill: "#9ca3af" }}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval='preserveStartEnd'
                  />
                  <YAxis
                    yAxisId='condition'
                    orientation='left'
                    stroke='#9ca3af'
                    tick={{ fill: "#9ca3af" }}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    domain={config.yAxisDomain}
                    tickFormatter={(value) => {
                      if (type === "sunrise" || type === "sunset") {
                        const hours = Math.floor(value / 60);
                        return `${hours}:00`;
                      }
                      return value;
                    }}
                  />
                  {hasPainData && (
                    <YAxis
                      yAxisId='pain'
                      orientation='right'
                      stroke='#f87171'
                      tick={{ fill: "#f87171" }}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                      domain={[0, 10]}
                    />
                  )}
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as ChartDataPoint;
                      return (
                        <div className='bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-sm'>
                          <p className='font-medium mb-2'>{data.dateLabel}</p>
                          {data.conditionValue !== null && (
                            <p className='flex items-center gap-2'>
                              <span
                                className={`w-2 h-2 rounded-full ${config.bgIndicator}`}
                              />
                              {t(config.titleKey)}:{" "}
                              <span className='font-bold'>
                                {config.formatValue(data.conditionValue)}
                              </span>
                            </p>
                          )}
                          {data.painLevel !== null && data.hasPain && (
                            <p className='flex items-center gap-2'>
                              <span
                                className='w-2 h-2 rounded-full'
                                style={{ backgroundColor: data.painColor }}
                              />
                              {t("conditions.painLevel")}:{" "}
                              <span className='font-bold'>
                                {data.painLevel}/10
                              </span>
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign='top'
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                        {value}
                      </span>
                    )}
                  />

                  {/* Reference line for average condition */}
                  {stats && stats.dataPoints > 1 && (
                    <ReferenceLine
                      yAxisId='condition'
                      y={stats.avgCondition}
                      stroke='#6b7280'
                      strokeDasharray='5 5'
                      strokeOpacity={0.6}
                    />
                  )}

                  {/* Condition Line - smooth curve with visible dots */}
                  <Line
                    yAxisId='condition'
                    type='natural'
                    dataKey='conditionValue'
                    name={t(config.titleKey)}
                    stroke={chartColor}
                    strokeWidth={2.5}
                    dot={{
                      r: 5,
                      fill: chartColor,
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: chartColor,
                      stroke: "hsl(var(--background))",
                      strokeWidth: 2,
                    }}
                    connectNulls
                    animationDuration={1000}
                  />

                  {/* Pain Bars - only show if we have pain data */}
                  {hasPainData && (
                    <Bar
                      yAxisId='pain'
                      dataKey='painLevel'
                      name={t("conditions.painLevel")}
                      fill='hsl(var(--destructive))'
                      fillOpacity={0.3}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pain Indicator Legend - only show if we have pain data */}
            {hasPainData && (
              <div className='flex items-center justify-center gap-4 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <div className='w-3 h-3 rounded-full bg-emerald-500' />
                  <span>{t("conditions.lowPain")}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='w-3 h-3 rounded-full bg-amber-500' />
                  <span>{t("conditions.mediumPain")}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='w-3 h-3 rounded-full bg-rose-500' />
                  <span>{t("conditions.highPain")}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
