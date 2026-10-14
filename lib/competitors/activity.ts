import {
  engagementRate,
  latestValidDate,
  percentChange,
  splitPeriods,
  type CompareRanges,
} from "@/lib/analytics/kpis";
import { isIsoDate, shiftDate, weekStart, type DateRange } from "@/lib/analytics/dates";
import { PLATFORMS, type Platform } from "@/lib/analytics/types";
import type { Competitor, CompetitorAd, CompetitorPost } from "./types";

export type CompetitorActivity = {
  competitor: Competitor;
  postsThisWeek: number;
  /** This week's engagements divided by impressions. */
  engagementRate: number;
  /** Change in engagement rate vs last week as a fraction; null when last week had no engagement to compare. */
  engagementRateChange: number | null;
  activeAds: number;
};

export type HashtagCount = { tag: string; count: number };

export type CompetitorDetail = {
  topPosts: CompetitorPost[];
  bottomPosts: CompetitorPost[];
  topHashtags: HashtagCount[];
  activeAds: CompetitorAd[];
};

export type CompetitorHighlights = {
  mostActive: CompetitorActivity | null;
  bestEngagement: CompetitorActivity | null;
  activeAds: number;
  competitorsWithAds: number;
};

const TOP_POSTS = 3;
const TOP_HASHTAGS = 5;

/** True when the ad was running on `date` (start and end dates inclusive). */
export function isAdActive(ad: CompetitorAd, date: string): boolean {
  return ad.startDate <= date && (ad.endDate === null || ad.endDate >= date);
}

function postsRate(posts: readonly CompetitorPost[]): number {
  let engagements = 0;
  let impressions = 0;
  for (const post of posts) {
    engagements += post.engagements;
    impressions += post.impressions;
  }
  return engagementRate(engagements, impressions);
}

function postRate(post: CompetitorPost): number {
  return engagementRate(post.engagements, post.impressions);
}

function activeAdsFor(slug: string, ads: readonly CompetitorAd[], asOf: string | undefined): CompetitorAd[] {
  if (asOf === undefined) {
    return [];
  }
  return ads.filter((ad) => ad.competitor === slug && isAdActive(ad, asOf));
}

/**
 * One row per competitor for this week, using the same weeks for everyone
 * (anchored on the newest post in the data). Malformed dates are ignored.
 */
export function competitorActivity(
  competitors: readonly Competitor[],
  posts: readonly CompetitorPost[],
  ads: readonly CompetitorAd[],
  ranges?: CompareRanges,
): CompetitorActivity[] {
  const periods = splitPeriods(posts, ranges);
  const asOf = ranges?.current.end ?? latestValidDate(posts);

  return competitors.map((competitor) => {
    const current = periods.current.filter((post) => post.competitor === competitor.slug);
    const previous = periods.previous.filter((post) => post.competitor === competitor.slug);
    const rate = postsRate(current);
    return {
      competitor,
      postsThisWeek: current.length,
      engagementRate: rate,
      engagementRateChange: percentChange(rate, postsRate(previous)),
      activeAds: activeAdsFor(competitor.slug, ads, asOf).length,
    };
  });
}

/** Top and bottom posts in the period, most-used hashtags in the period, and ads running at its end, for one competitor. */
export function competitorDetail(
  slug: string,
  posts: readonly CompetitorPost[],
  ads: readonly CompetitorAd[],
  ranges?: CompareRanges,
): CompetitorDetail {
  const asOf = ranges?.current.end ?? latestValidDate(posts);
  const inPeriod = splitPeriods(posts, ranges).current.filter((post) => post.competitor === slug);
  const thisWeek = [...inPeriod].sort((a, b) => postRate(b) - postRate(a));

  const topPosts = thisWeek.slice(0, TOP_POSTS);
  const bottomPosts = thisWeek.slice(TOP_POSTS).reverse().slice(0, TOP_POSTS);

  const counts = new Map<string, number>();
  for (const post of inPeriod) {
    for (const tag of post.hashtags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const topHashtags = [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, TOP_HASHTAGS);

  return { topPosts, bottomPosts, topHashtags, activeAds: activeAdsFor(slug, ads, asOf) };
}

/** Headline facts for the overview card. Only competitors who posted this week can be "most active" or "best engagement". */
export function competitorHighlights(activity: readonly CompetitorActivity[]): CompetitorHighlights {
  const posting = activity.filter((a) => a.postsThisWeek > 0);
  const mostActive = posting.reduce<CompetitorActivity | null>(
    (best, a) => (best === null || a.postsThisWeek > best.postsThisWeek ? a : best),
    null,
  );
  const bestEngagement = posting.reduce<CompetitorActivity | null>(
    (best, a) => (best === null || a.engagementRate > best.engagementRate ? a : best),
    null,
  );
  return {
    mostActive,
    bestEngagement,
    activeAds: activity.reduce((sum, a) => sum + a.activeAds, 0),
    competitorsWithAds: activity.filter((a) => a.activeAds > 0).length,
  };
}

export type WeekRange = DateRange;

export type WeeklyEngagement = {
  /** Sunday-to-Saturday weeks, oldest first, ending with the week of the newest data. */
  weeks: WeekRange[];
  /** One series per competitor; a null rate means no posts that week. */
  series: { competitor: Competitor; rates: (number | null)[] }[];
};

const MAX_CHART_WEEKS = 12;

/**
 * Weekly engagement rate per competitor for the Sunday-to-Saturday weeks in
 * `range` (at most the latest 12). Without a range, the last 4 weeks of data.
 * Only posts inside the range count, so partial first and last weeks are fair.
 */
export function weeklyEngagement(
  competitors: readonly Competitor[],
  posts: readonly CompetitorPost[],
  range?: DateRange,
): WeeklyEngagement {
  const latest = latestValidDate(posts);
  const bounds = range ?? (latest === undefined ? undefined : { start: shiftDate(weekStart(latest), -21), end: latest });
  if (bounds === undefined) {
    return { weeks: [], series: competitors.map((competitor) => ({ competitor, rates: [] })) };
  }

  const allWeeks: WeekRange[] = [];
  for (let start = weekStart(bounds.start); start <= bounds.end; start = shiftDate(start, 7)) {
    allWeeks.push({ start, end: shiftDate(start, 6) });
  }
  const weeks = allWeeks.slice(-MAX_CHART_WEEKS);

  const series = competitors.map((competitor) => ({
    competitor,
    rates: weeks.map(({ start, end: weekEnd }) => {
      const from = start > bounds.start ? start : bounds.start;
      const to = weekEnd < bounds.end ? weekEnd : bounds.end;
      const inWeek = posts.filter(
        (post) =>
          post.competitor === competitor.slug &&
          isIsoDate(post.date) &&
          post.date >= from &&
          post.date <= to,
      );
      return inWeek.length === 0 ? null : postsRate(inWeek);
    }),
  }));

  return { weeks, series };
}

export type PlatformActivity = { platform: Platform; posts: number; engagementRate: number };

/** Posts and engagement rate per platform for one competitor this week, in platform order. */
export function platformActivity(
  slug: string,
  posts: readonly CompetitorPost[],
  ranges?: CompareRanges,
): PlatformActivity[] {
  const thisWeek = splitPeriods(posts, ranges).current.filter((post) => post.competitor === slug);
  return PLATFORMS.flatMap((platform) => {
    const onPlatform = thisWeek.filter((post) => post.platform === platform);
    return onPlatform.length === 0
      ? []
      : [{ platform, posts: onPlatform.length, engagementRate: postsRate(onPlatform) }];
  });
}
