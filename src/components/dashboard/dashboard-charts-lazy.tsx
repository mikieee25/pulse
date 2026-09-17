"use client";

import dynamic from "next/dynamic";

const ChartSkeleton = () => (
  <div
    className="h-80 w-full animate-pulse rounded-xl bg-paper/5"
    aria-label="Loading chart"
  />
);
export const InventoryByDivisionChart = dynamic(
  () =>
    import("./dashboard-charts").then(
      (module) => module.InventoryByDivisionChart
    ),
  { ssr: false, loading: ChartSkeleton }
);
export const StatusBreakdownChart = dynamic(
  () =>
    import("./dashboard-charts").then((module) => module.StatusBreakdownChart),
  { ssr: false, loading: ChartSkeleton }
);
