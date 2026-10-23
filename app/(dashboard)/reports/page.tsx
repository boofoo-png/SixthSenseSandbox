import type { Metadata } from "next";
import { formatDateRange, todayIsoDate } from "@/lib/analytics/dates";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { formatPercent } from "@/lib/analytics/summary";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { pageDates } from "@/lib/date-range";
import { buildExecutiveReport } from "@/lib/reports/executive";
import { DateRangeBar } from "../_components/date-range-bar";
import { KpiTiles } from "../_components/kpi-tiles";
import { cardClass, cardHeadingClass, pageClass, subtitleClass, titleClass } from "../_components/styles";
import { SummaryCard } from "../_components/summary-card";
import { PrintButton } from "./_components/print-button";

export const metadata: Metadata = {
  title: "Reports",
  description: "A one-page executive overview you can print or save as a PDF.",
};

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const today = todayIsoDate();
  const dates = pageDates(await searchParams, today);
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const report = buildExecutiveReport(sampleDataBetween(dates.dataRange), {
    ranges: dates.ranges,
    currentPhrase: `during ${dates.currentLabel}`,
    comparisonPhrase: dates.comparisonLabel,
  });

  return (
    <main className={`${pageClass} print:max-w-none print:p-0`}>
      <div className="print:hidden">
        <h1 className={titleClass}>Reports</h1>
        <p className={subtitleClass}>A one-page summary to share with your team or clients.</p>
        <div className="mt-6">
          <DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />
        </div>
        <div className="mt-6">
          <PrintButton />
        </div>
      </div>

      <section aria-labelledby="executive-overview" className="mt-8 space-y-6 print:mt-0">
        <header className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h2 id="executive-overview" className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Executive overview</h2>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>{`Period: ${dates.currentLabel}`}</p>
            <p>{`Compared with: ${dates.comparisonLabel}`}</p>
            <p>{`Prepared on: ${formatDateRange({ start: today, end: today }, true)}`}</p>
          </div>
        </header>

        <div className="print:break-inside-avoid">
          <KpiTiles comparison={report.comparison} compareLabel={dates.comparisonLabel} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <section aria-labelledby="what-changed" className={`${cardClass} print:break-inside-avoid`}>
            <h3 id="what-changed" className={cardHeadingClass}>What changed</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700 dark:text-zinc-300">
              {report.changes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="best-platform" className={`${cardClass} print:break-inside-avoid`}>
            <h3 id="best-platform" className={cardHeadingClass}>Best platform</h3>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300">
              {report.bestPlatform === null
                ? "No platform data for this period."
                : `${PLATFORM_LABELS[report.bestPlatform.platform]}: ${formatPercent(report.bestPlatform.engagementRate, 1)} engagement rate`}
            </p>
          </section>
        </div>

        <div className="print:break-inside-avoid">
          <SummaryCard lines={report.summary} />
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">Sample data: numbers are made up until real accounts are connected.</p>
      </section>
    </main>
  );
}
