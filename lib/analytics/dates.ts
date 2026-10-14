const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date written as YYYY-MM-DD (rejects "2026-10-9" and "2026-02-31"). */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Adds `days` (may be negative) to an ISO date (YYYY-MM-DD), in UTC. */
export function shiftDate(isoDate: string, days: number): string {
  const time = Date.parse(`${isoDate}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(time).toISOString().slice(0, 10);
}

export type DateRange = { start: string; end: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(isoDate: string): { month: string; day: number } {
  const [, month, day] = isoDate.split("-").map(Number);
  return { month: MONTHS[month - 1], day };
}

/** "2026-10-09" -> "Oct 9", without time zone surprises. */
export function formatShortDate(isoDate: string): string {
  const { month, day } = parts(isoDate);
  return `${month} ${day}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayOfWeek(isoDate: string): number {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`)).getUTCDay();
}

/** The Sunday that starts the calendar week containing `isoDate`. */
export function weekStart(isoDate: string): string {
  return shiftDate(isoDate, -dayOfWeek(isoDate));
}

/** Short day name, e.g. "Tue". */
export function dayName(isoDate: string): string {
  return DAY_NAMES[dayOfWeek(isoDate)];
}

/** "Oct 4" for one day, "Oct 3 - 9" within one month, "Sep 26 - Oct 2" across months. */
export function formatDateRange({ start, end }: DateRange): string {
  if (start === end) {
    return formatShortDate(start);
  }
  const from = parts(start);
  const to = parts(end);
  return from.month === to.month && start.slice(0, 4) === end.slice(0, 4)
    ? `${from.month} ${from.day} - ${to.day}`
    : `${from.month} ${from.day} - ${to.month} ${to.day}`;
}

/**
 * This calendar week (Sunday to Saturday) and what it is compared with.
 * `current` runs from Sunday to the newest data; `previous` covers the same
 * days of last week, so an unfinished week is compared fairly.
 */
export type WeekPeriods = {
  week: DateRange;
  current: DateRange;
  previous: DateRange;
  /** True once the week has data through Saturday. */
  complete: boolean;
};

/** The sentence pages show so "vs last week" is never ambiguous. */
export function describePeriods(ranges: WeekPeriods | null): string {
  if (ranges === null) {
    return "No data yet.";
  }
  if (ranges.complete) {
    return `This week (${formatDateRange(ranges.week)}) compared with last week (${formatDateRange(ranges.previous)}).`;
  }
  const { start, end } = ranges.current;
  const soFar = start === end ? dayName(start) : `${dayName(start)} - ${dayName(end)}`;
  const sameDays = start === end ? "the same day" : "the same days";
  return `This week (${formatDateRange(ranges.week)}, so far ${soFar}) compared with ${sameDays} last week (${formatDateRange(ranges.previous)}).`;
}

/** Today's local calendar date as YYYY-MM-DD (used as the end of sample data). */
export function todayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
