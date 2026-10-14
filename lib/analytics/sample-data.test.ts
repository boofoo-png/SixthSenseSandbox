import { describe, expect, it } from "vitest";
import { createSampleData, sampleDataBetween } from "./sample-data";
import { PLATFORMS } from "./types";

describe("createSampleData", () => {
  const data = createSampleData();

  it("has 30 days of data for each platform", () => {
    expect(data).toHaveLength(PLATFORMS.length * 30);
    for (const platform of PLATFORMS) {
      expect(data.filter((d) => d.platform === platform)).toHaveLength(30);
    }
  });

  it("covers 30 consecutive days ending on the given date", () => {
    const dates = [...new Set(data.map((d) => d.date))].sort();
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-09-10");
    expect(dates[29]).toBe("2026-10-09");
  });

  it("is deterministic", () => {
    expect(createSampleData()).toEqual(data);
  });

  it("has sensible values", () => {
    for (const d of data) {
      expect(d.impressions).toBeGreaterThan(0);
      expect(d.engagements).toBeGreaterThan(0);
      expect(d.engagements).toBeLessThanOrEqual(d.impressions);
      expect(d.clicks).toBeLessThanOrEqual(d.engagements);
      expect(Number.isInteger(d.impressions)).toBe(true);
      expect(Number.isInteger(d.engagements)).toBe(true);
      expect(Number.isInteger(d.clicks)).toBe(true);
    }
  });

  it("never loses followers from one day to the next", () => {
    for (const platform of PLATFORMS) {
      const rows = data
        .filter((d) => d.platform === platform)
        .sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].followers).toBeGreaterThanOrEqual(rows[i - 1].followers);
      }
    }
  });

  it("accepts a different end date", () => {
    const other = createSampleData("2026-01-31");
    const dates = [...new Set(other.map((d) => d.date))].sort();
    expect(dates[0]).toBe("2026-01-02");
    expect(dates[29]).toBe("2026-01-31");
  });
});

describe("sampleDataBetween", () => {
  it("covers any date range, one row per platform per day", () => {
    const lastYear = sampleDataBetween({ start: "2025-01-01", end: "2025-01-07" });
    expect(lastYear).toHaveLength(PLATFORMS.length * 7);
    expect(lastYear[0].date).toBe("2025-01-01");
  });

  it("gives the same numbers for a date no matter which range it is part of", () => {
    const short = sampleDataBetween({ start: "2026-10-05", end: "2026-10-06" });
    const long = sampleDataBetween({ start: "2026-09-01", end: "2026-10-09" });
    for (const row of short) {
      expect(long).toContainEqual(row);
    }
  });

  it("stays realistic far in the past", () => {
    for (const row of sampleDataBetween({ start: "2024-10-01", end: "2024-10-31" })) {
      expect(row.impressions).toBeGreaterThan(0);
      expect(row.engagements).toBeGreaterThan(0);
      expect(row.engagements / row.impressions).toBeLessThan(0.2);
      expect(row.followers).toBeGreaterThan(0);
    }
  });

  it("grows followers at a realistic yearly rate", () => {
    const followersOn = (date: string) =>
      sampleDataBetween({ start: date, end: date }).reduce((sum, row) => sum + row.followers, 0);
    const growth = followersOn("2026-10-09") / followersOn("2025-10-09");
    expect(growth).toBeGreaterThan(1.1);
    expect(growth).toBeLessThan(2);
  });

  it("returns nothing for an empty or reversed range", () => {
    expect(sampleDataBetween({ start: "2026-10-09", end: "2026-10-01" })).toEqual([]);
  });
});
