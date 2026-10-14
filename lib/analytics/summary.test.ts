import { describe, expect, it } from "vitest";
import { shiftDate } from "./dates";
import { buildSummary, formatPercent } from "./summary";
import type { DailyMetrics, Platform } from "./types";

type DayValues = { impressions: number; engagements: number };

/**
 * Builds 14 days of rows for one platform: the first 7 days ("last week")
 * and the latest 7 days ("this week") each get the given daily values.
 * By default the 14 days are two calendar weeks, Sun 2026-10-04 to Sat 2026-10-17.
 */
function twoWeeks(
  platform: Platform,
  lastWeek: DayValues,
  thisWeek: DayValues,
  startDate = "2026-10-04",
): DailyMetrics[] {
  return Array.from({ length: 14 }, (_, i) => {
    const values = i < 7 ? lastWeek : thisWeek;
    return {
      platform,
      date: shiftDate(startDate, i),
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

  it("rounds halves the same way for increases and decreases", () => {
    expect(formatPercent(0.125)).toBe("13%");
    expect(formatPercent(-0.125)).toBe("13%");
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

  it("says the engagement rate went up compared with last week", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 40 }, { impressions: 1000, engagements: 50 });
    expect(buildSummary(rows)).toContain(
      "Engagement rate is up 25% compared with last week.",
    );
  });

  it("says the engagement rate went down compared with last week", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 40 });
    expect(buildSummary(rows)).toContain(
      "Engagement rate is down 20% compared with last week.",
    );
  });

  it("follows the engagement rate, not the raw engagement count", () => {
    // Views double and engagements rise 10%, so the rate falls 45%.
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 100 }, { impressions: 2000, engagements: 110 });
    expect(buildSummary(rows)).toContain(
      "Engagement rate is down 45% compared with last week.",
    );
  });

  it("calls small changes steady", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 100 }, { impressions: 1000, engagements: 102 });
    expect(buildSummary(rows)).toContain(
      "Engagement rate held steady compared with last week.",
    );
  });

  it("rounds the same way as the KPI tiles", () => {
    const halfway = twoWeeks("instagram", { impressions: 1000, engagements: 80 }, { impressions: 1000, engagements: 70 });
    expect(buildSummary(halfway)).toContain(
      "Engagement rate is down 13% compared with last week.",
    );

    // -4.9% shows as -5% on a tile, so the summary must not call it steady.
    const nearThreshold = twoWeeks("instagram", { impressions: 10000, engagements: 1000 }, { impressions: 10000, engagements: 951 });
    expect(buildSummary(nearThreshold)).toContain(
      "Engagement rate is down 5% compared with last week.",
    );
  });

  it("explains when there is no previous week to compare", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 40 }, { impressions: 1000, engagements: 40 }).slice(7);
    expect(buildSummary(rows)).toContain(
      "There is no data from last week yet, so there is nothing to compare.",
    );
  });

  it("explains when last week had views but no engagement", () => {
    const rows = twoWeeks("instagram", { impressions: 1000, engagements: 0 }, { impressions: 1000, engagements: 40 });
    expect(buildSummary(rows)).toContain(
      "Engagement rate went up from 0% last week to 4.0%.",
    );
  });

  it("explains when last week had data but no views", () => {
    const rows = twoWeeks("instagram", { impressions: 0, engagements: 0 }, { impressions: 1000, engagements: 40 });
    expect(buildSummary(rows)).toContain(
      "Your posts had no views last week, so there is nothing to compare.",
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

  it("does not flag a platform whose data stopped before this week", () => {
    const rows = [
      ...twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 50 }),
      // TikTok's last row is 2026-09-30: its own two weeks show a big drop, but they are stale.
      ...twoWeeks("tiktok", { impressions: 1000, engagements: 80 }, { impressions: 1000, engagements: 40 }, "2026-09-17"),
    ];
    expect(buildSummary(rows).some((line) => line.includes("TikTok"))).toBe(false);
  });

  it("does not flag a platform with no data this week", () => {
    const rows = [
      ...twoWeeks("instagram", { impressions: 1000, engagements: 50 }, { impressions: 1000, engagements: 50 }),
      ...twoWeeks("linkedin", { impressions: 1000, engagements: 80 }, { impressions: 1000, engagements: 80 }).slice(0, 7),
    ];
    expect(buildSummary(rows).some((line) => line.includes("LinkedIn"))).toBe(false);
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
