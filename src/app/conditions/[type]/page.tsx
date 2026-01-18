"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConditionHistoryChart } from "@/components/charts/ConditionHistoryChart";
import { useEntries } from "@/hooks/useEntries";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEnvironmentalData } from "@/hooks/useEnvironmentalData";
import { conditionConfig, getCurrentValue, type ConditionType } from "@/lib/conditions";

export default function ConditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { entries, isLoading: isLoadingEntries } = useEntries();
  const { coordinates } = useGeolocation();
  const { data: environmentalData, isLoading: isLoadingEnv } = useEnvironmentalData(coordinates);

  const type = params.type as ConditionType;
  const config = conditionConfig[type];

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </div>
    );
  }

  const Icon = config.icon;
  const currentValue = environmentalData ? getCurrentValue(type, environmentalData) : null;

  function handleBack() {
    router.back();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.colorClass}`} />
            <h1 className="text-xl font-bold">{t(config.titleKey)}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Current Value Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={config.bgClass}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.colorClass}`} />
                {t("conditions.currentValue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEnv ? (
                <Skeleton className="h-16 w-32" />
              ) : currentValue !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-bold ${config.colorClass}`}>
                    {config.formatValue(currentValue.value)}
                  </span>
                  {currentValue.trend && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {currentValue.trend === "rising" && (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      )}
                      {currentValue.trend === "falling" && (
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      )}
                      {currentValue.trend === "stable" && (
                        <Minus className="w-4 h-4" />
                      )}
                      <span className="capitalize">{currentValue.trend}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">{t("conditions.noCurrentData")}</p>
              )}
              {currentValue?.extra && (
                <p className="text-sm text-muted-foreground mt-2">{currentValue.extra}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Facts Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${config.colorClass}`} />
                {t("conditions.aboutTitle", { condition: t(config.titleKey) })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                {t(config.descriptionKey)}
              </p>

              {/* Key Facts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {config.facts.map((factKey, index) => (
                  <motion.div
                    key={factKey}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${config.bgIndicator}`} />
                    <span>{t(factKey)}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Historical Data Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ConditionHistoryChart
            type={type}
            entries={entries}
            isLoading={isLoadingEntries}
            config={config}
            coordinates={coordinates}
          />
        </motion.div>
      </main>
    </div>
  );
}
