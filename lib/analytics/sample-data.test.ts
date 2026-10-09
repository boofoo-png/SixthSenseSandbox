import { describe, expect, it } from "vitest";
import { createSampleData } from "./sample-data";
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
