import type { Metadata } from "next";
import Link from "next/link";
import { roundPercent } from "@/lib/analytics/change";
import { comparePeriods, platformComparison } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { KpiTile } from "./_components/kpi-tile";
import { KpiTiles } from "./_components/kpi-tiles";
import { SummaryCard } from "./_components/summary-card";

export const metadata: Metadata = {
  title: "Overview",
};

const numberFormat = new Intl.NumberFormat("en-US");

const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
const headingClass = "text-lg font-semibold text-zinc-950 dark:text-zinc-50";

function formatChange(change: number | null): string {
  if (change === null) {
    return "No data";
  }
  const percent = roundPercent(change);
  return percent > 0 ? `+${percent}%` : `${percent}%`;
}

function ComingSoonCard({ title, description, href }: { title: string; description: string; href?: string }) {
  const id = `card-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={id} className={cardClass}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className={headingClass}>{title}</h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Coming soon</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      {href && (
        <Link href={href} className="mt-3 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4 dark:text-zinc-300">
          See what is planned
        </Link>
      )}
    </section>
  );
}

export default function OverviewPage() {
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const rows = createSampleData();
  const comparison = comparePeriods(rows);
  const platforms = platformComparison(rows);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
        Overview
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        How your marketing did this week. Showing sample data.
      </p>

      <div className="mt-6">
        <KpiTiles comparison={comparison} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SummaryCard lines={buildSummary(rows)} />
        </div>
        <section aria-labelledby="market-highlights" className={cardClass}>
          <h2 id="market-highlights" className={headingClass}>Market highlights</h2>
          <div className="mt-3 grid gap-3">
            <KpiTile label="Clicks" value={numberFormat.format(comparison.current.clicks)} change={comparison.change.clicks} />
            <KpiTile
              label="Click-through rate"
              value={formatPercent(comparison.current.clickThroughRate, 2)}
              change={comparison.change.clickThroughRate}
            />
          </div>
        </section>
      </div>

      <section className={`mt-8 ${cardClass}`}>
        <h2 id="platform-comparison" className={headingClass}>Platform comparison</h2>
        <div className="mt-3 overflow-x-auto">
          <table aria-labelledby="platform-comparison" className="w-full min-w-md text-left text-sm">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
                <th scope="col" className="py-2 pr-4 font-medium">Impressions</th>
                <th scope="col" className="py-2 pr-4 font-medium">Engagement rate</th>
                <th scope="col" className="py-2 font-medium">Change vs last week</th>
              </tr>
            </thead>
            <tbody className="text-zinc-800 dark:text-zinc-200">
              {platforms.map(({ platform, current, change }) => (
                <tr key={platform} className="border-t border-zinc-200 dark:border-zinc-800">
                  <th scope="row" className="py-2 pr-4 font-medium">{PLATFORM_LABELS[platform]}</th>
                  <td className="py-2 pr-4">{numberFormat.format(current.impressions)}</td>
                  <td className="py-2 pr-4">{formatPercent(current.engagementRate, 1)}</td>
                  <td className="py-2">{formatChange(change.engagementRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ComingSoonCard
          title="Competitor activity"
          description="Posting frequency, engagement, top posts, hashtags, and active ads for the competitors you follow."
          href="/competitors"
        />
        <ComingSoonCard
          title="Trends"
          description="Trends across social platforms, search, and your industry, filtered for your business."
        />
      </div>

      <Link
        href="/analytics"
        className="mt-8 inline-block text-sm font-medium text-zinc-700 underline underline-offset-4 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
      >
        View full analytics
      </Link>
    </main>
  );
}
