import { describe, expect, it } from "vitest";
import { buildSummary, formatPercent } from "./summary";
import type { DailyMetrics, Platform } from "./types";

/**
 * Builds 14 days of rows for one platform: the first 7 days ("last week")
 * and the latest 7 days ("this week") each get the given daily values.
 */
function twoWeeks(
  platform: Platform,
  lastWeek: { impressions: number; engagements: number },
  thisWeek: { impressions: number; engagements: number },
): DailyMetrics[] {
  return Array.from({ length: 14 }, (_, i) => {
    const values = i < 7 ? lastWeek : thisWeek;
    return {
      platform,
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      impressions: values.impressions,
      engagements: values.engagements,
      clicks: 0,
      followers: 100,
    };
  });
}

describe("formatPercent", () => {
  it("rounds to whole percent by default", () => {
    expect(formatPercent(0.1234)).toBe("12%");
  });

  it("supports decimals and drops the sign", () => {
    expect(formatPercent(-0.0756, 1)).toBe("7.6%");
  });
});

describe("buildSummary", () => {
  it("returns a friendly fallback when there is no data", () => {
    expect(buildSummary([])).toEqual([
      "No data for this period yet. Once posts start getting views, a summary will appear here.",
    ]);
  });

  it("names the platform with the best engagement rate this week", () => {
    const rows = [
      ...twoWeeks("instagram", { impressions: 1000, engagements: 40 }, { impressions: 1000, engagements: 40 }),
      ...twoWeeks("tiktok", { impressions: 1000, engagements: 70 }, { impressions: 1000, engagements: 70 }),
    ];
    expect(buildSummary(rows)[0]).toBe(
      "TikTok had your best engagement rate this week (7.0%).",
    );
  });

  it("says engagement went up compared with last week", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 40 }, { impressions: 1000, engagements: 50 });
    expect(buildSummary(rows)).toContain(
      "Engagement is up 25% compared with last week.",
    );
  });

  it("says engagement went down compared with last week", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 40 });
    expect(buildSummary(rows)).toContain(
      "Engagement is down 20% compared with last week.",
    );
  });

  it("calls small changes steady", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 100 }, { impressions: 1000, engagements: 102 });
    expect(buildSummary(rows)).toContain(
      "Engagement held steady compared with last week.",
    );
  });

  it("explains when there is no previous week to compare", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 40 }, { impressions: 1000, engagements: 40 }).slice(7);
    expect(buildSummary(rows)).toContain(
      "There is no data from last week yet, so there is nothing to compare.",
    );
  });

  it("flags the platform whose engagement rate dropped the most", () => {
    const rows = [
      ...twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 45 }),
      ...twoWeeks("linkedin", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 35 }),
    ];
    expect(buildSummary(rows)).toContain(
      "LinkedIn's engagement rate dropped 30% from last week - worth a look.",
    );
  });

  it("does not flag anything when no platform dropped noticeably", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 49 });
    expect(buildSummary(rows).some((line) => line.includes("worth a look"))).toBe(false);
  });

  it("uses plain ASCII text only", () => {
    const rows = [
      ...twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 60 }),
      ...twoWeeks("linkedin", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 30 }),
    ];
    for (const line of buildSummary(rows)) {
      expect(line).toMatch(/^[\x20-\x7E]+$/);
    }
  });
});
