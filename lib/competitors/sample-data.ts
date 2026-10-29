import { daysInRange, shiftDate, type DateRange } from "@/lib/analytics/dates";
import type { Platform } from "@/lib/analytics/types";
import type { Competitor, CompetitorAd, CompetitorPost, Trend } from "./types";

// Fictional local cafes (see docs/DECISIONS.md: fictional sample competitors).
export const SAMPLE_COMPETITORS: readonly Competitor[] = [
  { slug: "brightside-bakery", name: "Brightside Bakery", handle: "@brightsidebakes" },
  { slug: "northwind-coffee", name: "Northwind Coffee", handle: "@northwindcoffee" },
  { slug: "ember-and-oak", name: "Ember & Oak Cafe", handle: "@emberandoak" },
  { slug: "little-fern", name: "Little Fern Tea House", handle: "@littleferntea" },
];

/** How a sample competitor posts; also used by the hospitality sample data (./hospitality.ts). */
export type PostingProfile = {
  competitor: string;
  /** Posts on days where day % everyNDays === 0. */
  everyNDays: number;
  postsPerDay: number;
  baseImpressions: number;
  baseEngagementRate: number;
  /** How far the engagement rate swings up and down over a 60-day cycle (0.3 means +/-30%). */
  rateSwing: number;
  /** Where in the cycle the cafe is on the anchor date, in days. */
  phase: number;
  platforms: readonly Platform[];
  captions: readonly string[];
  hashtags: readonly string[];
  seed: number;
  /** Campaign theme for each caption, by index (optional). */
  themes?: readonly string[];
  /** Summary for each caption, by index (optional). */
  summaries?: readonly string[];
};

// Each cafe has a distinct story: Brightside posts a lot but engages poorly,
// Northwind posts rarely but engages well, Ember & Oak leans on ads, and
// Little Fern's engagement swings the most.
const PROFILES: readonly PostingProfile[] = [
  {
    competitor: "brightside-bakery",
    everyNDays: 1,
    postsPerDay: 2,
    baseImpressions: 2400,
    baseEngagementRate: 0.021,
    rateSwing: 0.05,
    phase: 0,
    platforms: ["instagram", "facebook", "tiktok"],
    captions: [
      "Fresh croissants just out of the oven",
      "Two-for-one muffins until noon",
      "Meet our new sourdough loaf",
      "Weekend brunch boxes are back",
      "Behind the scenes at 5am bake",
    ],
    hashtags: ["#bakery", "#croissant", "#breakfast", "#sourdough", "#shoplocal"],
    seed: 1,
  },
  {
    competitor: "northwind-coffee",
    everyNDays: 3,
    postsPerDay: 1,
    baseImpressions: 5200,
    baseEngagementRate: 0.081,
    rateSwing: 0.1,
    phase: 20,
    platforms: ["instagram", "tiktok"],
    captions: [
      "How we roast our single-origin beans",
      "Latte art challenge: vote for your favourite",
      "Meet Sam, our head barista",
      "Our cold brew recipe, step by step",
    ],
    hashtags: ["#coffee", "#latteart", "#barista", "#coldbrew", "#specialtycoffee"],
    seed: 2,
  },
  {
    competitor: "ember-and-oak",
    everyNDays: 1,
    postsPerDay: 1,
    baseImpressions: 3300,
    baseEngagementRate: 0.039,
    rateSwing: 0.2,
    phase: 35,
    platforms: ["instagram", "facebook"],
    captions: [
      "Pumpkin spice is back for fall",
      "Live music every Friday night",
      "Cozy corner seats for remote work",
      "New seasonal menu, now serving",
    ],
    hashtags: ["#pumpkinspice", "#fallvibes", "#coffee", "#livemusic", "#cafe"],
    seed: 3,
  },
  {
    competitor: "little-fern",
    everyNDays: 2,
    postsPerDay: 1,
    baseImpressions: 1800,
    baseEngagementRate: 0.043,
    rateSwing: 0.35,
    phase: 50,
    platforms: ["instagram", "tiktok"],
    captions: [
      "Matcha tasting flight this weekend",
      "Our tea garden in full bloom",
      "Quiet reading hour every Sunday",
      "Homemade scones and loose-leaf tea",
    ],
    hashtags: ["#matcha", "#tea", "#teatime", "#booklovers", "#shoplocal"],
    seed: 4,
  },
];

/** Day numbers are counted from this date, so the same date always gives the same posts. */
const ANCHOR = "2026-09-10";
const CYCLE_DAYS = 60;

/** Days from the anchor date (negative before it). */
function dayNumber(isoDate: string): number {
  return isoDate >= ANCHOR ? daysInRange({ start: ANCHOR, end: isoDate }) - 1 : 1 - daysInRange({ start: isoDate, end: ANCHOR });
}

