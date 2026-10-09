import { describe, expect, it } from "vitest";
import {
  comparePeriods,
  computeTotals,
  engagementRate,
  percentChange,
  platformBreakdown,
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

describe("computeTotals", () => {
  it("returns zeros for empty input", () => {
    expect(computeTotals([])).toEqual({
      impressions: 0,
      engagements: 0,
      clicks: 0,
      followers: 0,
      engagementRate: 0,
    });
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
});
