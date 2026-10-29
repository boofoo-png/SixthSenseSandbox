import { shiftDate, type DateRange } from "@/lib/analytics/dates";
import type { Platform } from "@/lib/analytics/types";
import type { AUDIENCES } from "@/lib/hub/onboarding";
import { postsForProfilesBetween, type PostingProfile } from "./sample-data";
import type { AdLibrary, Competitor, CompetitorAd, CompetitorPost } from "./types";

// Sample competitor activity for a hospitality supplier (docs/FUNCTIONALITY.md, Competitors).
// There is no real data source yet, so posts and ads are generated from each competitor's slug:
// the same competitor always gets the same numbers, including competitors added at sign-up.
// Every view must say these are sample figures (docs/DECISIONS.md).

export type Audience = (typeof AUDIENCES)[number];
export type CompetitorSource = "sign-up" | "sample";

export type TrackableCompetitor = Competitor & {
  website: string;
  source: CompetitorSource;
  /** General audiences this competitor sells to (sign-up competitors count for all). */
  audiences: readonly Audience[];
};

/** Campaign themes found in the sample posts. */
export const THEMES = [
  "Sustainability",
  "Fast delivery",
  "Bulk pricing",
  "Seasonal promotions",
  "Customer stories",
  "New products",
] as const;
export type Theme = (typeof THEMES)[number];

type PostIdea = { title: string; summary: string; theme: Theme; hashtags: readonly string[] };

const IDEAS: readonly PostIdea[] = [
  { title: "Our new bamboo towel line", summary: "Softer towels made from fast-growing bamboo, for hotels cutting their footprint.", theme: "Sustainability", hashtags: ["#ecohotel", "#sustainablehospitality"] },
  { title: "Refill stations for guest amenities", summary: "Swapping single-use bottles for refillable dispensers in every room.", theme: "Sustainability", hashtags: ["#zerowaste", "#ecohotel"] },
  { title: "Next-day delivery across the Lower Mainland", summary: "Orders placed by 3pm arrive the next morning, ready for check-in.", theme: "Fast delivery", hashtags: ["#nextdaydelivery", "#hotelsupply"] },
  { title: "Restock alerts so you never run out", summary: "Automatic reminders when linens and amenities run low.", theme: "Fast delivery", hashtags: ["#hotelsupply", "#operations"] },
  { title: "Volume pricing for 50+ rooms", summary: "Lower per-unit prices for properties ordering in bulk.", theme: "Bulk pricing", hashtags: ["#bulkorders", "#hotelsupply"] },
  { title: "Care home starter bundles", summary: "Bedding, towels, and toiletries packaged at a bundle price.", theme: "Bulk pricing", hashtags: ["#seniorliving", "#carehomes"] },
  { title: "Holiday guest kits are here", summary: "Seasonal welcome kits for the busiest weeks of the year.", theme: "Seasonal promotions", hashtags: ["#holidayseason", "#guestexperience"] },
  { title: "Spring refresh: 20% off bedding", summary: "A limited-time discount on duvets, sheets, and pillows.", theme: "Seasonal promotions", hashtags: ["#springrefresh", "#hotelsupply"] },
  { title: "How a boutique hotel cut laundry costs", summary: "A partner hotel shares the savings from switching linen suppliers.", theme: "Customer stories", hashtags: ["#boutiquehotel", "#casestudy"] },
  { title: "Behind the scenes at a senior living partner", summary: "Staff explain what they look for in dependable supplies.", theme: "Customer stories", hashtags: ["#seniorliving", "#casestudy"] },
  { title: "Meet our antimicrobial pillow covers", summary: "New covers designed for high-turnover rooms and care settings.", theme: "New products", hashtags: ["#newproduct", "#hygiene"] },
  { title: "Introducing compostable guest slippers", summary: "Comfortable slippers that break down after use.", theme: "New products", hashtags: ["#newproduct", "#ecohotel"] },
];

