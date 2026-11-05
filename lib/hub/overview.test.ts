import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERIOD,
  OVERVIEW_PERIODS,
  formatSignedPercent,
  nextPublishingWindow,
  overviewCompetitors,
  overviewFor,
  parsePeriod,
} from "./overview";

describe("parsePeriod", () => {
  it("has the Make's two periods, stored as the date bar's period so they carry to other pages", () => {
    expect(OVERVIEW_PERIODS.map((period) => [period.label, period.param])).toEqual([
      ["7 days", "last-7-days"],
      ["30 days", "last-30-days"],
    ]);
    expect(parsePeriod("last-7-days")).toBe("7d");
    expect(parsePeriod("last-30-days")).toBe("30d");
  });

  it("treats the date bar's This week as 7 days", () => {
    expect(parsePeriod("this-week")).toBe("7d");
  });

  it("falls back to 30 days, the Make's starting choice, for anything else", () => {
    expect(DEFAULT_PERIOD).toBe("30d");
    expect(parsePeriod(undefined)).toBe("30d");
    expect(parsePeriod("custom")).toBe("30d");
    expect(parsePeriod(["last-7-days", "x"])).toBe("30d");
  });
});

describe("formatSignedPercent", () => {
  it("always shows the sign, like the Make's change pills", () => {
    expect(formatSignedPercent(2.5)).toBe("+2.5%");
    expect(formatSignedPercent(-0.5)).toBe("-0.5%");
    expect(formatSignedPercent(0)).toBe("0%");
    expect(formatSignedPercent(10)).toBe("+10%");
  });
});

describe("nextPublishingWindow", () => {
  it("is the next Tuesday after today", () => {
    expect(nextPublishingWindow("2026-11-04")).toBe("2026-11-10"); // a Wednesday, as in the Make
    expect(nextPublishingWindow("2026-11-09")).toBe("2026-11-10"); // Monday
    expect(nextPublishingWindow("2026-11-10")).toBe("2026-11-17"); // a Tuesday moves to the next one
  });
});

describe("overviewCompetitors", () => {
  it("starts with the competitors added at sign-up, then fills up with sample competitors", () => {
    expect(overviewCompetitors(["Pacific Room Supply"])).toEqual([
      "Pacific Room Supply",
      "Coastline Linen Co.",
      "Northbay Hospitality Supply",
    ]);
  });

  it("shows three, skipping blanks and repeats", () => {
    expect(overviewCompetitors(["A", " ", "a", "B", "C", "D"])).toEqual(["A", "B", "C"]);
  });
});

describe("overviewFor", () => {
  const competitors = ["GuestSupply", "Out of Eden", "Hotel Buyer"];

  it("matches the Make's figures for 30 days", () => {
    const overview = overviewFor("30d", competitors, "2026-11-04");
    expect(overview.competitors).toEqual([
      { name: "GuestSupply", change: 2.5, posts: 10 },
      { name: "Out of Eden", change: 1.3, posts: 30 },
      { name: "Hotel Buyer", change: -0.5, posts: 23 },
    ]);
    expect(overview.marketInterest).toEqual({ score: 81.5, change: -2.6 });
    expect(overview.audienceGrowth).toEqual({ newMembers: 100, change: 0.6, channels: 4 });
    expect(overview.engagement).toEqual({ rate: 20, change: 3.5, bars: [35, 29, 74, 43, 59] });
    expect(overview.nextWindow).toBe("2026-11-10");
    expect(overview.channels).toEqual([
      { channel: "Instagram", momentum: 10, change: 1.5 },
      { channel: "Facebook", momentum: -5, change: -1.5 },
      { channel: "Web", momentum: 5, change: 3.5 },
      { channel: "Email", momentum: null, change: null },
    ]);
  });

  it("has smaller changes over 7 days", () => {
    const week = overviewFor("7d", competitors, "2026-11-04");
    const month = overviewFor("30d", competitors, "2026-11-04");
    expect(week.audienceGrowth.newMembers).toBeLessThan(month.audienceGrowth.newMembers);
    week.competitors.forEach((row, index) => {
      expect(row.posts).toBeLessThan(month.competitors[index].posts);
    });
    expect(week.nextWindow).toBe(month.nextWindow);
  });

  it("keeps every bar and score in range", () => {
    for (const { id } of OVERVIEW_PERIODS) {
      const overview = overviewFor(id, competitors, "2026-11-04");
      expect(overview.marketInterest.score).toBeGreaterThanOrEqual(0);
      expect(overview.marketInterest.score).toBeLessThanOrEqual(100);
      overview.engagement.bars.forEach((bar) => {
        expect(bar).toBeGreaterThan(0);
        expect(bar).toBeLessThanOrEqual(100);
      });
    }
  });
});
