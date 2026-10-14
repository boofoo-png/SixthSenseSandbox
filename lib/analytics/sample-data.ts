import { daysInRange, shiftDate, type DateRange } from "./dates";
import type { DailyMetrics, Platform } from "./types";

type PlatformProfile = {
  platform: Platform;
  baseImpressions: number;
  baseEngagementRate: number;
  /** Share of engagements that are link clicks. */
  clickShare: number;
  /** Followers on the anchor date. */
  startFollowers: number;
  /** Follower growth per year as a fraction (0.5 means +50% a year). */
  yearlyGrowth: number;
  /** How far the engagement rate swings up and down over a 90-day cycle (0.25 means +/-25%). */
  rateSwing: number;
  /** Where in the cycle the platform is on the anchor date, in days. */
  phase: number;
  /** Offset so each platform's day-to-day wobble differs. */
  seed: number;
};

// Profiles give each platform a distinct character for the summary to describe:
// TikTok engages best, Instagram and LinkedIn rise and fall the most.
const PROFILES: readonly PlatformProfile[] = [
  {
    platform: "instagram",
    baseImpressions: 4200,
    baseEngagementRate: 0.05,
    clickShare: 0.12,
    startFollowers: 5200,
    yearlyGrowth: 0.5,
    rateSwing: 0.25,
    phase: 0,
    seed: 1,
  },
  {
    platform: "facebook",
    baseImpressions: 3100,
    baseEngagementRate: 0.028,
    clickShare: 0.2,
    startFollowers: 3800,
    yearlyGrowth: 0.1,
    rateSwing: 0.05,
    phase: 30,
    seed: 2,
  },
  {
    platform: "tiktok",
    baseImpressions: 6800,
    baseEngagementRate: 0.074,
    clickShare: 0.05,
    startFollowers: 2600,
    yearlyGrowth: 1.2,
    rateSwing: 0.08,
    phase: 60,
    seed: 3,
  },
  {
    platform: "linkedin",
    baseImpressions: 1500,
    baseEngagementRate: 0.032,
    clickShare: 0.3,
    startFollowers: 900,
    yearlyGrowth: 0.15,
    rateSwing: 0.3,
    phase: 45,
    seed: 4,
  },
];

/** Day numbers are counted from this date, so the same date always gives the same numbers. */
const ANCHOR = "2026-09-10";
const CYCLE_DAYS = 90;

/** Days from the anchor date (negative before it). */
function dayNumber(isoDate: string): number {
  return isoDate >= ANCHOR ? daysInRange({ start: ANCHOR, end: isoDate }) - 1 : 1 - daysInRange({ start: isoDate, end: ANCHOR });
}

/** Repeatable wobble between -0.1 and 0.1, so the data looks less flat. Works for negative days too. */
function wobble(day: number, seed: number): number {
  const step = (((day * 7 + seed * 3) % 5) + 5) % 5;
  return (step - 2) / 20;
}

function metricsFor(profile: PlatformProfile, date: string): DailyMetrics {
  const day = dayNumber(date);
  const impressions = Math.round(profile.baseImpressions * (1 + wobble(day, profile.seed)));
  const cycle = Math.sin((2 * Math.PI * (day + profile.phase)) / CYCLE_DAYS);
  const rate = profile.baseEngagementRate * (1 + profile.rateSwing * cycle);
  const engagements = Math.max(1, Math.round(impressions * rate));
  return {
    platform: profile.platform,
    date,
    impressions,
    engagements,
    clicks: Math.round(engagements * profile.clickShare),
    // Compound growth: realistic for any past date and never negative.
    followers: Math.round(profile.startFollowers * (1 + profile.yearlyGrowth) ** (day / 365)),
  };
}

/**
 * Fake metrics for every platform and every day in a range. Each day's
 * numbers depend only on its date, so any past range (even last year) has
 * stable, realistic data.
 */
export function sampleDataBetween({ start, end }: DateRange): DailyMetrics[] {
  if (end < start) {
    return [];
  }
  const days = daysInRange({ start, end });
  return PROFILES.flatMap((profile) =>
    Array.from({ length: days }, (_, i) => metricsFor(profile, shiftDate(start, i))),
  );
}

/** 30 days of fake metrics ending on `endDate`. */
export function createSampleData(endDate = "2026-10-09"): DailyMetrics[] {
  return sampleDataBetween({ start: shiftDate(endDate, -29), end: endDate });
}
