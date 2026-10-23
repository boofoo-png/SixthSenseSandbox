import { isNoticeable, roundPercent } from "@/lib/analytics/change";
import { comparePeriods, platformComparison, type KpiTotals, type PeriodComparison } from "@/lib/analytics/kpis";
import { buildSummary, formatPercent, type SummaryOptions } from "@/lib/analytics/summary";
import type { DailyMetrics, Platform } from "@/lib/analytics/types";

export type ExecutiveReport = {
  comparison: PeriodComparison;
  bestPlatform: { platform: Platform; engagementRate: number } | null;
  /** The biggest moves in plain words. */
  changes: string[];
  /** The plain-English summary, as on the other pages. */
  summary: string[];
};

type Metric = { key: keyof KpiTotals; label: string; format: (value: number) => string };

const numberFormat = new Intl.NumberFormat("en-US");

// Order matters: when two changes are the same size, the earlier metric is listed first.
const METRICS: readonly Metric[] = [
  { key: "impressions", label: "Impressions", format: (v) => numberFormat.format(v) },
  { key: "engagements", label: "Engagements", format: (v) => numberFormat.format(v) },
  { key: "engagementRate", label: "Engagement rate", format: (v) => formatPercent(v, 1) },
  { key: "followers", label: "Followers", format: (v) => numberFormat.format(v) },
  { key: "clicks", label: "Clicks", format: (v) => numberFormat.format(v) },
];

const MAX_CHANGES = 3;

/**
 * The biggest noticeable changes (up to three), largest first, each with the
 * current and comparison numbers. Uses the same rounding and "steady"
 * threshold as the tiles and summary so the report never disagrees with them.
 */
export function whatChanged(comparison: PeriodComparison, comparisonPhrase: string): string[] {
  const moves = METRICS.flatMap((metric, order) => {
    const change = comparison.change[metric.key];
    if (change === null || !isNoticeable(change)) {
      return [];
    }
    const direction = change > 0 ? "up" : "down";
    const text = `${metric.label} ${direction} ${formatPercent(change)} (${metric.format(comparison.current[metric.key])} vs ${metric.format(comparison.previous[metric.key])}).`;
    return [{ size: Math.abs(roundPercent(change)), order, text }];
  });

  if (moves.length === 0) {
    return [`Everything held steady compared with ${comparisonPhrase}.`];
  }
  return moves
    .sort((a, b) => b.size - a.size || a.order - b.order)
    .slice(0, MAX_CHANGES)
    .map((move) => move.text);
}

/** Everything the executive overview shows, for the chosen date ranges. */
export function buildExecutiveReport(rows: readonly DailyMetrics[], options: SummaryOptions): ExecutiveReport {
  const comparison = comparePeriods(rows, options.ranges);
  const best = platformComparison(rows, options.ranges)
    .filter((p) => p.current.impressions > 0)
    .sort((a, b) => b.current.engagementRate - a.current.engagementRate)[0];

  return {
    comparison,
    bestPlatform: best ? { platform: best.platform, engagementRate: best.current.engagementRate } : null,
    changes: whatChanged(comparison, options.comparisonPhrase ?? "last week"),
    summary: buildSummary(rows, options),
  };
}
