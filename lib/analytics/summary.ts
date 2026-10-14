import { isNoticeable, roundPercent } from "./change";
import {
  comparePeriodRows,
  computeTotals,
  percentChange,
  platformBreakdown,
  splitPeriods,
  type CompareRanges,
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

function bestPlatformLine(currentRows: readonly DailyMetrics[], currentPhrase: string): string | null {
  const ranked = platformBreakdown(currentRows)
    .filter((p) => p.impressions > 0)
    .sort((a, b) => b.engagementRate - a.engagementRate);
  const best = ranked[0];
  if (!best) {
    return null;
  }
  return `${PLATFORM_LABELS[best.platform]} had your best engagement rate ${currentPhrase} (${formatPercent(best.engagementRate, 1)}).`;
}

/** Describes the overall engagement rate change, matching the "Engagement rate" tile. */
function engagementTrendLine(periods: Periods, comparison: PeriodComparison, compared: string): string {
  if (periods.previous.length === 0) {
    return `There is no data from ${compared} yet, so there is nothing to compare.`;
  }
  if (comparison.previous.impressions === 0) {
    return `Your posts had no views during ${compared}, so there is nothing to compare.`;
  }
  const change = comparison.change.engagementRate;
  if (change === null) {
    return `Engagement rate went up from 0% (${compared}) to ${formatPercent(comparison.current.engagementRate, 1)}.`;
  }
  if (!isNoticeable(change)) {
    return `Engagement rate held steady compared with ${compared}.`;
  }
  const direction = change > 0 ? "up" : "down";
  return `Engagement rate is ${direction} ${formatPercent(change)} compared with ${compared}.`;
}

/**
 * Flags the platform whose engagement rate fell the most, using the same
 * periods as the rest of the dashboard. Platforms need views in both periods.
 */
function biggestDropLine(periods: Periods, compared: string): string | null {
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
  return `${PLATFORM_LABELS[worst.platform]}'s engagement rate dropped ${formatPercent(worst.change)} from ${compared} - worth a look.`;
}

export type SummaryOptions = {
  /** Which dates to compare; defaults to this week so far vs the same days last week. */
  ranges?: CompareRanges;
  /** Describes the period shown, e.g. "during Oct 11 - 17". */
  currentPhrase?: string;
  /** Names the comparison period, e.g. "Oct 4 - 10". */
  comparisonPhrase?: string;
};

/**
 * Explains the selected period's performance in a few plain sentences, using
 * fixed rules (see docs/DECISIONS.md: rule-based summary).
 */
export function buildSummary(rows: readonly DailyMetrics[], options: SummaryOptions = {}): string[] {
  const { ranges, currentPhrase = "this week", comparisonPhrase = "last week" } = options;
  const periods = splitPeriods(rows, ranges);
  const best = bestPlatformLine(periods.current, currentPhrase);
  if (best === null) {
    return [NO_DATA_MESSAGE];
  }

  const lines = [best, engagementTrendLine(periods, comparePeriodRows(periods), comparisonPhrase)];
  const drop = biggestDropLine(periods, comparisonPhrase);
  if (drop !== null) {
    lines.push(drop);
  }
  return lines;
}
