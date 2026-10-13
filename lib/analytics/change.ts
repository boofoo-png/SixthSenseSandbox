/** Changes that round to less than this many percent are described as steady. */
const NOTICEABLE_PERCENT = 5;

/**
 * Converts a change fraction to a whole percent, rounding halves away from
 * zero so +12.5% and -12.5% both show as 13. Shared by the KPI tiles and
 * the summary so they always agree.
 */
export function roundPercent(fraction: number): number {
  // Trim floating-point noise first (12.499999999999997 -> 12.5) so halves round as expected.
  const exact = Number((Math.abs(fraction) * 100).toFixed(9));
  const percent = Math.sign(fraction) * Math.round(exact);
  return percent === 0 ? 0 : percent;
}

/** True when a change is big enough to call out rather than call steady. */
export function isNoticeable(fraction: number): boolean {
  return Math.abs(roundPercent(fraction)) >= NOTICEABLE_PERCENT;
}
