// The date range the user picked in the date bar, stored in the page address
// (see docs/DECISIONS.md: date range selection lives in the page address).
import {
  daysInRange,
  formatDateRange,
  isIsoDate,
  shiftDate,
  shiftYear,
  weekStart,
  type DateRange,
} from "@/lib/analytics/dates";

export type PeriodPreset = "this-week" | "last-7-days" | "last-30-days" | "custom";
export type ComparePreset = "previous" | "last-year" | "custom";

export const PERIOD_OPTIONS: readonly { value: PeriodPreset; label: string }[] = [
  { value: "this-week", label: "This week" },
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "custom", label: "Custom dates" },
];

export const COMPARE_OPTIONS: readonly { value: ComparePreset; label: string }[] = [
  { value: "previous", label: "Previous period" },
  { value: "last-year", label: "Same period last year" },
  { value: "custom", label: "Custom dates" },
];

export type DateRangeSelection = {
  period: PeriodPreset;
  from?: string;
  to?: string;
  compare: ComparePreset;
  compareFrom?: string;
  compareTo?: string;
};

export type ResolvedDateRange = {
  selection: DateRangeSelection;
  current: DateRange;
  comparison: DateRange;
  /** Messages to show when the address had dates that could not be used as-is. */
  notices: string[];
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const NOTICES = {
  invalid: "Some dates in the address weren't valid, so the default dates are shown instead.",
  future: "Future dates aren't available yet, so this shows up to today.",
  tooLong: "Date ranges are limited to 366 days, so the start date was moved.",
} as const;

const MAX_DAYS = 366;
const DEFAULT_SELECTION: DateRangeSelection = { period: "this-week", compare: "previous" };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isPeriod(value: string | undefined): value is PeriodPreset {
  return PERIOD_OPTIONS.some((option) => option.value === value);
}

function isCompare(value: string | undefined): value is ComparePreset {
  return COMPARE_OPTIONS.some((option) => option.value === value);
}

type CustomResult = { range: DateRange } | { error: "invalid" | "future" };

/** Validates custom dates: swaps reversed dates, stops at today, and caps the length. */
function customRange(from: string | undefined, to: string | undefined, today: string, notices: Set<string>): CustomResult {
  if (from === undefined || to === undefined || !isIsoDate(from) || !isIsoDate(to)) {
    return { error: "invalid" };
  }
  let start = from <= to ? from : to;
  let end = from <= to ? to : from;
  if (start > today) {
    return { error: "future" };
  }
  if (end > today) {
    end = today;
    notices.add(NOTICES.future);
  }
  if (daysInRange({ start, end }) > MAX_DAYS) {
    start = shiftDate(end, -(MAX_DAYS - 1));
    notices.add(NOTICES.tooLong);
  }
  return { range: { start, end } };
}

function presetRange(period: Exclude<PeriodPreset, "custom">, today: string): DateRange {
  switch (period) {
    case "this-week":
      return { start: weekStart(today), end: today };
    case "last-7-days":
      return { start: shiftDate(today, -6), end: today };
    case "last-30-days":
      return { start: shiftDate(today, -29), end: today };
  }
}

/**
 * The comparison range for a quick option. "Previous period" is the same
 * number of days right before; for "this week" (which may be unfinished) it
 * is the same days of last week.
 */
function compareRange(compare: Exclude<ComparePreset, "custom">, period: PeriodPreset, current: DateRange): DateRange {
  if (compare === "last-year") {
    return { start: shiftYear(current.start, -1), end: shiftYear(current.end, -1) };
  }
  if (period === "this-week") {
    return { start: shiftDate(current.start, -7), end: shiftDate(current.end, -7) };
  }
  const length = daysInRange(current);
  return { start: shiftDate(current.start, -length), end: shiftDate(current.start, -1) };
}

/** Reads the date bar's choices from the page address and works out the actual dates. */
export function resolveDateRange(params: SearchParams, today: string): ResolvedDateRange {
  const notices = new Set<string>();

  const periodParam = first(params.period);
  let period: PeriodPreset = DEFAULT_SELECTION.period;
  let current = presetRange("this-week", today);
  const selection: DateRangeSelection = { ...DEFAULT_SELECTION };

  if (periodParam !== undefined && !isPeriod(periodParam)) {
    notices.add(NOTICES.invalid);
  } else if (periodParam === "custom") {
    const result = customRange(first(params.from), first(params.to), today, notices);
    if ("range" in result) {
      period = "custom";
      current = result.range;
      selection.from = current.start;
      selection.to = current.end;
    } else {
      notices.add(result.error === "future" ? NOTICES.future : NOTICES.invalid);
    }
  } else if (periodParam !== undefined) {
    period = periodParam;
    current = presetRange(periodParam, today);
  }
  selection.period = period;

  const compareParam = first(params.compare);
  let compare: ComparePreset = DEFAULT_SELECTION.compare;
  let comparison = compareRange("previous", period, current);

  if (compareParam !== undefined && !isCompare(compareParam)) {
    notices.add(NOTICES.invalid);
  } else if (compareParam === "custom") {
    const result = customRange(first(params.compareFrom), first(params.compareTo), today, notices);
    if ("range" in result) {
      compare = "custom";
      comparison = result.range;
      selection.compareFrom = comparison.start;
      selection.compareTo = comparison.end;
    } else {
      notices.add(result.error === "future" ? NOTICES.future : NOTICES.invalid);
    }
  } else if (compareParam !== undefined) {
    compare = compareParam;
    comparison = compareRange(compareParam, period, current);
  }
  selection.compare = compare;

  return { selection, current, comparison, notices: [...notices] };
}

/** The page address query for a selection, leaving out defaults (so the plain URL means "this week"). */
export function toSearchParams(selection: DateRangeSelection): string {
  const params = new URLSearchParams();
  if (selection.period !== DEFAULT_SELECTION.period) {
    params.set("period", selection.period);
  }
  if (selection.period === "custom" && selection.from && selection.to) {
    params.set("from", selection.from);
    params.set("to", selection.to);
  }
  if (selection.compare !== DEFAULT_SELECTION.compare) {
    params.set("compare", selection.compare);
  }
  if (selection.compare === "custom" && selection.compareFrom && selection.compareTo) {
    params.set("compareFrom", selection.compareFrom);
    params.set("compareTo", selection.compareTo);
  }
  return params.toString();
}

/** Adds a query string to a link so the date selection carries across pages. */
export function withQuery(href: string, query: string): string {
  return query === "" ? href : `${href}?${query}`;
}

function outsideYear(range: DateRange, year: string): boolean {
  return range.start.slice(0, 4) !== year || range.end.slice(0, 4) !== year;
}

/** A range label for this selection; years are shown when either range is outside the current year. */
export function rangeLabel(resolved: ResolvedDateRange, range: DateRange, today: string): string {
  const year = today.slice(0, 4);
  const withYear = outsideYear(resolved.current, year) || outsideYear(resolved.comparison, year);
  return formatDateRange(range, withYear);
}

/** e.g. "Showing Oct 4 - 9 compared with Sep 27 - Oct 2." */
export function describeSelection(resolved: ResolvedDateRange, today: string): string {
  return `Showing ${rangeLabel(resolved, resolved.current, today)} compared with ${rangeLabel(resolved, resolved.comparison, today)}.`;
}

/** The dates a page needs data for: from the earliest to the latest day of both periods. */
export function dataRange({ current, comparison }: Pick<ResolvedDateRange, "current" | "comparison">): DateRange {
  return {
    start: current.start < comparison.start ? current.start : comparison.start,
    end: current.end > comparison.end ? current.end : comparison.end,
  };
}

const DATE_KEYS = ["period", "from", "to", "compare", "compareFrom", "compareTo"] as const;

/** Just the date bar's part of the current address, for keeping the selection in links. */
export function dateQuery(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  for (const key of DATE_KEYS) {
    const value = params.get(key);
    if (value !== null) {
      kept.set(key, value);
    }
  }
  return kept.toString();
}

export type PageDates = {
  resolved: ResolvedDateRange;
  ranges: { current: DateRange; comparison: DateRange };
  currentLabel: string;
  comparisonLabel: string;
  /** Data must cover this range (both periods). */
  dataRange: DateRange;
  /** Query string to keep the selection in links. */
  query: string;
};

/** Everything a dashboard page needs about the chosen dates, from its address parameters. */
export function pageDates(params: SearchParams, today: string): PageDates {
  const resolved = resolveDateRange(params, today);
  return {
    resolved,
    ranges: { current: resolved.current, comparison: resolved.comparison },
    currentLabel: rangeLabel(resolved, resolved.current, today),
    comparisonLabel: rangeLabel(resolved, resolved.comparison, today),
    dataRange: dataRange(resolved),
    query: toSearchParams(resolved.selection),
  };
}
