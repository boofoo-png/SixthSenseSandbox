export type Platform = "instagram" | "facebook" | "tiktok" | "linkedin";

export const PLATFORMS: readonly Platform[] = [
  "instagram",
  "facebook",
  "tiktok",
  "linkedin",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

/** One platform's metrics for one day. `date` is an ISO date (YYYY-MM-DD). */
export type DailyMetrics = {
  platform: Platform;
  date: string;
  impressions: number;
  engagements: number;
  clicks: number;
  /** Follower count at the end of the day (a running total, not a daily gain). */
  followers: number;
};
