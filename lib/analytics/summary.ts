import { isNoticeable, roundPercent } from "./change";
import {
  comparePeriodRows,
  computeTotals,
  percentChange,
  platformBreakdown,
  splitPeriods,
  type PeriodComparison,
  type Periods,
} from "./kpis";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "./types";
import type { DailyMetrics } from "./types";

const NO_DATA_MESSAGE =
  "No data for this period yet. Once posts start getting views, a summary will appear here.";

/**
 * Formats a fraction as a percentage without a sign, e.g. -0.0756 -> "7.6%"
 * with 1 decimal. Whole percents use the same rounding as the KPI tiles.
 */
export function formatPercent(fraction: number, decimals = 0): string {
  if (decimals === 0) {
    return `${Math.abs(roundPercent(fraction))}%`;
  }
  return `${(Math.abs(fraction) * 100).toFixed(decimals)}%`;
}

function bestPlatformLine(currentRows: readonly DailyMetrics[]): string | null {
  const ranked = platformBreakdown(currentRows)
    .filter((p) => p.impressions > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);
  const best = ranked[0];
  if (!best) {
    return null;
  }
  return `${PLATFORM_LABELS[best.platform]} had your best engagement rate this week (${formatPercent(best.engagementRate, 1)}).`;
}

/** Describes the overall engagement rate change, matching the "Engagement rate" tile. */
function engagementTrendLine(periods: Periods, comparison: PeriodComparison): string {
  if (periods.previous.length === 0) {
    return "There is no data from last week yet, so there is nothing to compare.";
  }
  if (comparison.previous.impressions === 0) {
    return "Your posts had no views last week, so there is nothing to compare.";
  }
  const change = comparison.change.engagementRate;
  if (change === null) {
    return `Engagement rate went up from 0% last week to ${formatPercent(comparison.current.engagementRate, 1)}.`;
  }
  if (!isNoticeable(change)) {
    return "Engagement rate held steady compared with last week.";
  }
  const direction = change > 0 ? "up" : "down";
  return `Engagement rate is ${direction} ${formatPercent(change)} compared with last week.`;
}

/**
 * Flags the platform whose engagement rate fell the most, using the same
 * weeks as the rest of the dashboard. Platforms need views in both weeks.
 */
function biggestDropLine(periods: Periods): string | null {
  let worst: { platform: Platform; change: number } | null = null;

  for (const platform of PLATFORMS) {
    const current = computeTotals(periods.current.filter((row) => row.platform === platform));
    const previous = computeTotals(periods.previous.filter((row) => row.platform === platform));
    if (current.impressions === 0 || previous.impressions === 0) {
      continue;
    }
    const change = percentChange(current.engagementRate, previous.engagementRate);
    if (change !== null && change < 0 && isNoticeable(change) && (!worst || change < worst.change)) {
      worst = { platform, change };
    }
  }

  if (!worst) {
    return null;
  }
  return `${PLATFORM_LABELS[worst.platform]}'s engagement rate dropped ${formatPercent(worst.change)} from last week - worth a look.`;
}

/**
 * Explains the latest week's performance in a few plain sentences, using
 * fixed rules (see docs/DECISIONS.md: rule-based summary).
 */
export function buildSummary(rows: readonly DailyMetrics[]): string[] {
  const periods = splitPeriods(rows);
  const best = bestPlatformLine(periods.current);
  if (best === null) {
    return [NO_DATA_MESSAGE];
  }

  const lines = [best, engagementTrendLine(periods, comparePeriodRows(periods))];
  const drop = biggestDropLine(periods);
  if (drop !== null) {
    lines.push(drop);
  }
  return lines;
}
