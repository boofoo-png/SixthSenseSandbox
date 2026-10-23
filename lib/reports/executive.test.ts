import { describe, expect, it } from "vitest";
import { comparePeriods, type KpiTotals, type PeriodComparison } from "@/lib/analytics/kpis";
import { buildSummary } from "@/lib/analytics/summary";
import type { DailyMetrics, Platform } from "@/lib/analytics/types";
import { buildExecutiveReport, whatChanged } from "./executive";

function totals(values: Partial<KpiTotals>): KpiTotals {
  return { impressions: 0, engagements: 0, clicks: 0, followers: 0, engagementRate: 0, clickThroughRate: 0, ...values };
}

function comparison(current: Partial<KpiTotals>, previous: Partial<KpiTotals>, change: Partial<PeriodComparison["change"]>): PeriodComparison {
  return {
    current: totals(current),
    previous: totals(previous),
    change: { impressions: 0, engagements: 0, clicks: 0, followers: 0, engagementRate: 0, clickThroughRate: 0, ...change },
  };
}

describe("whatChanged", () => {
  it("lists the three biggest noticeable moves, biggest first, with both numbers", () => {
    const lines = whatChanged(
      comparison(
        { impressions: 48200, engagements: 3150, followers: 12400, clicks: 300, engagementRate: 0.0654 },
        { impressions: 43000, engagements: 2400, followers: 12000, clicks: 400, engagementRate: 0.0558 },
        { impressions: 0.121, engagements: 0.3125, followers: 0.033, clicks: -0.25, engagementRate: 0.172 },
      ),
      "Sep 27 - Oct 2",
    );
    expect(lines).toEqual([
      "Engagements up 31% (3,150 vs 2,400).",
      "Clicks down 25% (300 vs 400).",
      "Engagement rate up 17% (6.5% vs 5.6%).",
    ]);
  });

  it("leaves out small changes and changes with nothing to compare", () => {
    const lines = whatChanged(
      comparison({ impressions: 1000, clicks: 50 }, { impressions: 990, clicks: 0 }, { impressions: 0.01, clicks: null }),
      "last week",
    );
    expect(lines).toEqual(["Everything held steady compared with last week."]);
  });
});

describe("buildExecutiveReport", () => {
  // Two full calendar weeks: Instagram engages more in the second, TikTok best overall.
  function rows(platform: Platform, lastWeek: number, thisWeek: number): DailyMetrics[] {
    return Array.from({ length: 14 }, (_, i) => ({
      platform,
      date: `2026-10-${String(i + 4).padStart(2, "0")}`,
      impressions: 1000,
      engagements: i < 7 ? lastWeek : thisWeek,
      clicks: 10,
      followers: 500,
    }));
  }
  const data = [...rows("instagram", 40, 50), ...rows("tiktok", 70, 80)];
  const ranges = {
    current: { start: "2026-10-11", end: "2026-10-17" },
    comparison: { start: "2026-10-04", end: "2026-10-10" },
  };
  const options = { ranges, currentPhrase: "during Oct 11 - 17", comparisonPhrase: "Oct 4 - 10" };

  it("includes the headline comparison for the chosen dates", () => {
    expect(buildExecutiveReport(data, options).comparison).toEqual(comparePeriods(data, ranges));
  });

  it("names the best platform by engagement rate", () => {
    const report = buildExecutiveReport(data, options);
    expect(report.bestPlatform?.platform).toBe("tiktok");
    expect(report.bestPlatform?.engagementRate).toBeCloseTo(0.08);
  });

  it("includes what changed and the plain-English summary", () => {
    const report = buildExecutiveReport(data, options);
    expect(report.changes[0]).toBe("Engagements up 18% (910 vs 770).");
    expect(report.summary).toEqual(buildSummary(data, options));
  });

  it("has no best platform when there is no data", () => {
    expect(buildExecutiveReport([], options).bestPlatform).toBeNull();
  });
});
