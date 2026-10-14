import type { Metadata } from "next";
import Link from "next/link";
import { formatChange } from "@/lib/analytics/change";
import { describePeriods, todayIsoDate } from "@/lib/analytics/dates";
import { periodRanges } from "@/lib/analytics/kpis";
import { formatPercent } from "@/lib/analytics/summary";
import { competitorActivity, weeklyEngagement } from "@/lib/competitors/activity";
import { SAMPLE_COMPETITORS, createSampleAds, createSamplePosts } from "@/lib/competitors/sample-data";
import { cardClass, pageClass, subtitleClass, titleClass } from "../_components/styles";
import { EngagementChart } from "./_components/engagement-chart";

export const metadata: Metadata = {
  title: "Competitors",
};

export default function CompetitorsPage() {
  const today = todayIsoDate();
  const posts = createSamplePosts(today);
  const activity = competitorActivity(SAMPLE_COMPETITORS, posts, createSampleAds(today));

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>Competitors</h1>
      <p className={subtitleClass}>
        {`${describePeriods(periodRanges(posts))} Sample data: these competitors are fictional businesses.`}
      </p>

      <section className={`mt-6 ${cardClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <caption className="sr-only">Competitor comparison</caption>
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Competitor</th>
                <th scope="col" className="py-2 pr-4 font-medium">Posts this week</th>
                <th scope="col" className="py-2 pr-4 font-medium">Engagement rate</th>
                <th scope="col" className="py-2 pr-4 font-medium">Change vs last week</th>
                <th scope="col" className="py-2 font-medium">Active ads</th>
              </tr>
            </thead>
            <tbody className="text-zinc-800 dark:text-zinc-200">
              {activity.map((row) => (
                <tr key={row.competitor.slug} className="border-t border-zinc-200 dark:border-zinc-800">
                  <th scope="row" className="py-3 pr-4 font-medium">
                    <Link
                      href={`/competitors/${row.competitor.slug}`}
                      className="text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
                    >
                      {row.competitor.name}
                    </Link>
                  </th>
                  <td className="py-3 pr-4">{row.postsThisWeek}</td>
                  <td className="py-3 pr-4">{formatPercent(row.engagementRate, 1)}</td>
                  <td className="py-3 pr-4">{formatChange(row.engagementRateChange)}</td>
                  <td className="py-3">{row.activeAds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8">
        <EngagementChart data={weeklyEngagement(SAMPLE_COMPETITORS, posts)} />
      </div>
    </main>
  );
}
