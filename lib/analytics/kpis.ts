import { isIsoDate, shiftDate, weekStart, type WeekPeriods } from "./dates";
import { PLATFORMS, type DailyMetrics, type Platform } from "./types";

export type KpiTotals = {
  impressions: number;
  engagements: number;
  clicks: number;
  /** Latest follower count per platform, summed. */
  followers: number;
  /** Engagements divided by impressions (0.05 means 5%). */
  engagementRate: number;
  /** Clicks divided by impressions (0.01 means 1%). */
  clickThroughRate: number;
};

export type PlatformTotals = KpiTotals & { platform: Platform };

/** Change per KPI as a fraction (0.2 means +20%); null when there is no previous value to compare. */
export type KpiChange = Record<keyof KpiTotals, number | null>;

export type PeriodComparison = {
  current: KpiTotals;
  previous: KpiTotals;
  change: KpiChange;
};

export function engagementRate(engagements: number, impressions: number): number {
  return impressions === 0 ? 0 : engagements / impressions;
}

export function clickThroughRate(clicks: number, impressions: number): number {
  return impressions === 0 ? 0 : clicks / impressions;
}

export function computeTotals(rows: readonly DailyMetrics[]): KpiTotals {
  let impressions = 0;
  let engagements = 0;
  let clicks = 0;
  const latestFollowers = new Map<Platform, DailyMetrics>();

  for (const row of rows) {
    impressions += row.impressions;
    engagements += row.engagements;
    clicks += row.clicks;
    const latest = latestFollowers.get(row.platform);
    if (!latest || row.date > latest.date) {
      latestFollowers.set(row.platform, row);
    }
  }

  let followers = 0;
  for (const row of latestFollowers.values()) {
    followers += row.followers;
  }

  return {
    impressions,
    engagements,
    clicks,
    followers,
    engagementRate: engagementRate(engagements, impressions),
    clickThroughRate: clickThroughRate(clicks, impressions),
  };
}

export function platformBreakdown(rows: readonly DailyMetrics[]): PlatformTotals[] {
  return PLATFORMS.flatMap((platform) => {
    const platformRows = rows.filter((row) => row.platform === platform);
    return platformRows.length === 0
      ? []
      : [{ platform, ...computeTotals(platformRows) }];
  });
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return (current - previous) / previous;
}

type Dated = { date: string };

/** This week's and last week's rows. Works for any dated rows (metrics, posts). */
export type Periods<T extends Dated = DailyMetrics> = { current: T[]; previous: T[] };

/** The newest valid ISO date in the rows, ignoring malformed dates. */
export function latestValidDate(rows: readonly Dated[]): string | undefined {
  let latest: string | undefined;
  for (const row of rows) {
    if (isIsoDate(row.date) && (latest === undefined || row.date > latest)) {
      latest = row.date;
    }
  }
  return latest;
}

/** Rows whose date falls within [from, to], inclusive. ISO dates compare correctly as strings. */
function rowsBetween<T extends Dated>(rows: readonly T[], from: string, to: string): T[] {
  return rows.filter((row) => row.date >= from && row.date <= to);
}

/**
 * Splits rows into this calendar week so far and the same days of last week, relative to
 * the newest date in the data. Rows with malformed dates are ignored.
 */
export function splitPeriods<T extends Dated>(rows: readonly T[]): Periods<T> {
  const ranges = periodRanges(rows);
  if (ranges === null) {
    return { current: [], previous: [] };
  }
  const validRows = rows.filter((row) => isIsoDate(row.date));
  return {
    current: rowsBetween(validRows, ranges.current.start, ranges.current.end),
    previous: rowsBetween(validRows, ranges.previous.start, ranges.previous.end),
  };
}

/**
 * The calendar week (Sunday to Saturday) containing the newest valid date,
 * the part of it with data so far, and the same days of last week; null
 * when there are no valid dates. Shown to users so "vs last week" is never
 * ambiguous (see docs/DECISIONS.md: calendar weeks).
 */
export function periodRanges(rows: readonly Dated[]): WeekPeriods | null {
  const end = latestValidDate(rows);
  if (end === undefined) {
    return null;
  }
  const start = weekStart(end);
  const saturday = shiftDate(start, 6);
  return {
    week: { start, end: saturday },
    current: { start, end },
    previous: { start: shiftDate(start, -7), end: shiftDate(end, -7) },
    complete: end === saturday,
  };
}

/**
 * Follower change counting only platforms present in both periods, so
 * connecting or losing a platform is not reported as a gain or loss.
 */
function followersChange({ current, previous }: Periods): number | null {
  const shared = new Set(current.map((row) => row.platform));
  const previousShared = previous.filter((row) => shared.has(row.platform));
  if (previousShared.length === 0) {
    return null;
  }
  const sharedPlatforms = new Set(previousShared.map((row) => row.platform));
  const currentShared = current.filter((row) => sharedPlatforms.has(row.platform));
  return percentChange(
    computeTotals(currentShared).followers,
    computeTotals(previousShared).followers,
  );
}

/** Compares already-split periods; use this to avoid splitting the same rows twice. */
export function comparePeriodRows(periods: Periods): PeriodComparison {
  const current = computeTotals(periods.current);
  const previous = computeTotals(periods.previous);
  return {
    current,
    previous,
    change: {
      impressions: percentChange(current.impressions, previous.impressions),
      engagements: percentChange(current.engagements, previous.engagements),
      clicks: percentChange(current.clicks, previous.clicks),
      followers: followersChange(periods),
      engagementRate: percentChange(current.engagementRate, previous.engagementRate),
      clickThroughRate: percentChange(current.clickThroughRate, previous.clickThroughRate),
    },
  };
}

export function comparePeriods(rows: readonly DailyMetrics[]): PeriodComparison {
  return comparePeriodRows(splitPeriods(rows));
}

export type PlatformComparison = {
  platform: Platform;
  current: KpiTotals;
  change: KpiChange;
};

/**
 * This week's totals and change vs last week for each platform with data
 * this week, using the same weeks as the rest of the dashboard.
 */
export function platformComparison(rows: readonly DailyMetrics[]): PlatformComparison[] {
  const periods = splitPeriods(rows);
  return PLATFORMS.flatMap((platform) => {
    const current = periods.current.filter((row) => row.platform === platform);
    if (current.length === 0) {
      return [];
    }
    const previous = periods.previous.filter((row) => row.platform === platform);
    const comparison = comparePeriodRows({ current, previous });
    return [{ platform, current: comparison.current, change: comparison.change }];
  });
}
