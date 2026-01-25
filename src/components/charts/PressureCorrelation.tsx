"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPainColor } from "@/lib/foot-regions";
import type { PainEntry } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gauge, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PressureCorrelationProps {
  entries: PainEntry[];
  isLoading: boolean;
}

export function PressureCorrelation({
  entries,
  isLoading,
}: PressureCorrelationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  function calculatePressureData() {
    if (entries.length === 0) {
      return { chartData: [], correlation: 0, avgPressure: 1013 };
    }

    const data = entries.map((entry) => ({
      pressure: entry.environmental_data.weather.pressure,
      painLevel: entry.pain_level,
      date: entry.created_at,
      color: getPainColor(entry.pain_level),
    }));

    // Calculate simple correlation coefficient
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.pressure, 0);
    const sumY = data.reduce((sum, d) => sum + d.painLevel, 0);
    const sumXY = data.reduce((sum, d) => sum + d.pressure * d.painLevel, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.pressure * d.pressure, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.painLevel * d.painLevel, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    const r = denominator === 0 ? 0 : numerator / denominator;
    const avg = sumX / n;

    return {
      chartData: data,
      correlation: Math.round(r * 100) / 100,
      avgPressure: Math.round(avg),
    };
  }

  const { chartData, correlation, avgPressure } = calculatePressureData();

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

  const hasData = chartData.length >= 2;

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='flex items-center gap-2'>
          <Gauge className='w-5 h-5 text-weather' />
          Pressure vs Pain
        </CardTitle>

        {hasData && (
          <div className='relative' ref={menuRef}>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setMenuOpen(!menuOpen)}
              className='h-8 px-2 text-sm'
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </Button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className='absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg p-3 z-50 min-w-[180px]'
                >
                  <div className='flex items-center gap-2 text-sm'>
                    <span className='text-muted-foreground'>Correlation:</span>
                    <span
                      className={
                        correlation < -0.3
                          ? "text-emerald-500"
                          : correlation > 0.3
                            ? "text-rose-500"
                            : "text-foreground font-medium"
                      }
                    >
                      {correlation > 0 ? "+" : ""}
                      {correlation}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className='h-64 flex items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <TrendingUp className='w-12 h-12 mx-auto mb-2 opacity-50' />
              <p>Need more data to show correlation</p>
              <p className='text-xs'>Log at least 2 entries</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='h-64'
          >
            <ResponsiveContainer width='100%' height='100%'>
              <ScatterChart
                margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--border))'
                />
                <XAxis
                  type='number'
                  dataKey='pressure'
                  name='Pressure'
                  unit=' hPa'
                  domain={["auto", "auto"]}
                  stroke='var(--chart-axis-label)'
                  tick={{ fill: "var(--chart-axis-label)" }}
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  type='number'
                  dataKey='painLevel'
                  name='Pain Level'
                  domain={[0, 10]}
                  stroke='var(--chart-axis-label)'
                  tick={{ fill: "var(--chart-axis-label)" }}
                  fontSize={12}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className='bg-popover text-popover-foreground border rounded-lg shadow-lg p-3 text-sm'>
                        <p>
                          Pressure:{" "}
                          <span className='font-bold'>{data.pressure} hPa</span>
                        </p>
                        <p>
                          Pain Level:{" "}
                          <span className='font-bold'>{data.painLevel}/10</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  x={avgPressure}
                  stroke='var(--chart-weather-color)'
                  strokeDasharray='5 5'
                  strokeOpacity={0.5}
                  label={{
                    value: `Avg: ${avgPressure}`,
                    position: "top",
                    fill: "var(--chart-axis-label)",
                    fontSize: 10,
                  }}
                />
                <Scatter
                  data={chartData}
                  fill='var(--chart-weather-color)'
                  fillOpacity={0.7}
                  animationDuration={1000}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
