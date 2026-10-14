import { shiftDate } from "@/lib/analytics/dates";
import type { Platform } from "@/lib/analytics/types";
import type { Competitor, CompetitorAd, CompetitorPost, Trend } from "./types";

// Fictional local cafes (see docs/DECISIONS.md: fictional sample competitors).
export const SAMPLE_COMPETITORS: readonly Competitor[] = [
  { slug: "brightside-bakery", name: "Brightside Bakery", handle: "@brightsidebakes" },
  { slug: "northwind-coffee", name: "Northwind Coffee", handle: "@northwindcoffee" },
  { slug: "ember-and-oak", name: "Ember & Oak Cafe", handle: "@emberandoak" },
  { slug: "little-fern", name: "Little Fern Tea House", handle: "@littleferntea" },
];

type PostingProfile = {
  competitor: string;
  /** Posts on days where day % everyNDays === 0. */
  everyNDays: number;
  postsPerDay: number;
  baseImpressions: number;
  baseEngagementRate: number;
  /** Daily change applied to the engagement rate. */
  rateTrendPerDay: number;
  platforms: readonly Platform[];
  captions: readonly string[];
  hashtags: readonly string[];
  seed: number;
};

// Each cafe has a distinct story: Brightside posts a lot but engages poorly,
// Northwind posts rarely but engages well, Ember & Oak leans on ads, and
// Little Fern is improving.
const PROFILES: readonly PostingProfile[] = [
  {
    competitor: "brightside-bakery",
    everyNDays: 1,
    postsPerDay: 2,
    baseImpressions: 2400,
    baseEngagementRate: 0.021,
    rateTrendPerDay: 0,
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
    rateTrendPerDay: 0,
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
    rateTrendPerDay: -0.008,
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
    rateTrendPerDay: 0.02,
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

const DAYS = 30;

/** Repeatable variation between -0.4 and 0.4, so some posts do much better than others. */
function postVariation(day: number, index: number, seed: number): number {
  return (((day * 13 + index * 7 + seed * 5) % 9) - 4) / 10;
}

/** Picks two or three hashtags from a pool in a repeatable way. */
function pickHashtags(pool: readonly string[], n: number): string[] {
  const count = 2 + (n % 2);
  return Array.from({ length: count }, (_, i) => pool[(n + i * 2) % pool.length]);
}

/** Builds 30 days of fictional competitor posts ending on `endDate`. Fully deterministic. */
export function createSamplePosts(endDate = "2026-10-09"): CompetitorPost[] {
  const startDate = shiftDate(endDate, -(DAYS - 1));
  const posts: CompetitorPost[] = [];

  for (const profile of PROFILES) {
    let n = 0;
    for (let day = 0; day < DAYS; day++) {
      // Offset by seed so cafes posting every few days still post in the latest week.
      if ((day + profile.seed) % profile.everyNDays !== 0) {
        continue;
      }
      for (let index = 0; index < profile.postsPerDay; index++) {
        const variation = postVariation(day, index, profile.seed);
        const impressions = Math.round(profile.baseImpressions * (1 + variation / 2));
        const rate =
          profile.baseEngagementRate * (1 + profile.rateTrendPerDay * day) * (1 + variation);
        posts.push({
          competitor: profile.competitor,
          platform: profile.platforms[n % profile.platforms.length],
          date: shiftDate(startDate, day),
          caption: profile.captions[n % profile.captions.length],
          hashtags: pickHashtags(profile.hashtags, n),
          impressions,
          engagements: Math.max(0, Math.round(impressions * rate)),
        });
        n++;
      }
    }
  }

  return posts;
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
