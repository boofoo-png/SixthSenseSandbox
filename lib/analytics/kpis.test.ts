import { describe, expect, it } from "vitest";
import {
  clickThroughRate,
  comparePeriods,
  computeTotals,
  engagementRate,
  percentChange,
  platformBreakdown,
  platformComparison,
} from "./kpis";
import type { DailyMetrics, Platform } from "./types";

function row(
  platform: Platform,
  date: string,
  values: Partial<Omit<DailyMetrics, "platform" | "date">> = {},
): DailyMetrics {
  return {
    platform,
    date,
    impressions: 100,
    engagements: 10,
    clicks: 2,
    followers: 50,
    ...values,
  };
}

describe("engagementRate", () => {
  it("divides engagements by impressions", () => {
    expect(engagementRate(25, 500)).toBe(0.05);
  });

  it("returns 0 when there are no impressions", () => {
    expect(engagementRate(0, 0)).toBe(0);
    expect(engagementRate(5, 0)).toBe(0);
  });
});

describe("clickThroughRate", () => {
  it("divides clicks by impressions", () => {
    expect(clickThroughRate(15, 1000)).toBe(0.015);
  });

  it("returns 0 when there are no impressions", () => {
    expect(clickThroughRate(3, 0)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("returns zeros for empty input", () => {
    expect(computeTotals([])).toEqual({
      impressions: 0,
      engagements: 0,
      clicks: 0,
      followers: 0,
      engagementRate: 0,
      clickThroughRate: 0,
    });
  });

  it("includes the click-through rate", () => {
    const totals = computeTotals([
      row("instagram", "2026-10-01", { impressions: 400, clicks: 6 }),
      row("tiktok", "2026-10-01", { impressions: 600, clicks: 4 }),
    ]);
    expect(totals.clickThroughRate).toBe(0.01);
  });

  it("sums impressions, engagements and clicks", () => {
    const totals = computeTotals([
      row("instagram", "2026-10-01", { impressions: 100, engagements: 10, clicks: 1 }),
      row("instagram", "2026-10-02", { impressions: 300, engagements: 30, clicks: 3 }),
      row("tiktok", "2026-10-01", { impressions: 600, engagements: 60, clicks: 6 }),
    ]);
    expect(totals.impressions).toBe(1000);
    expect(totals.engagements).toBe(100);
    expect(totals.clicks).toBe(10);
    expect(totals.engagementRate).toBe(0.1);
  });

  it("uses the latest follower count per platform, not a sum of every day", () => {
    const totals = computeTotals([
      row("instagram", "2026-10-02", { followers: 120 }),
      row("instagram", "2026-10-01", { followers: 100 }),
      row("tiktok", "2026-10-01", { followers: 40 }),
    ]);
    expect(totals.followers).toBe(160);
  });
});

describe("platformBreakdown", () => {
  it("returns totals per platform in a fixed platform order", () => {
    const breakdown = platformBreakdown([
      row("tiktok", "2026-10-01", { impressions: 200, engagements: 30 }),
      row("instagram", "2026-10-01", { impressions: 100, engagements: 5 }),
      row("instagram", "2026-10-02", { impressions: 100, engagements: 15 }),
    ]);
    expect(breakdown.map((b) => b.platform)).toEqual(["instagram", "tiktok"]);
    expect(breakdown[0].impressions).toBe(200);
    expect(breakdown[0].engagementRate).toBe(0.1);
    expect(breakdown[1].engagementRate).toBe(0.15);
  });

  it("returns an empty list for empty input", () => {
    expect(platformBreakdown([])).toEqual([]);
  });
});

describe("percentChange", () => {
  it("returns the change as a fraction of the previous value", () => {
    expect(percentChange(120, 100)).toBeCloseTo(0.2);
    expect(percentChange(75, 100)).toBeCloseTo(-0.25);
  });

  it("returns 0 when both values are 0", () => {
    expect(percentChange(0, 0)).toBe(0);
  });

  it("returns null when the previous value is 0 but the current is not", () => {
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe("comparePeriods", () => {
  // 14 days: days 1-7 have 100 engagements each, days 8-14 have 150.
  const rows: DailyMetrics[] = Array.from({ length: 14 }, (_, i) =>
    row("instagram", `2026-10-${String(i + 1).padStart(2, "0")}`, {
      impressions: 1000,
      engagements: i < 7 ? 100 : 150,
      followers: 500 + i,
    }),
  );

  it("splits data into the latest 7 days and the 7 days before", () => {
    const result = comparePeriods(rows);
    expect(result.current.engagements).toBe(1050);
    expect(result.previous.engagements).toBe(700);
    expect(result.current.followers).toBe(513);
    expect(result.previous.followers).toBe(506);
  });

  it("reports percent change per KPI", () => {
    const result = comparePeriods(rows);
    expect(result.change.engagements).toBeCloseTo(0.5);
    expect(result.change.impressions).toBe(0);
    expect(result.change.engagementRate).toBeCloseTo(0.5);
  });

  it("works from the latest date even if rows are unsorted", () => {
    const result = comparePeriods([...rows].reverse());
    expect(result.current.engagements).toBe(1050);
  });

  it("handles missing previous data", () => {
    const result = comparePeriods(rows.slice(7));
    expect(result.previous.engagements).toBe(0);
    expect(result.change.engagements).toBeNull();
  });

  it("returns zeros for empty input", () => {
    const result = comparePeriods([]);
    expect(result.current.engagements).toBe(0);
    expect(result.change.engagements).toBe(0);
  });

  it("compares followers only across platforms present in both weeks", () => {
    const withNewPlatform = [
      ...rows,
      // LinkedIn is connected this week only: its 900 followers are not a gain.
      row("linkedin", "2026-10-14", { followers: 900 }),
    ];
    const result = comparePeriods(withNewPlatform);
    expect(result.current.followers).toBe(513 + 900);
    expect(result.change.followers).toBeCloseTo((513 - 506) / 506);
  });

  it("reports no followers change when no platform is in both weeks", () => {
    const result = comparePeriods(rows.slice(7));
    expect(result.change.followers).toBeNull();
  });

  it("ignores rows with malformed dates instead of crashing", () => {
    const withBadDates = [
      ...rows,
      row("instagram", "2026-10-9", { engagements: 9999 }),
      row("instagram", "", { engagements: 9999 }),
      row("instagram", "not-a-date", { engagements: 9999 }),
    ];
    const result = comparePeriods(withBadDates);
    expect(result.current.engagements).toBe(1050);
    expect(result.previous.engagements).toBe(700);
  });

  it("returns zeros when every date is malformed", () => {
    const result = comparePeriods([row("instagram", "garbage")]);
    expect(result.current.engagements).toBe(0);
  });
});

describe("platformComparison", () => {
  // Instagram: steady 50/1000 per day. LinkedIn: 50/1000 last week, 35/1000 this week.
  const days = (platform: Platform, lastWeek: number, thisWeek: number) =>
    Array.from({ length: 14 }, (_, i) =>
      row(platform, `2026-10-${String(i + 1).padStart(2, "0")}`, {
        impressions: 1000,
        engagements: i < 7 ? lastWeek : thisWeek,
        clicks: 10,
      }),
    );

  it("returns this week's totals and change for each platform, in platform order", () => {
    const result = platformComparison([...days("linkedin", 50, 35), ...days("instagram", 50, 50)]);
    expect(result.map((p) => p.platform)).toEqual(["instagram", "linkedin"]);
    expect(result[0].current.engagements).toBe(350);
    expect(result[0].change.engagementRate).toBe(0);
    expect(result[1].current.engagementRate).toBeCloseTo(0.035);
    expect(result[1].change.engagementRate).toBeCloseTo(-0.3);
  });

  it("uses the dashboard's weeks, not each platform's own latest date", () => {
    const stale = days("tiktok", 80, 40).map((r) => ({ ...r, date: r.date.replace("2026-10", "2026-09") }));
    const result = platformComparison([...days("instagram", 50, 50), ...stale]);
    expect(result.map((p) => p.platform)).toEqual(["instagram"]);
  });

  it("returns an empty list for empty input", () => {
    expect(platformComparison([])).toEqual([]);
  });
});
