import { describe, expect, it } from "vitest";
import {
  CAMPAIGNS,
  TARGET_ROAS,
  adCsv,
  adInsights,
  adRowsBetween,
  byCountry,
  byPlatform,
  change,
  count,
  dailyRevenue,
  kpis,
  money,
  peakDay,
  performanceScore,
  reportPeriod,
  topCampaigns,
  totals,
} from "./ads";

const today = "2026-11-05";
const week = reportPeriod(7, today);
const month = reportPeriod(30, today);
const rows = adRowsBetween({ start: month.previous.start, end: today });

describe("sample ad data", () => {
  it("has a row per campaign per day and is the same every time", () => {
    const day = adRowsBetween({ start: today, end: today });
    expect(day).toHaveLength(CAMPAIGNS.length);
    expect(adRowsBetween({ start: today, end: today })).toEqual(day);
    for (const row of day) {
      expect(row.revenue).toBeGreaterThan(row.spend);
      expect(row.clicks).toBeLessThan(row.impressions);
    }
  });
});

describe("periods and KPIs", () => {
  it("compares the last 7 or 30 days with the days before", () => {
    expect(week).toEqual({ days: 7, current: { start: "2026-10-30", end: today }, previous: { start: "2026-10-23", end: "2026-10-29" } });
    expect(month.previous).toEqual({ start: "2026-09-07", end: "2026-10-06" });
  });

  it("has the six cards from the design, with ROAS as revenue divided by spend", () => {
    const cards = kpis(rows, week);
    expect(cards.map((card) => card.label)).toEqual(["Total Spend", "Revenue", "ROAS", "Impressions", "Conversions", "Clicks"]);
    const spend = cards[0].value;
    const revenue = cards[1].value;
    expect(cards[2].value).toBeCloseTo(revenue / spend);
    expect(cards.every((card) => card.change !== null)).toBe(true);
  });

  it("splits totals by platform", () => {
    const split = byPlatform(rows, week.current);
    expect(split.Google.spend + split.Meta.spend).toBeCloseTo(totals(rows.filter((row) => row.date >= week.current.start)).spend);
    expect(change(0, 0)).toBeNull();
  });
});

describe("revenue chart and insights", () => {
  it("has one point per day, with the peak day", () => {
    const days = dailyRevenue(rows, week.current);
    expect(days).toHaveLength(7);
    const peak = peakDay(days, 1000);
    expect(peak && days.every((day) => day.Google + day.Meta <= peak.revenue)).toBe(true);
    expect(peakDay([], 1)).toBeNull();
  });

  it("names the top performer, the underperformer, and a budget suggestion", () => {
    const insights = adInsights(rows, week);
    expect(insights.lines[0]).toMatch(/^(Meta|Google) delivered the strongest ROAS this week/);
    expect(insights.topPerformer).toMatch(/^(Meta|Google) ROAS [+-]\d+%$/);
    expect(insights.underperformer).toMatch(/^(Meta|Google) CPA [+-]\d+%$/);
    expect(insights.suggestion).toMatch(/^Reallocate 10% of spend from (Google to Meta|Meta to Google)/);
    expect(adInsights(rows, week, 1).lines).toEqual([...insights.lines].reverse());
  });
});

describe("countries and campaigns", () => {
  it("ranks countries by revenue", () => {
    const countries = byCountry(rows, week.current);
    expect(countries).toHaveLength(5);
    expect(countries[0].name).toBe("Canada");
    expect(countries.map((country) => country.revenue)).toEqual([...countries.map((country) => country.revenue)].sort((a, b) => b - a));
  });

  it("ranks campaigns and scores the share of spend at or above the target ROAS", () => {
    const campaigns = topCampaigns(rows, week);
    expect(campaigns).toHaveLength(CAMPAIGNS.length);
    expect(campaigns[0].revenue).toBeGreaterThanOrEqual(campaigns[1].revenue);
    const score = performanceScore(campaigns);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(performanceScore([{ id: "a", name: "A", platform: "Meta", spend: 100, revenue: 100 * TARGET_ROAS, conversions: 1, roas: TARGET_ROAS, revenueChange: 0 }, { id: "b", name: "B", platform: "Google", spend: 300, revenue: 300, conversions: 1, roas: 1, revenueChange: 0 }])).toBe(25);
    expect(performanceScore([])).toBe(0);
  });
});

describe("formatting and export", () => {
  it("formats money and counts like the design", () => {
    expect(money(12450)).toBe("$12,450");
    expect(money(89540, true)).toBe("$89.5K");
    expect(count(2_530_000)).toBe("2.53M");
    expect(count(112576)).toBe("112,576");
  });

  it("exports the period's rows as CSV", () => {
    const lines = adCsv(rows, week.current).split("\r\n");
    expect(lines[0]).toBe("Date,Platform,Campaign,Spend,Revenue,Conversions,Impressions,Clicks");
    expect(lines).toHaveLength(1 + 7 * CAMPAIGNS.length);
    expect(lines[1].startsWith("2026-10-30,")).toBe(true);
  });
});
