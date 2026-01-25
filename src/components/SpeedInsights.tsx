"use client";

import dynamic from "next/dynamic";

// Defer SpeedInsights loading until after hydration
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
);

export function SpeedInsightsClient() {
  return <SpeedInsights />;
}
