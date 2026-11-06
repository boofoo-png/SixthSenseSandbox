import type { DateRange } from "@/lib/analytics/dates";
import { PLATFORM_LABELS, type DailyMetrics } from "@/lib/analytics/types";

// CSV helpers for report downloads (formula-safe cells). Used by Reports (lib/reports/ads.ts).

/** A spreadsheet cell: quoted when needed, and never run as a formula (=, +, -, @ at the start). */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The report's daily numbers as CSV, oldest first. */
export function reportCsv(rows: readonly DailyMetrics[], range: DateRange): string {
  const header = ["Date", "Platform", "Impressions", "Engagements", "Clicks", "Followers"];
  const lines = rows
    .filter((row) => row.date >= range.start && row.date <= range.end)
    .toSorted((a, b) => a.date.localeCompare(b.date) || a.platform.localeCompare(b.platform))
    .map((row) => [row.date, PLATFORM_LABELS[row.platform], row.impressions, row.engagements, row.clicks, row.followers].map(csvCell).join(","));
  return [header.join(","), ...lines].join("\r\n");
}

/** File name for a report download, e.g. sixth-sense-report-2026-10-01-to-2026-10-31.csv. */
export function reportFileName(range: DateRange): string {
  return `sixth-sense-report-${range.start}-to-${range.end}.csv`;
}
