"use client";

import { useCallback, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PainSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  showLabels?: boolean;
}

export function PainSlider({
  value,
  onChange,
  className,
  showLabels = true,
}: PainSliderProps) {
  const t = useTranslations("painLevels");

  const handleChange = useCallback(
    (values: number[]) => {
      onChange(values[0]);
    },
    [onChange]
  );

  // Get color based on pain level
  const colorClass = useMemo(() => {
    if (value <= 3) return "text-emerald-500";
    if (value <= 6) return "text-amber-500";
    return "text-rose-500";
  }, [value]);

  const bgClass = useMemo(() => {
    if (value <= 3) return "bg-emerald-500";
    if (value <= 6) return "bg-amber-500";
    return "bg-rose-500";
  }, [value]);

  // Gradient track style
  const trackStyle = useMemo(() => ({
    background: `linear-gradient(to right, 
      oklch(0.7 0.17 160) 0%, 
      oklch(0.75 0.18 85) 50%, 
      oklch(0.65 0.22 25) 100%)`,
  }), []);

  return (
    <div className={cn("space-y-3", className)}>
      {showLabels && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pain Level</span>
          <div className="flex items-center gap-2">
            <span className={cn("text-2xl font-bold tabular-nums", colorClass)}>
              {value}
            </span>
            <span className="text-muted-foreground">/10</span>
          </div>
        </div>
      )}

      <div className="relative">
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        
        {/* Custom gradient track overlay */}
        <div 
          className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-30"
          style={trackStyle}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("1")}</span>
          <span className={cn("font-medium", colorClass)}>
            {t(String(value) as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10")}
          </span>
          <span>{t("10")}</span>
        </div>
      )}

      {/* Visual indicator bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", bgClass)}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}
