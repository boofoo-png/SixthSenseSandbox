import { describe, expect, it } from "vitest";
import type { DailyMetrics } from "@/lib/analytics/types";
import { csvCell, reportCsv, reportFileName } from "./insights";

const row = (date: string, clicks: number, platform: DailyMetrics["platform"] = "instagram"): DailyMetrics => ({
  platform,
  date,
  impressions: 100,
  engagements: 10,
  clicks,
  followers: 50,
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
