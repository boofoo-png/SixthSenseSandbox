import { comparePeriods, platformBreakdown, splitPeriods } from "./kpis";
import { PLATFORM_LABELS, type DailyMetrics, type Platform } from "./types";

/** Changes smaller than this (5%) are described as steady and never flagged. */
const NOTICEABLE_CHANGE = 0.05;

const NO_DATA_MESSAGE =
  "No data for this period yet. Once posts start getting views, a summary will appear here.";

/** Formats a fraction as a percentage without a sign, e.g. -0.0756 -> "7.6%" with 1 decimal. */
export function formatPercent(fraction: number, decimals = 0): string {
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

function engagementTrendLine(change: number | null): string {
  if (change === null) {
    return "There is no data from last week yet, so there is nothing to compare.";
  }
  if (Math.abs(change) < NOTICEABLE_CHANGE) {
    return "Engagement held steady compared with last week.";
  }
  const direction = change > 0 ? "up" : "down";
  return `Engagement is ${direction} ${formatPercent(change)} compared with last week.`;
}

function biggestDropLine(rows: readonly DailyMetrics[]): string | null {
  let worst: { platform: Platform; change: number } | null = null;

  for (const { platform } of platformBreakdown(rows)) {
    const change = comparePeriods(rows.filter((row) => row.platform === platform))
      .change.engagementRate;
    if (change !== null && change <= -NOTICEABLE_CHANGE && (!worst || change < worst.change)) {
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
  const { current } = splitPeriods(rows);
  const best = bestPlatformLine(current);
  if (best === null) {
    return [NO_DATA_MESSAGE];
  }

  const lines = [best, engagementTrendLine(comparePeriods(rows).change.engagements)];
  const drop = biggestDropLine(rows);
  if (drop !== null) {
    lines.push(drop);
  }
  return lines;
}
