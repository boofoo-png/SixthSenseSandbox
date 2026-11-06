import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import {
  adCsv,
  adInsights,
  adRowsBetween,
  byCountry,
  byPlatform,
  change,
  dailyRevenue,
  kpis,
  money,
  peakDay,
  performanceScore,
  reportPeriod,
  topCampaigns,
  totals,
} from "@/lib/reports/ads";
import { makePageClass } from "../_components/make-ui";
import { ReportsDashboard } from "./_components/reports-dashboard";

export const metadata: Metadata = {
  title: "Reports",
  description: "Ad spend, revenue, ROAS, impressions, conversions, and clicks, with insights, countries, and top campaigns.",
};

// Reports ("Insights / Reports") from the team's design file and functionality list (2026-11-05),
// on sample Google and Meta ad data (user's choice). The period is 7 or 30 days, stored as the
// date bar's `period` like the Overview's switch.
export default async function ReportsPage({ searchParams }: PageProps<"/insights">) {
  const { period: raw } = await searchParams;
  const days = raw === "last-30-days" ? 30 : 7;
  const today = todayIsoDate();
  const period = reportPeriod(days, today);
  const rows = adRowsBetween({ start: period.previous.start, end: today });
  const now = totals(rows.filter((row) => row.date >= period.current.start));
  const before = totals(rows.filter((row) => row.date <= period.previous.end));
  const daily = dailyRevenue(rows, period.current);
  const campaigns = topCampaigns(rows, period);
  const best = campaigns.filter((item) => item.revenueChange !== null).toSorted((a, b) => (b.revenueChange ?? 0) - (a.revenueChange ?? 0))[0];
  const countries = byCountry(rows, period.current);
  const pct = (value: number | null) => (value === null ? "no change" : `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`);
  const word = days === 7 ? "week" : "30 days";

  return (
    <main className={makePageClass}>
      <ReportsDashboard
        data={{
          days,
          kpis: kpis(rows, period),
          platforms: byPlatform(rows, period.current),
          daily,
          peak: peakDay(daily, before.revenue / days),
          insights: { ...adInsights(rows, period), lines: [adInsights(rows, period, 0).lines, adInsights(rows, period, 1).lines] },
          full: {
            wentWell: best ? `${best.name} on ${best.platform} grew revenue ${pct(best.revenueChange)} at a ${best.roas.toFixed(1)}× ROAS.` : "No campaign data yet.",
            compared: `Revenue ${pct(change(now.revenue, before.revenue))}, conversions ${pct(change(now.conversions, before.conversions))}, and spend ${pct(change(now.spend, before.spend))} compared with the previous ${word}.`,
            revenue: `${money(now.revenue)} in revenue from ${money(now.spend)} in spend; ${countries[0]?.name ?? "Canada"} brought in the most.`,
          },
          countries,
          countryGrowth: change(now.revenue, before.revenue),
          campaigns,
          score: performanceScore(campaigns),
          earned: now.revenue,
          earnedChange: change(now.revenue, before.revenue),
          csv: adCsv(rows, period.current),
          fileName: `sixth-sense-ads-${period.current.start}-to-${period.current.end}.csv`,
        }}
      />
    </main>
  );
}
