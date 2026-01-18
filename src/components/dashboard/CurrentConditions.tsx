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
    Wind
} from "lucide-react";
import { useTranslations } from "next-intl";

interface CurrentConditionsProps {
  data: EnvironmentalData | null;
  isLoading: boolean;
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
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-weather/10 space-y-1"
          >
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 shrink-0 text-weather" />
              <span className="text-xs font-medium text-weather">{t("weather.temperature")}</span>
            </div>
            <div className="text-2xl font-bold">{weather.temperature}°C</div>
            <div className="text-xs text-muted-foreground">
              {t("weather.feelsLike")} {weather.feels_like}°C
            </div>
          </motion.div>

          {/* Pressure */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-weather/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-weather">
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-medium">{t("weather.pressure")}</span>
            </div>
            <div className="text-2xl font-bold">{weather.pressure}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={cn(
                weather.pressure_trend === "rising" && "text-emerald-500",
                weather.pressure_trend === "falling" && "text-rose-500"
              )}>
                {weather.pressure_trend === "rising" ? "↑" : weather.pressure_trend === "falling" ? "↓" : "→"}
              </span>
              {t(`weather.${weather.pressure_trend}`)} hPa
            </div>
          </motion.div>

          {/* Humidity */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-weather/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-weather">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-medium">{t("weather.humidity")}</span>
            </div>
            <div className="text-2xl font-bold">{weather.humidity}%</div>
            <div className="text-xs text-muted-foreground capitalize">
              {weather.weather_description}
            </div>
          </motion.div>

          {/* Wind */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-weather/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-weather">
              <Wind className="w-4 h-4" />
              <span className="text-xs font-medium">{t("weather.wind")}</span>
            </div>
            <div className="text-2xl font-bold">{weather.wind_speed}</div>
            <div className="text-xs text-muted-foreground">m/s</div>
          </motion.div>

          {/* Lunar */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-lunar/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-lunar">
              <Moon className="w-4 h-4" />
              <span className="text-xs font-medium">{t("lunar.title")}</span>
            </div>
            <div className="text-2xl font-bold">
              {getMoonPhaseEmoji(lunar.phase)}
            </div>
            <div className="text-xs text-muted-foreground">
              {lunar.phase_name} ({Math.round(lunar.illumination * 100)}%)
            </div>
          </motion.div>

          {/* Geomagnetic */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-geomagnetic/10 space-y-1"
          >
            <div className="flex items-center gap-2">
              <Magnet className="w-4 h-4 shrink-0 text-geomagnetic" />
              <span className="text-xs font-medium text-geomagnetic">{t("geomagnetic.title")}</span>
            </div>
            <div className={cn("text-2xl font-bold", getKpColorClass(geomagnetic.kp_index))}>
              Kp {geomagnetic.kp_index}
            </div>
            <div className="text-xs text-muted-foreground">
              {geomagnetic.kp_label}
            </div>
          </motion.div>

          {/* Solar */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-solar/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-solar">
              <Sun className="w-4 h-4" />
              <span className="text-xs font-medium">{t("solar.title")}</span>
            </div>
            <div className={cn("text-2xl font-bold", getSolarColorClass(solar.xray_class))}>
              {solar.xray_flux ?? "N/A"}
            </div>
            <div className="text-xs text-muted-foreground">
              X-ray class
            </div>
          </motion.div>

          {/* Tidal (if available) */}
          {tidal && (
            <motion.div
              variants={itemVariants}
              className="p-3 rounded-xl bg-tidal/10 space-y-1"
            >
              <div className="flex items-center gap-2 text-tidal">
                <Waves className="w-4 h-4" />
                <span className="text-xs font-medium">{t("tidal.title")}</span>
              </div>
              <div className="text-2xl font-bold">
                {tidal.current_height_m}m
              </div>
              <div className="text-xs text-muted-foreground">
                {t(`tidal.${tidal.tidal_phase}`)}
              </div>
            </motion.div>
          )}

          {/* Sunrise */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-amber-500/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-amber-500">
              <Sunrise className="w-4 h-4" />
              <span className="text-xs font-medium">{t("temporal.sunrise")}</span>
            </div>
            <div className="text-2xl font-bold">{temporal.sunrise}</div>
          </motion.div>

          {/* Sunset */}
          <motion.div
            variants={itemVariants}
            className="p-3 rounded-xl bg-orange-500/10 space-y-1"
          >
            <div className="flex items-center gap-2 text-orange-500">
              <Sunset className="w-4 h-4" />
              <span className="text-xs font-medium">{t("temporal.sunset")}</span>
            </div>
            <div className="text-2xl font-bold">{temporal.sunset}</div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
