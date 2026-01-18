"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type ConditionType =
  | "temperature"
  | "pressure"
  | "humidity"
  | "wind"
  | "lunar"
  | "geomagnetic"
  | "solar"
  | "tidal"
  | "sunrise"
  | "sunset";

interface ConditionCardProps {
  type: ConditionType;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  colorClass: string;
  bgClass: string;
  valueColorClass?: string;
}

export function ConditionCard({
  type,
  icon: Icon,
  label,
  value,
  subValue,
  colorClass,
  bgClass,
  valueColorClass,
}: ConditionCardProps) {
  return (
    <Link href={`/conditions/${type}`}>
      <motion.div
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          "p-3 rounded-xl space-y-1 cursor-pointer",
          "transition-shadow duration-200",
          "hover:shadow-lg hover:shadow-black/20",
          "hover:ring-2 hover:ring-white/10",
          bgClass
        )}
      >
        <div className={cn("flex items-center gap-2", colorClass)}>
          <Icon className="w-4 h-4 shrink-0" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <div className={cn("text-2xl font-bold", valueColorClass)}>
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-muted-foreground">{subValue}</div>
        )}
      </motion.div>
    </Link>
  );
}
