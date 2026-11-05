import { daysInRange, formatShortDate, type DateRange } from "@/lib/analytics/dates";
import { engagementRate, percentChange, splitPeriods, type CompareRanges } from "@/lib/analytics/kpis";
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/analytics/types";
import { competitorDetail, isAdActive, type HashtagCount } from "./activity";
import type { Audience, TrackableCompetitor } from "./hospitality";
import { recurringThemes, type RecurringTheme } from "./themes";
import { AD_LIBRARY_LABELS, type Competitor, type CompetitorAd, type CompetitorPost } from "./types";

// Summaries for the Figma Make's Competitors page, built on the hospitality sample posts and ads.

/** A small, stable number from text, so a competitor always gets the same sample score. */
function seedOf(text: string): number {
  let hash = 5381;
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/** Sample audience match, percent: sign-up competitors highest, then those selling to `audience`. */
export function audienceMatch(competitor: TrackableCompetitor, audience: Audience | null): number {
  const seed = seedOf(competitor.slug);
  if (competitor.source === "sign-up") return 90 + (seed % 8);
  const sells = audience === null ? competitor.audiences.length > 0 : competitor.audiences.includes(audience);
  return sells ? 78 + (seed % 18) : 60 + (seed % 15);
}

function rateOf(posts: readonly CompetitorPost[]): number {
  return engagementRate(
    posts.reduce((sum, post) => sum + post.engagements, 0),
    posts.reduce((sum, post) => sum + post.impressions, 0),
  );
}

export type CompetitorSummary = {
  postsPerWeek: number;
  /** Change in posts against the comparison period, as a fraction; null when it had none. */
  postsChange: number | null;
  engagementRate: number;
  /** Change in engagement rate, in percentage points; null when the comparison period had no posts. */
  engagementChangePoints: number | null;
  best: CompetitorPost | null;
  worst: CompetitorPost | null;
  hashtags: HashtagCount[];
  activeAds: CompetitorAd[];
  adLibraries: string[];
};

/** Posting frequency, engagement, best and worst posts, hashtags, and running ads for one competitor. */
export function competitorSummary(slug: string, posts: readonly CompetitorPost[], ads: readonly CompetitorAd[], ranges: CompareRanges): CompetitorSummary {
  const own = posts.filter((post) => post.competitor === slug);
  const { current, previous } = splitPeriods(own, ranges);
  const detail = competitorDetail(slug, own, ads, ranges);
  const rate = rateOf(current);
  const ranked = [...current].sort((a, b) => engagementRate(b.engagements, b.impressions) - engagementRate(a.engagements, a.impressions));
  return {
    postsPerWeek: Math.round((current.length / daysInRange(ranges.current)) * 7 * 10) / 10,
    postsChange: previous.length === 0 ? null : percentChange(current.length, previous.length),
    engagementRate: rate,
    engagementChangePoints: previous.length === 0 ? null : (rate - rateOf(previous)) * 100,
    best: ranked[0] ?? null,
    worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    hashtags: detail.topHashtags,
    activeAds: detail.activeAds,
    adLibraries: [...new Set(detail.activeAds.map((item) => AD_LIBRARY_LABELS[item.library]))],
  };
}

/** The tracked competitor with the largest share of engagements in the current period. */
export function attentionShare(
  competitors: readonly Competitor[],
  posts: readonly CompetitorPost[],
  ranges: CompareRanges,
): { leader: string; share: number; competitors: number } | null {
  const { current } = splitPeriods(posts, ranges);
  const totals = competitors.map((competitor) => ({
    name: competitor.name,
    engagements: current.filter((post) => post.competitor === competitor.slug).reduce((sum, post) => sum + post.engagements, 0),
  }));
  const all = totals.reduce((sum, row) => sum + row.engagements, 0);
  if (all === 0) return null;
  const top = totals.reduce((best, row) => (row.engagements > best.engagements ? row : best));
  return { leader: top.name, share: top.engagements / all, competitors: competitors.length };
}

/** Ads that started during `range`. */
export function newCampaigns(ads: readonly CompetitorAd[], range: DateRange): number {
  return ads.filter((item) => item.startDate >= range.start && item.startDate <= range.end).length;
}

export type ChannelItem = { key: string; channel: string; format: string; title: string; detail: string; date: string };

const MAX_CHANNEL_ITEMS = 8;

function daysBetween(from: string, to: string): number {
  return daysInRange({ start: from, end: to }) - 1;
}

/** One competitor's posts and ads in `range`, newest first (ads by launch date), as "channel activity". */
export function channelActivity(slug: string, posts: readonly CompetitorPost[], ads: readonly CompetitorAd[], range: DateRange): ChannelItem[] {
  const end = range.end;
  const fromPosts = posts
    .filter((item) => item.competitor === slug && item.date >= range.start && item.date <= end)
    .map((item, index) => {
      const days = daysBetween(item.date, end);
      return {
        key: `post-${item.date}-${index}`,
        channel: PLATFORM_LABELS[item.platform],
        format: "Post",
        title: item.caption,
        detail: days === 0 ? "Posted today" : `Posted ${days} ${days === 1 ? "day" : "days"} ago`,
        date: item.date,
      };
    });
  const fromAds = ads
    .filter((item) => item.competitor === slug && item.startDate <= end && (item.endDate === null || item.endDate >= range.start))
    .map((item, index) => {
      const running = isAdActive(item, end);
      const stop = running ? end : (item.endDate as string);
      const days = daysBetween(item.startDate, stop);
      return {
        key: `ad-${item.startDate}-${index}`,
        channel: AD_LIBRARY_LABELS[item.library],
        format: `Sponsored ${item.format}`,
        title: item.headline,
        detail: running ? `${days} ${days === 1 ? "day" : "days"} active` : `Ran ${days} days, ended ${formatShortDate(stop)}`,
        date: item.startDate,
      };
    });
  return [...fromPosts, ...fromAds]
    .sort((a, b) => b.date.localeCompare(a.date) || (a.format === "Post" ? -1 : 1))
    .slice(0, MAX_CHANNEL_ITEMS);
}

export type ThemePattern = RecurringTheme & {
  /** Change in posts using the theme against the comparison period; null when it had none. */
  change: number | null;
  channels: string[];
};

/** Recurring themes (shared by two or more competitors) with their growth and channels. */
export function themePatterns(posts: readonly CompetitorPost[], competitors: readonly Competitor[], ranges: CompareRanges): ThemePattern[] {
  const { current, previous } = splitPeriods(posts, ranges);
  return recurringThemes(current, competitors).map((theme) => {
    const now = current.filter((post) => post.theme === theme.theme);
    const before = previous.filter((post) => post.theme === theme.theme).length;
    const platforms = new Set(now.map((post) => post.platform));
    return {
      ...theme,
      change: before === 0 ? null : percentChange(now.length, before),
      channels: PLATFORMS.filter((platform) => platforms.has(platform)).map((platform) => PLATFORM_LABELS[platform]),
    };
  });
}
