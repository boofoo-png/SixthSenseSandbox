import { shiftDate } from "./dates";
import type { DailyMetrics, Platform } from "./types";

type PlatformProfile = {
  platform: Platform;
  baseImpressions: number;
  baseEngagementRate: number;
  /** Share of engagements that are link clicks. */
  clickShare: number;
  startFollowers: number;
  followersPerDay: number;
  /** Daily change applied to the engagement rate, so recent weeks differ. */
  rateTrendPerDay: number;
  /** Offset so each platform's day-to-day wobble differs. */
  seed: number;
};

// Profiles give each platform a distinct story for the summary to describe:
// TikTok engages best, Instagram is improving, LinkedIn is slipping.
const PROFILES: readonly PlatformProfile[] = [
  {
    platform: "instagram",
    baseImpressions: 4200,
    baseEngagementRate: 0.045,
    clickShare: 0.12,
    startFollowers: 5200,
    followersPerDay: 18,
    rateTrendPerDay: 0.012,
    seed: 1,
  },
  {
    platform: "facebook",
    baseImpressions: 3100,
    baseEngagementRate: 0.028,
    clickShare: 0.2,
    startFollowers: 3800,
    followersPerDay: 4,
    rateTrendPerDay: 0,
    seed: 2,
  },
  {
    platform: "tiktok",
    baseImpressions: 6800,
    baseEngagementRate: 0.072,
    clickShare: 0.05,
    startFollowers: 2600,
    followersPerDay: 35,
    rateTrendPerDay: 0.002,
    seed: 3,
  },
  {
    platform: "linkedin",
    baseImpressions: 1500,
    baseEngagementRate: 0.038,
    clickShare: 0.3,
    startFollowers: 900,
    followersPerDay: 2,
    rateTrendPerDay: -0.015,
    seed: 4,
  },
];

const DAYS = 30;

/** Repeatable wobble between -0.1 and 0.1, so the data looks less flat. */
function wobble(day: number, seed: number): number {
  return (((day * 7 + seed * 3) % 5) - 2) / 20;
}

/**
 * Builds 30 days of fake metrics per platform, ending on `endDate`.
 * Output is fully deterministic so tests and screenshots are stable.
 */
export function createSampleData(endDate = "2026-10-09"): DailyMetrics[] {
  const startDate = shiftDate(endDate, -(DAYS - 1));
  const rows: DailyMetrics[] = [];

  for (const profile of PROFILES) {
    for (let day = 0; day < DAYS; day++) {
      const impressions = Math.round(
        profile.baseImpressions * (1 + wobble(day, profile.seed)),
      );
      const rate =
        profile.baseEngagementRate * (1 + profile.rateTrendPerDay * day);
      const engagements = Math.max(1, Math.round(impressions * rate));

      rows.push({
        platform: profile.platform,
        date: shiftDate(startDate, day),
        impressions,
        engagements,
        clicks: Math.round(engagements * profile.clickShare),
        followers: profile.startFollowers + profile.followersPerDay * day,
      });
    }
  }

  return rows;
}
