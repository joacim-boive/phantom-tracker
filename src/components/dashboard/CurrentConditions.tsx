"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getKpColorClass } from "@/lib/environmental/geomagnetic";
import { getMoonPhaseEmoji } from "@/lib/environmental/lunar";
import { getSolarColorClass } from "@/lib/environmental/solar";
import { cn } from "@/lib/utils";
import type { EnvironmentalData } from "@/types";
import { motion } from "framer-motion";
import {
  Cloud,
  Droplets,
  Gauge,
  Magnet,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CurrentConditionsProps {
  data: EnvironmentalData | null;
  isLoading: boolean;
}

interface ConditionCardItemProps {
  type: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  colorClass: string;
  bgClass: string;
  valueColorClass?: string;
}

function ConditionCardItem({
  type,
  icon: Icon,
  label,
  value,
  subValue,
  colorClass,
  bgClass,
  valueColorClass,
}: ConditionCardItemProps) {
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
        <div className={cn("text-2xl font-bold", valueColorClass)}>{value}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground">{subValue}</div>
        )}
      </motion.div>
    </Link>
  );
}

export function CurrentConditions({ data, isLoading }: CurrentConditionsProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Environmental data unavailable
        </CardContent>
      </Card>
    );
  }

  const { weather, lunar, geomagnetic, solar, tidal, temporal } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-weather" />
          {t("dashboard.currentConditions")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Temperature */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="temperature"
              icon={Thermometer}
              label={t("weather.temperature")}
              value={`${weather.temperature}°C`}
              subValue={`${t("weather.feelsLike")} ${weather.feels_like}°C`}
              colorClass="text-weather"
              bgClass="bg-weather/10"
            />
          </motion.div>

          {/* Pressure */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="pressure"
              icon={Gauge}
              label={t("weather.pressure")}
              value={weather.pressure}
              subValue={
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      weather.pressure_trend === "rising" && "text-emerald-500",
                      weather.pressure_trend === "falling" && "text-rose-500"
                    )}
                  >
                    {weather.pressure_trend === "rising"
                      ? "↑"
                      : weather.pressure_trend === "falling"
                        ? "↓"
                        : "→"}
                  </span>
                  {t(`weather.${weather.pressure_trend}`)} hPa
                </span>
              }
              colorClass="text-weather"
              bgClass="bg-weather/10"
            />
          </motion.div>

          {/* Humidity */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="humidity"
              icon={Droplets}
              label={t("weather.humidity")}
              value={`${weather.humidity}%`}
              subValue={
                <span className="capitalize">{weather.weather_description}</span>
              }
              colorClass="text-weather"
              bgClass="bg-weather/10"
            />
          </motion.div>

          {/* Wind */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="wind"
              icon={Wind}
              label={t("weather.wind")}
              value={weather.wind_speed}
              subValue="m/s"
              colorClass="text-weather"
              bgClass="bg-weather/10"
            />
          </motion.div>

          {/* Lunar */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="lunar"
              icon={Moon}
              label={t("lunar.title")}
              value={getMoonPhaseEmoji(lunar.phase)}
              subValue={`${lunar.phase_name} (${Math.round(lunar.illumination * 100)}%)`}
              colorClass="text-lunar"
              bgClass="bg-lunar/10"
            />
          </motion.div>

          {/* Geomagnetic */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="geomagnetic"
              icon={Magnet}
              label={t("geomagnetic.title")}
              value={`Kp ${geomagnetic.kp_index}`}
              subValue={geomagnetic.kp_label}
              colorClass="text-geomagnetic"
              bgClass="bg-geomagnetic/10"
              valueColorClass={getKpColorClass(geomagnetic.kp_index)}
            />
          </motion.div>

          {/* Solar */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="solar"
              icon={Sun}
              label={t("solar.title")}
              value={solar.xray_flux ?? "N/A"}
              subValue="X-ray class"
              colorClass="text-solar"
              bgClass="bg-solar/10"
              valueColorClass={getSolarColorClass(solar.xray_class)}
            />
          </motion.div>

          {/* Tidal (if available) */}
          {tidal && (
            <motion.div variants={itemVariants}>
              <ConditionCardItem
                type="tidal"
                icon={Waves}
                label={t("tidal.title")}
                value={`${tidal.current_height_m}m`}
                subValue={t(`tidal.${tidal.tidal_phase}`)}
                colorClass="text-tidal"
                bgClass="bg-tidal/10"
              />
            </motion.div>
          )}

          {/* Sunrise */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="sunrise"
              icon={Sunrise}
              label={t("temporal.sunrise")}
              value={temporal.sunrise}
              colorClass="text-amber-500"
              bgClass="bg-amber-500/10"
            />
          </motion.div>

          {/* Sunset */}
          <motion.div variants={itemVariants}>
            <ConditionCardItem
              type="sunset"
              icon={Sunset}
              label={t("temporal.sunset")}
              value={temporal.sunset}
              colorClass="text-orange-500"
              bgClass="bg-orange-500/10"
            />
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
