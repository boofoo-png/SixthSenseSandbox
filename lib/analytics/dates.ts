const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Adds `days` (may be negative) to an ISO date (YYYY-MM-DD), in UTC. */
export function shiftDate(isoDate: string, days: number): string {
  const time = Date.parse(`${isoDate}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(time).toISOString().slice(0, 10);
}
