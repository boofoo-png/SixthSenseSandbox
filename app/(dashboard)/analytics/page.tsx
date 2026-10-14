import type { Metadata } from "next";
import { describePeriods, todayIsoDate } from "@/lib/analytics/dates";
import { comparePeriods, periodRanges } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import { KpiTiles } from "../_components/kpi-tiles";
import { SummaryCard } from "../_components/summary-card";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Marketing performance for the last 7 days.",
};

export default function AnalyticsPage() {
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const rows = createSampleData(todayIsoDate());

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {`${describePeriods(periodRanges(rows))} Showing sample data.`}
      </p>

      <div className="mt-6">
        <KpiTiles comparison={comparePeriods(rows)} />
      </div>

      <div className="mt-8">
        <SummaryCard lines={buildSummary(rows)} />
      </div>
    </main>
  );
}
