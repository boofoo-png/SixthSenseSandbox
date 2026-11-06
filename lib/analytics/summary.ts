// Percent formatting shared by the Competitors page.

/**
 * Formats a fraction as a percentage without a sign, e.g. -0.0756 -> "7.6%" with 1 decimal.
 * Whole percents round halves away from zero, so 0.125 shows as 13%.
 */
export function formatPercent(fraction: number, decimals = 0): string {
  if (decimals === 0) {
    // Trim floating-point noise first (12.499999999999997 -> 12.5) so halves round as expected.
    return `${Math.round(Number((Math.abs(fraction) * 100).toFixed(9)))}%`;
  }
  return `${(Math.abs(fraction) * 100).toFixed(decimals)}%`;
}
