import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import { comparePeriods } from "@/lib/analytics/kpis";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import { pageDates } from "@/lib/date-range";
import { DateRangeBar } from "../_components/date-range-bar";
import { KpiTiles } from "../_components/kpi-tiles";
import { pageClass, subtitleClass, titleClass } from "../_components/styles";
import { SummaryCard } from "../_components/summary-card";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Marketing performance for the dates you choose.",
};

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const today = todayIsoDate();
  const dates = pageDates(await searchParams, today);
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const rows = sampleDataBetween(dates.dataRange);

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>Analytics</h1>
      <p className={subtitleClass}>Showing sample data.</p>

      <div className="mt-6">
        <DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />
      </div>

      <div className="mt-6">
        <KpiTiles comparison={comparePeriods(rows, dates.ranges)} compareLabel={dates.comparisonLabel} />
      </div>

      <div className="mt-8">
        <SummaryCard
          lines={buildSummary(rows, {
            ranges: dates.ranges,
            currentPhrase: `during ${dates.currentLabel}`,
            comparisonPhrase: dates.comparisonLabel,
          })}
        />
      </div>
    </main>
  );
}