/** Fictional hospitality suppliers to compare against (not real companies). */
export const SAMPLE_SUPPLIERS: readonly TrackableCompetitor[] = [
  { slug: "coastline-linen-co", name: "Coastline Linen Co.", handle: "@coastlinelinen", website: "", source: "sample", audiences: ["Commercial", "Institutional"] },
  { slug: "northbay-hospitality-supply", name: "Northbay Hospitality Supply", handle: "@northbaysupply", website: "", source: "sample", audiences: ["Commercial"] },
  { slug: "evergreen-amenities", name: "Evergreen Amenities", handle: "@evergreenamenities", website: "", source: "sample", audiences: ["Commercial", "Residential"] },
  { slug: "granite-facility-goods", name: "Granite Facility Goods", handle: "@granitefacility", website: "", source: "sample", audiences: ["Industrial", "Institutional"] },
  { slug: "harbour-and-home-textiles", name: "Harbour & Home Textiles", handle: "@harbourhome", website: "", source: "sample", audiences: ["Residential", "Commercial"] },
];

const ALL_AUDIENCES: readonly Audience[] = ["Residential", "Commercial", "Industrial", "Institutional"];

/** A small, stable number from text, so a competitor always gets the same sample data. */
function seedOf(text: string): number {
  let hash = 5381;
  for (const char of text) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `competitor-${seedOf(name).toString(36)}`;
}

/** A competitor added at sign-up, ready to track. */
export function competitorFromSignUp({ name, website }: { name: string; website: string }): TrackableCompetitor {
  const slug = slugify(name);
  return { slug, name, handle: `@${slug.replace(/-/g, "")}`, website, source: "sign-up", audiences: ALL_AUDIENCES };
}

const PLATFORM_SETS: readonly (readonly Platform[])[] = [
  ["instagram", "linkedin"],
  ["instagram", "facebook"],
  ["linkedin", "facebook", "instagram"],
  ["instagram", "tiktok"],
];

function profileFor(competitor: TrackableCompetitor): PostingProfile {
  const seed = seedOf(competitor.slug);
  const start = seed % IDEAS.length;
  const ideas = Array.from({ length: 6 }, (_, i) => IDEAS[(start + i * 5) % IDEAS.length]);
  return {
    competitor: competitor.slug,
    everyNDays: 1 + (seed % 3),
    postsPerDay: 1 + ((seed >>> 3) % 2),
    baseImpressions: 1500 + (seed % 4500),
    baseEngagementRate: 0.015 + ((seed >>> 5) % 60) / 1000,
    rateSwing: 0.05 + ((seed >>> 7) % 30) / 100,
    phase: seed % 60,
    platforms: PLATFORM_SETS[(seed >>> 9) % PLATFORM_SETS.length],
    captions: ideas.map((idea) => idea.title),
    summaries: ideas.map((idea) => idea.summary),
    themes: ideas.map((idea) => idea.theme),
    hashtags: [...new Set(ideas.flatMap((idea) => idea.hashtags))],
    seed: seed % 97,
  };
}

/** Sample posts for every day in a range, for any set of competitors. */
export function hospitalityPostsBetween(competitors: readonly TrackableCompetitor[], range: DateRange): CompetitorPost[] {
  return postsForProfilesBetween(competitors.map(profileFor), range);
}

const LIBRARIES: readonly AdLibrary[] = ["meta", "google", "tiktok"];
const FORMATS: readonly CompetitorAd["format"][] = ["image", "search", "video", "carousel"];

/** Sample ads from the Meta, Google, and TikTok ad libraries, relative to `endDate`. */
export function hospitalityAds(competitors: readonly TrackableCompetitor[], endDate: string): CompetitorAd[] {
  return competitors.flatMap((competitor) => {
    const seed = seedOf(competitor.slug);
    return Array.from({ length: 1 + (seed % 3) }, (_, i) => {
      const start = 5 + ((seed >>> (i + 2)) % 25);
      const running = (seed + i) % 3 !== 0;
      return {
        competitor: competitor.slug,
        library: LIBRARIES[(seed + i) % LIBRARIES.length],
        startDate: shiftDate(endDate, -start),
        endDate: running ? null : shiftDate(endDate, -Math.max(1, start - 4)),
        format: FORMATS[(seed + i) % FORMATS.length],
        headline: IDEAS[(seed + i * 3) % IDEAS.length].title,
      };
    });
  });
}
