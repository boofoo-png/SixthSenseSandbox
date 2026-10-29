import type { Platform } from "@/lib/analytics/types";

export type Competitor = {
  /** URL-safe id, used in /competitors/[slug]. */
  slug: string;
  name: string;
  handle: string;
};

export type CompetitorPost = {
  competitor: string;
  platform: Platform;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  caption: string;
  hashtags: readonly string[];
  impressions: number;
  engagements: number;
  /** Campaign theme the post belongs to (hospitality sample data). */
  theme?: string;
  /** One-sentence description of the post (hospitality sample data). */
  summary?: string;
};

export type AdLibrary = "meta" | "tiktok" | "google";

export const AD_LIBRARY_LABELS: Record<AdLibrary, string> = {
  meta: "Meta",
  tiktok: "TikTok",
  google: "Google",
};

export type CompetitorAd = {
  competitor: string;
  library: AdLibrary;
  /** ISO date the ad started running. */
  startDate: string;
  /** ISO date the ad stopped, or null if it is still running. */
  endDate: string | null;
  format: "image" | "video" | "carousel" | "search";
  headline: string;
};

export type TrendKind = "topic" | "hashtag";
export type TrendSource = "social" | "search" | "industry";

export type Trend = {
  label: string;
  kind: TrendKind;
  source: TrendSource;
  /** Growth over the last week as a fraction (1.8 means +180%). */
  growth: number;
  /** Whether the trend is relevant to the user's business (a cafe). */
  relevant: boolean;
};
