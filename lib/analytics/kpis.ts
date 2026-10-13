import { isIsoDate, shiftDate } from "./dates";
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

export type Periods = { current: DailyMetrics[]; previous: DailyMetrics[] };

function latestDate(rows: readonly DailyMetrics[]): string | undefined {
  let latest: string | undefined;
  for (const row of rows) {
    if (latest === undefined || row.date > latest) {
      latest = row.date;
    }
  }
  return latest;
}

/** Rows whose date falls within [from, to], inclusive. ISO dates compare correctly as strings. */
function rowsBetween(rows: readonly DailyMetrics[], from: string, to: string): DailyMetrics[] {
  return rows.filter((row) => row.date >= from && row.date <= to);
}

/**
 * Splits rows into the latest `days` days and the `days` before, relative to
 * the newest date in the data. Rows with malformed dates are ignored.
 */
export function splitPeriods(rows: readonly DailyMetrics[], days = 7): Periods {
  const validRows = rows.filter((row) => isIsoDate(row.date));
  const end = latestDate(validRows);
  if (end === undefined) {
    return { current: [], previous: [] };
  }
  const currentStart = shiftDate(end, -(days - 1));
  const previousEnd = shiftDate(currentStart, -1);
  const previousStart = shiftDate(previousEnd, -(days - 1));
  return {
    current: rowsBetween(validRows, currentStart, end),
    previous: rowsBetween(validRows, previousStart, previousEnd),
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

export function comparePeriods(rows: readonly DailyMetrics[], days = 7): PeriodComparison {
  return comparePeriodRows(splitPeriods(rows, days));
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
export function platformComparison(rows: readonly DailyMetrics[], days = 7): PlatformComparison[] {
  const periods = splitPeriods(rows, days);
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
