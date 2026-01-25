"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMoonPhaseEmoji } from "@/lib/environmental/lunar";
import { cn } from "@/lib/utils";
import type { PainEntry } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Moon } from "lucide-react";
import { useState } from "react";

interface LunarPhaseChartProps {
  entries: PainEntry[];
  isLoading: boolean;
  currentPhase?: string;
}

const LUNAR_PHASES = [
  { id: "new_moon", name: "New Moon", angle: 0 },
  { id: "waxing_crescent", name: "Waxing Crescent", angle: 45 },
  { id: "first_quarter", name: "First Quarter", angle: 90 },
  { id: "waxing_gibbous", name: "Waxing Gibbous", angle: 135 },
  { id: "full_moon", name: "Full Moon", angle: 180 },
  { id: "waning_gibbous", name: "Waning Gibbous", angle: 225 },
  { id: "last_quarter", name: "Last Quarter", angle: 270 },
  { id: "waning_crescent", name: "Waning Crescent", angle: 315 },
];

export function LunarPhaseChart({
  entries,
  isLoading,
  currentPhase,
}: LunarPhaseChartProps) {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  function calculatePhaseData() {
    const phaseCounts: Record<string, { count: number; totalPain: number }> =
      {};

    // Initialize all phases
    LUNAR_PHASES.forEach((phase) => {
      phaseCounts[phase.id] = { count: 0, totalPain: 0 };
    });

    // Count entries per phase
    entries.forEach((entry) => {
      const phase = entry.environmental_data.lunar.phase;
      if (phaseCounts[phase]) {
        phaseCounts[phase].count++;
        phaseCounts[phase].totalPain += entry.pain_level;
      }
    });

    // Calculate averages
    const data = LUNAR_PHASES.map((phase) => {
      const { count, totalPain } = phaseCounts[phase.id];
      const avgPain = count > 0 ? totalPain / count : 0;

      return {
        ...phase,
        count,
        avgPain: Math.round(avgPain * 10) / 10,
        emoji: getMoonPhaseEmoji(phase.id),
      };
    });

    // Find max count for bar length scaling
    const maxCount = Math.max(...data.map((d) => d.count), 0);

    return { data, maxCount };
  }

  const phaseData = calculatePhaseData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-64 w-full rounded-full' />
        </CardContent>
      </Card>
    );
  }

  const hasData = entries.length > 0;
  const centerX = 120;
  const centerY = 120;
  const radius = 90;

  // Function to get color based on pain level (green to red gradient)
  function getPainColor(avgPain: number): string {
    if (avgPain === 0) return "#22c55e"; // green
    if (avgPain <= 3) return "#84cc16"; // lime-green
    if (avgPain <= 6) return "#eab308"; // yellow
    if (avgPain <= 8) return "#f97316"; // orange
    return "#ef4444"; // red
  }

  function handleMouseEnter(
    phaseId: string,
    event: React.MouseEvent<SVGElement>,
  ) {
    setHoveredPhase(phaseId);
    const container = event.currentTarget.closest(".relative");
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  }

  function handleMouseMove(
    phaseId: string,
    event: React.MouseEvent<SVGElement>,
  ) {
    if (hoveredPhase === phaseId) {
      const container = event.currentTarget.closest(".relative");
      if (container) {
        const rect = container.getBoundingClientRect();
        setTooltipPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
    }
  }

  function handleMouseLeave() {
    setHoveredPhase(null);
  }

  const hoveredPhaseData = phaseData.data.find((p) => p.id === hoveredPhase);

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2'>
          <Moon className='w-5 h-5 text-lunar' />
          Pain by Lunar Phase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex justify-center relative'>
          <svg
            width='240'
            height='240'
            viewBox='0 0 240 240'
            className='relative'
          >
            {/* Background circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill='none'
              stroke='var(--chart-axis-label)'
              strokeWidth='1'
              strokeOpacity={0.3}
            />

            {/* Inner reference circles */}
            {[30, 60].map((r) => (
              <circle
                key={r}
                cx={centerX}
                cy={centerY}
                r={r}
                fill='none'
                stroke='var(--chart-axis-label)'
                strokeWidth='0.5'
                strokeOpacity={0.2}
                strokeDasharray='3 3'
              />
            ))}

            {/* Phase segments */}
            {phaseData.data.map((phase, index) => {
              const angleRad = (phase.angle - 90) * (Math.PI / 180);
              const x = centerX + Math.cos(angleRad) * radius;
              const y = centerY + Math.sin(angleRad) * radius;

              // Calculate bar height based on entry count (most entries = longest)
              const barHeight =
                hasData && phaseData.maxCount > 0
                  ? (phase.count / phaseData.maxCount) * 60
                  : 0;

              const isCurrentPhase = phase.id === currentPhase;
              const barColor = getPainColor(phase.avgPain);

              return (
                <g key={phase.id}>
                  {/* Radial bar */}
                  {barHeight > 0 && (
                    <motion.line
                      x1={centerX + Math.cos(angleRad) * 30}
                      y1={centerY + Math.sin(angleRad) * 30}
                      x2={centerX + Math.cos(angleRad) * (30 + barHeight)}
                      y2={centerY + Math.sin(angleRad) * (30 + barHeight)}
                      stroke={barColor}
                      strokeWidth='12'
                      strokeLinecap='round'
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      onMouseEnter={(e) => handleMouseEnter(phase.id, e)}
                      onMouseMove={(e) => handleMouseMove(phase.id, e)}
                      onMouseLeave={handleMouseLeave}
                      style={{ cursor: "pointer" }}
                    />
                  )}

                  {/* Phase emoji - also hoverable */}
                  <text
                    x={x}
                    y={y}
                    textAnchor='middle'
                    dominantBaseline='middle'
                    className={cn(
                      "text-lg cursor-pointer",
                      isCurrentPhase && "animate-pulse",
                    )}
                    style={{ fontSize: isCurrentPhase ? "24px" : "18px" }}
                    onMouseEnter={(e) => handleMouseEnter(phase.id, e)}
                    onMouseMove={(e) => handleMouseMove(phase.id, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {phase.emoji}
                  </text>
                </g>
              );
            })}

            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor='middle'
              fill='var(--chart-axis-label)'
              fontSize='12'
              fontWeight='bold'
            >
              {entries.length}
            </text>
            <text
              x={centerX}
              y={centerY + 8}
              textAnchor='middle'
              fill='var(--chart-axis-label)'
              fontSize='10'
            >
              entries
            </text>
          </svg>

          {/* Animated tooltip */}
          <AnimatePresence>
            {hoveredPhase && hoveredPhaseData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2 }}
                className='absolute pointer-events-none z-10'
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: "translate(-50%, -100%) translateY(-8px)",
                }}
              >
                <div className='bg-popover text-popover-foreground border rounded-lg shadow-lg px-3 py-2 text-sm whitespace-nowrap'>
                  <div className='font-semibold mb-1'>
                    {hoveredPhaseData.name}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground'>Pain:</span>
                    <span
                      className='font-bold'
                      style={{ color: getPainColor(hoveredPhaseData.avgPain) }}
                    >
                      {hoveredPhaseData.avgPain}/10
                    </span>
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {hoveredPhaseData.count}{" "}
                    {hoveredPhaseData.count === 1 ? "entry" : "entries"}
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div
                  className='absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover'
                  style={{ marginTop: "-1px" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!hasData && (
          <p className='text-center text-sm text-muted-foreground mt-4'>
            Log entries to see lunar patterns
          </p>
        )}
      </CardContent>
    </Card>
  );
}
