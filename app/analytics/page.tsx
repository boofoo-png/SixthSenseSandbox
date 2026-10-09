import type { Metadata } from "next";
import { comparePeriods } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { KpiTile } from "./kpi-tile";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Marketing performance for the last 7 days.",
};

const numberFormat = new Intl.NumberFormat("en-US");

export default function AnalyticsPage() {
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const rows = createSampleData();
  const { current, change } = comparePeriods(rows);
  const summary = buildSummary(rows);

  const tiles = [
    { label: "Impressions", value: numberFormat.format(current.impressions), change: change.impressions },
    { label: "Engagements", value: numberFormat.format(current.engagements), change: change.engagements },
    { label: "Engagement rate", value: formatPercent(current.engagementRate, 1), change: change.engagementRate },
    { label: "Followers", value: numberFormat.format(current.followers), change: change.followers },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        Analytics
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Last 7 days compared with the 7 days before. Showing sample data.
      </p>

      <section aria-label="Key metrics" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <KpiTile key={tile.label} {...tile} />
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          This week in plain English
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
