import type { Platform } from "@/lib/analytics/types";
import type { TimeSlot } from "./types";

type TimingProfile = {
  base: number;
  /** Hours (0-23) when engagement peaks, with how strong each peak is. */
  peaks: readonly { hour: number; boost: number }[];
  /** Multiplier per weekday, Sunday first. */
  days: readonly number[];
};

// Typical patterns: Instagram at lunch and evenings, Facebook mornings,
// TikTok late evenings, LinkedIn weekday mornings.
const PROFILES: Record<Platform, TimingProfile> = {
  instagram: { base: 0.03, peaks: [{ hour: 12, boost: 0.6 }, { hour: 19, boost: 0.8 }], days: [1.05, 0.9, 1.0, 1.1, 1.0, 0.95, 1.15] },
  facebook: { base: 0.02, peaks: [{ hour: 9, boost: 0.7 }, { hour: 13, boost: 0.4 }], days: [0.9, 1.0, 1.05, 1.1, 1.05, 0.95, 0.85] },
  tiktok: { base: 0.05, peaks: [{ hour: 20, boost: 0.9 }, { hour: 16, boost: 0.3 }], days: [1.1, 0.95, 1.05, 1.0, 1.15, 1.2, 1.1] },
  linkedin: { base: 0.025, peaks: [{ hour: 8, boost: 0.8 }, { hour: 12, boost: 0.4 }], days: [0.4, 1.0, 1.15, 1.2, 1.1, 0.9, 0.45] },
};

/** How close an hour is to a peak (1 at the peak, fading over about 3 hours). */
function closeness(hour: number, peak: number): number {
  const distance = Math.min(Math.abs(hour - peak), 24 - Math.abs(hour - peak));
  return Math.max(0, 1 - distance / 3);
}

/** Small repeatable variation so slots are not perfectly smooth. */
function jitter(weekday: number, hour: number): number {
  return 1 + ((((weekday * 31 + hour * 17) % 7) - 3) / 100);
}

/** Sample engagement rate for every weekday and hour on a platform (deterministic). */
export function sampleEngagementByHour(platform: Platform): TimeSlot[] {
  const profile = PROFILES[platform];
  const slots: TimeSlot[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    for (let hour = 0; hour < 24; hour++) {
      const peak = profile.peaks.reduce((sum, p) => sum + p.boost * closeness(hour, p.hour), 0);
      const overnight = hour < 6 ? 0.4 : 1;
      const rate = profile.base * (1 + peak) * profile.days[weekday] * overnight * jitter(weekday, hour);
      slots.push({ weekday, hour, rate: Number(rate.toFixed(5)) });
    }
  }
  return slots;
}
