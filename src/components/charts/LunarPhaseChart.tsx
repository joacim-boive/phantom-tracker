"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMoonPhaseEmoji } from "@/lib/environmental/lunar";
import { cn } from "@/lib/utils";
import type { PainEntry } from "@/types";

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

export function LunarPhaseChart({ entries, isLoading, currentPhase }: LunarPhaseChartProps) {
  const phaseData = useMemo(() => {
    const phaseCounts: Record<string, { count: number; totalPain: number }> = {};
    
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
    
    // Find max after mapping
    const maxAvg = Math.max(...data.map(d => d.avgPain), 0);
    
    return { data, maxAvg };
  }, [entries]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = entries.length > 0;
  const centerX = 120;
  const centerY = 120;
  const radius = 90;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-lunar" />
          Pain by Lunar Phase
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {/* Background circle */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            
            {/* Inner reference circles */}
            {[30, 60].map((r) => (
              <circle
                key={r}
                cx={centerX}
                cy={centerY}
                r={r}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            ))}
            
            {/* Phase segments */}
            {phaseData.data.map((phase, index) => {
              const angleRad = (phase.angle - 90) * (Math.PI / 180);
              const x = centerX + Math.cos(angleRad) * radius;
              const y = centerY + Math.sin(angleRad) * radius;
              
              // Calculate bar height based on average pain
              const barHeight = hasData && phaseData.maxAvg > 0
                ? (phase.avgPain / 10) * 60
                : 0;
              
              const isCurrentPhase = phase.id === currentPhase;
              
              return (
                <g key={phase.id}>
                  {/* Radial bar */}
                  {barHeight > 0 && (
                    <motion.line
                      x1={centerX + Math.cos(angleRad) * 30}
                      y1={centerY + Math.sin(angleRad) * 30}
                      x2={centerX + Math.cos(angleRad) * (30 + barHeight)}
                      y2={centerY + Math.sin(angleRad) * (30 + barHeight)}
                      stroke={`hsl(var(--${phase.avgPain <= 3 ? "chart-5" : phase.avgPain <= 6 ? "chart-3" : "chart-4"}))`}
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                    />
                  )}
                  
                  {/* Phase emoji */}
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={cn(
                      "text-lg",
                      isCurrentPhase && "animate-pulse"
                    )}
                    style={{ fontSize: isCurrentPhase ? "24px" : "18px" }}
                  >
                    {phase.emoji}
                  </text>
                  
                  {/* Count label */}
                  {phase.count > 0 && (
                    <text
                      x={centerX + Math.cos(angleRad) * 50}
                      y={centerY + Math.sin(angleRad) * 50}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="10"
                    >
                      {phase.avgPain}/10
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 8}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
              fontSize="12"
              fontWeight="bold"
            >
              {entries.length}
            </text>
            <text
              x={centerX}
              y={centerY + 8}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="10"
            >
              entries
            </text>
          </svg>
        </div>
        
        {!hasData && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Log entries to see lunar patterns
          </p>
        )}
      </CardContent>
    </Card>
  );
}
