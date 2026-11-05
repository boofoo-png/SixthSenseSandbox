import { daysInRange, formatShortDate, shiftDate, weekStart, type DateRange } from "@/lib/analytics/dates";
import { PLATFORM_LABELS, type DailyMetrics } from "@/lib/analytics/types";

// Reports from the team's updated Figma Make (2026-11-05), filled with the app's sample analytics.
// The Make shows website traffic and conversions, which the sample data does not have, so the page
// shows impressions and followers instead (docs/DECISIONS.md 2026-11-05).

export type Bar = { label: string; value: number; height: number };

const MAX_DAILY = 14;

/** Clicks per day (up to two weeks) or per Sunday-to-Saturday week, with heights out of 100. */
export function clickBars(rows: readonly DailyMetrics[], range: DateRange): Bar[] {
  const inRange = rows.filter((row) => row.date >= range.start && row.date <= range.end);
  const daily = daysInRange(range) <= MAX_DAILY;
  const buckets = new Map<string, number>();
  if (daily) {
    for (let day = range.start; day <= range.end; day = shiftDate(day, 1)) buckets.set(day, 0);
  } else {
    for (let week = weekStart(range.start); week <= range.end; week = shiftDate(week, 7)) buckets.set(week, 0);
  }
  for (const row of inRange) {
    const key = daily ? row.date : weekStart(row.date);
    buckets.set(key, (buckets.get(key) ?? 0) + row.clicks);
  }
  const entries = [...buckets];
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return entries.map(([key, value], index) => ({
    label: daily ? formatShortDate(key) : `W${index + 1}`,
    value,
    height: Math.max(4, Math.round((value / max) * 100)),
  }));
}

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

// Monthly export, kept in this browser. A browser cannot run anything while the app is closed, so a
// due report is offered the next time Reports is opened (docs/DECISIONS.md 2026-10-30).

export const SCHEDULE_KEY = "sixthsense.report-schedule";
const VERSION = 1;

/** `since` is the day it was scheduled; `lastReady` is the last month (YYYY-MM) already handed over. */
export type MonthlySchedule = { since: string; lastReady: string | null };

/** The whole previous month, when a monthly report is due for it; otherwise null. */
export function dueMonth(schedule: MonthlySchedule | null, today: string): DateRange | null {
  if (!schedule) return null;
  const thisMonth = today.slice(0, 7);
  const firstOfMonth = `${thisMonth}-01`;
  const end = shiftDate(firstOfMonth, -1);
  const previousMonth = end.slice(0, 7);
  if (schedule.since >= firstOfMonth) return null;
  if (schedule.lastReady !== null && schedule.lastReady >= previousMonth) return null;
  return { start: `${previousMonth}-01`, end };
}

export function loadSchedule(storage: Storage | undefined): MonthlySchedule | null {
  try {
    const raw = storage?.getItem(SCHEDULE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { version?: unknown; since?: unknown; lastReady?: unknown };
    if (saved.version !== VERSION || typeof saved.since !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(saved.since)) return null;
    return { since: saved.since, lastReady: typeof saved.lastReady === "string" ? saved.lastReady : null };
  } catch {
    return null;
  }
}

/** Saves the schedule, or removes it when `schedule` is null; false when storage is blocked. */
export function saveSchedule(storage: Storage | undefined, schedule: MonthlySchedule | null): boolean {
  if (!storage) return false;
  try {
    if (schedule === null) storage.removeItem(SCHEDULE_KEY);
    else storage.setItem(SCHEDULE_KEY, JSON.stringify({ version: VERSION, ...schedule }));
    return true;
  } catch {
    return false;
  }
}
