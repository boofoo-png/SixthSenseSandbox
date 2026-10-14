import type { Trend } from "./types";

/** Trends relevant to the business first, then by growth; returns at most `limit`. */
export function topTrends(trends: readonly Trend[], limit = 5): Trend[] {
  return [...trends]
    .sort((a, b) => Number(b.relevant) - Number(a.relevant) || b.growth - a.growth)
    .slice(0, limit);
}
