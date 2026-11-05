import { describe, expect, it } from "vitest";
import type { DailyMetrics } from "@/lib/analytics/types";
import { SCHEDULE_KEY, clickBars, csvCell, dueMonth, loadSchedule, reportCsv, reportFileName, saveSchedule } from "./insights";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const row = (date: string, clicks: number, platform: DailyMetrics["platform"] = "instagram"): DailyMetrics => ({
  platform,
  date,
  impressions: 100,
  engagements: 10,
  clicks,
  followers: 50,
});

describe("clickBars", () => {
  it("shows one bar per day for up to two weeks", () => {
    const bars = clickBars([row("2026-10-01", 4), row("2026-10-01", 6, "tiktok"), row("2026-10-03", 5)], { start: "2026-10-01", end: "2026-10-03" });
    expect(bars).toEqual([
      { label: "Oct 1", value: 10, height: 100 },
      { label: "Oct 2", value: 0, height: 4 },
      { label: "Oct 3", value: 5, height: 50 },
    ]);
  });

  it("shows one bar per week for longer ranges", () => {
    const bars = clickBars([row("2026-09-10", 3), row("2026-09-30", 6)], { start: "2026-09-10", end: "2026-10-09" });
    expect(bars.map((bar) => bar.label)).toEqual(["W1", "W2", "W3", "W4", "W5"]);
    expect(bars.map((bar) => bar.value)).toEqual([3, 0, 0, 6, 0]);
  });
});

describe("CSV", () => {
  it("never lets a spreadsheet run a cell as a formula", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("-5")).toBe("'-5");
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
  });

  it("lists the report's days in order with labelled platforms", () => {
    const csv = reportCsv([row("2026-10-02", 1), row("2026-10-01", 2, "tiktok"), row("2026-09-01", 9)], { start: "2026-10-01", end: "2026-10-31" });
    expect(csv.split("\r\n")).toEqual([
      "Date,Platform,Impressions,Engagements,Clicks,Followers",
      "2026-10-01,TikTok,100,10,2,50",
      "2026-10-02,Instagram,100,10,1,50",
    ]);
    expect(reportFileName({ start: "2026-10-01", end: "2026-10-31" })).toBe("sixth-sense-report-2026-10-01-to-2026-10-31.csv");
  });
});

describe("monthly export", () => {
  it("is due for last month once a new month starts after scheduling", () => {
    expect(dueMonth({ since: "2026-10-15", lastReady: null }, "2026-10-28")).toBeNull();
    expect(dueMonth({ since: "2026-10-15", lastReady: null }, "2026-11-02")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
    expect(dueMonth({ since: "2026-10-15", lastReady: "2026-10" }, "2026-11-20")).toBeNull();
    expect(dueMonth({ since: "2026-10-15", lastReady: "2026-10" }, "2026-12-01")).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(dueMonth(null, "2026-11-02")).toBeNull();
  });

  it("is saved in the browser and ignores broken data", () => {
    const storage = new MemoryStorage() as unknown as Storage;
    expect(saveSchedule(storage, { since: "2026-11-05", lastReady: null })).toBe(true);
    expect(loadSchedule(storage)).toEqual({ since: "2026-11-05", lastReady: null });
    saveSchedule(storage, null);
    expect(loadSchedule(storage)).toBeNull();
    storage.setItem(SCHEDULE_KEY, "{bad");
    expect(loadSchedule(storage)).toBeNull();
    expect(saveSchedule(undefined, null)).toBe(false);
  });
});