/** Modulo that stays positive for negative day numbers. */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Repeatable variation between -0.4 and 0.4, so some posts do much better than others. */
function postVariation(day: number, index: number, seed: number): number {
  return (mod(day * 13 + index * 7 + seed * 5, 9) - 4) / 10;
}

/** Picks two or three hashtags from a pool in a repeatable way. */
function pickHashtags(pool: readonly string[], n: number): string[] {
  const count = 2 + mod(n, 2);
  return Array.from({ length: count }, (_, i) => pool[mod(n + i * 2, pool.length)]);
}

function postsOn(profile: PostingProfile, date: string): CompetitorPost[] {
  const day = dayNumber(date);
  // Offset by seed so cafes posting every few days still post in most weeks.
  if (mod(day + profile.seed, profile.everyNDays) !== 0) {
    return [];
  }
  const cycle = Math.sin((2 * Math.PI * (day + profile.phase)) / CYCLE_DAYS);
  return Array.from({ length: profile.postsPerDay }, (_, index) => {
    const n = day * profile.postsPerDay + index;
    const variation = postVariation(day, index, profile.seed);
    const impressions = Math.round(profile.baseImpressions * (1 + variation / 2));
    const rate = profile.baseEngagementRate * (1 + profile.rateSwing * cycle) * (1 + variation);
    const captionIndex = mod(n, profile.captions.length);
    return {
      competitor: profile.competitor,
      platform: profile.platforms[mod(n, profile.platforms.length)],
      date,
      caption: profile.captions[captionIndex],
      ...(profile.themes ? { theme: profile.themes[captionIndex] } : {}),
      ...(profile.summaries ? { summary: profile.summaries[captionIndex] } : {}),
      hashtags: pickHashtags(profile.hashtags, n),
      impressions,
      engagements: Math.max(0, Math.round(impressions * rate)),
    };
  });
}

/** Posts for every day in a range from the given posting profiles (each day depends only on its date). */
export function postsForProfilesBetween(profiles: readonly PostingProfile[], { start, end }: DateRange): CompetitorPost[] {
  if (end < start) {
    return [];
  }
  const days = daysInRange({ start, end });
  return profiles.flatMap((profile) => Array.from({ length: days }, (_, i) => postsOn(profile, shiftDate(start, i))).flat());
}

/**
 * Fictional competitor posts for every day in a range. Each day's posts
 * depend only on its date, so any past range (even last year) has data.
 */
export function samplePostsBetween(range: DateRange): CompetitorPost[] {
  return postsForProfilesBetween(PROFILES, range);
}

/** 30 days of fictional competitor posts ending on `endDate`. */
export function createSamplePosts(endDate = "2026-10-09"): CompetitorPost[] {
  return samplePostsBetween({ start: shiftDate(endDate, -29), end: endDate });
}

/** Fictional ads as they might appear in the Meta, TikTok, and Google ad libraries. */
export function createSampleAds(endDate = "2026-10-09"): CompetitorAd[] {
  const daysAgo = (days: number) => shiftDate(endDate, -days);
  return [
    { competitor: "ember-and-oak", library: "meta", startDate: daysAgo(12), endDate: null, format: "image", headline: "Pumpkin spice season is here" },
    { competitor: "ember-and-oak", library: "meta", startDate: daysAgo(5), endDate: null, format: "video", headline: "Live music Fridays at Ember & Oak" },
    { competitor: "ember-and-oak", library: "google", startDate: daysAgo(20), endDate: null, format: "search", headline: "Cafe with wifi near you" },
    { competitor: "ember-and-oak", library: "tiktok", startDate: daysAgo(28), endDate: daysAgo(14), format: "video", headline: "Summer iced drinks" },
    { competitor: "brightside-bakery", library: "meta", startDate: daysAgo(3), endDate: null, format: "carousel", headline: "Weekend brunch boxes" },
    { competitor: "little-fern", library: "tiktok", startDate: daysAgo(25), endDate: daysAgo(18), format: "video", headline: "Try our matcha flight" },
  ];
}

/** Sample trends across social platforms, search, and the cafe industry. */
export const SAMPLE_TRENDS: readonly Trend[] = [
  { label: "Pumpkin spice drinks", kind: "topic", source: "social", growth: 1.8, relevant: true },
  { label: "#fallvibes", kind: "hashtag", source: "social", growth: 1.2, relevant: true },
  { label: "Matcha desserts", kind: "topic", source: "search", growth: 0.9, relevant: true },
  { label: "#shoplocal", kind: "hashtag", source: "social", growth: 0.6, relevant: true },
  { label: "Oat milk lattes", kind: "topic", source: "search", growth: 0.45, relevant: true },
  { label: "Cafes for remote work", kind: "topic", source: "industry", growth: 0.35, relevant: true },
  { label: "#booktok", kind: "hashtag", source: "social", growth: 2.1, relevant: false },
  { label: "Electric scooters", kind: "topic", source: "search", growth: 0.7, relevant: false },
];
