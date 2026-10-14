import type { Metadata } from "next";
import Link from "next/link";
import { formatChange } from "@/lib/analytics/change";
import { describePeriods, todayIsoDate } from "@/lib/analytics/dates";
import { comparePeriods, periodRanges, platformComparison } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { competitorActivity, competitorHighlights } from "@/lib/competitors/activity";
import {
  SAMPLE_COMPETITORS,
  SAMPLE_TRENDS,
  createSampleAds,
  createSamplePosts,
} from "@/lib/competitors/sample-data";
import { topTrends } from "@/lib/competitors/trends";
import type { TrendSource } from "@/lib/competitors/types";
import { KpiTile } from "./_components/kpi-tile";
import { KpiTiles } from "./_components/kpi-tiles";
import { cardClass, cardHeadingClass, linkClass, pageClass, subtitleClass, titleClass } from "./_components/styles";
import { SummaryCard } from "./_components/summary-card";

export const metadata: Metadata = {
  title: "Overview",
};

const numberFormat = new Intl.NumberFormat("en-US");

const SOURCE_LABELS: Record<TrendSource, string> = {
  social: "Social",
  search: "Search",
  industry: "Industry",
};

function CompetitorActivityCard({ today }: { today: string }) {
  const highlights = competitorHighlights(
    competitorActivity(SAMPLE_COMPETITORS, createSamplePosts(today), createSampleAds(today)),
  );
  const { mostActive, bestEngagement } = highlights;

  return (
    <section aria-labelledby="competitor-activity" className={cardClass}>
      <h2 id="competitor-activity" className={cardHeadingClass}>Competitor activity</h2>
      {mostActive === null || bestEngagement === null ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No competitor posts this week.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>{`Most active: ${mostActive.competitor.name} (${mostActive.postsThisWeek} posts this week)`}</li>
          <li>{`Best engagement: ${bestEngagement.competitor.name} (${formatPercent(bestEngagement.engagementRate, 1)})`}</li>
          <li>{`Ads running: ${highlights.activeAds} across ${highlights.competitorsWithAds} competitors`}</li>
        </ul>
      )}
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Sample data: fictional competitors.</p>
      <Link href="/competitors" className={`mt-3 inline-block ${linkClass}`}>Compare competitors</Link>
    </section>
  );
}

function TrendsCard() {
  const trends = topTrends(SAMPLE_TRENDS);
  return (
    <section aria-labelledby="trends" className={cardClass}>
      <h2 id="trends" className={cardHeadingClass}>Trends</h2>
      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
        {trends.map((trend) => (
          <li key={trend.label} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{trend.label}</span>
            <span className="flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              {trend.relevant && <span className="text-emerald-700 dark:text-emerald-400">Relevant to you</span>}
              <span>{SOURCE_LABELS[trend.source]}</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{`+${formatPercent(trend.growth)}`}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Sample trends, growth over the last week.</p>
    </section>
  );
}

export default function OverviewPage() {
  // Sample data until real social accounts are connected (see docs/DISCOVERY.md).
  const today = todayIsoDate();
  const rows = createSampleData(today);
  const comparison = comparePeriods(rows);
  const platforms = platformComparison(rows);

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>Overview</h1>
      <p className={subtitleClass}>{`${describePeriods(periodRanges(rows))} Showing sample data.`}</p>

      <div className="mt-6">
        <KpiTiles comparison={comparison} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SummaryCard lines={buildSummary(rows)} />
        </div>
        <section aria-labelledby="market-highlights" className={cardClass}>
          <h2 id="market-highlights" className={cardHeadingClass}>Market highlights</h2>
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
        <h2 id="platform-comparison" className={cardHeadingClass}>Platform comparison</h2>
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
        <CompetitorActivityCard today={today} />
        <TrendsCard />
      </div>

      <Link href="/analytics" className={`mt-8 inline-block ${linkClass}`}>View full analytics</Link>
    </main>
  );
}
