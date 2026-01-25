"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

  function handleChange(values: number[]) {
    onChange(values[0]);
  }

  // Get color based on pain level
  function getColorClass() {
    if (value <= 3) return "text-emerald-500";
    if (value <= 6) return "text-amber-500";
    return "text-rose-500";
  }

  function getBgClass() {
    if (value <= 3) return "bg-emerald-500";
    if (value <= 6) return "bg-amber-500";
    return "bg-rose-500";
  }

  const colorClass = getColorClass();
  const bgClass = getBgClass();

  return (
    <div className={cn("space-y-3", className)}>
      {showLabels && (
        <div className='flex items-center justify-between'>
          <span className='text-sm text-muted-foreground'>Pain Level</span>
          <div className='flex items-center gap-2'>
            <span className={cn("text-2xl font-bold tabular-nums", colorClass)}>
              {value}
            </span>
            <span className='text-muted-foreground'>/10</span>
          </div>
        </div>
      )}

      <Slider
        value={[value]}
        onValueChange={handleChange}
        min={1}
        max={10}
        step={1}
        className='w-full'
        rangeClassName={bgClass}
      />

      {showLabels && (
        <div className='flex justify-between text-xs text-muted-foreground'>
          <span>{t("1")}</span>
          <span className={cn("font-medium", colorClass)}>
            {t(
              String(value) as
                | "1"
                | "2"
                | "3"
                | "4"
                | "5"
                | "6"
                | "7"
                | "8"
                | "9"
                | "10",
            )}
          </span>
          <span>{t("10")}</span>
        </div>
      )}
    </div>
  );
}
