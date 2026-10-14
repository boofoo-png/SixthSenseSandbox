import { describe, expect, it } from "vitest";
import {
  competitorActivity,
  competitorDetail,
  competitorHighlights,
  isAdActive,
  platformActivity,
  weeklyEngagement,
} from "./activity";
import type { Competitor, CompetitorAd, CompetitorPost } from "./types";

const competitors: Competitor[] = [
  { slug: "alpha", name: "Alpha Cafe", handle: "@alpha" },
  { slug: "beta", name: "Beta Bakery", handle: "@beta" },
];

function post(
  competitor: string,
  date: string,
  engagements: number,
  extra: Partial<CompetitorPost> = {},
): CompetitorPost {
  return {
    competitor,
    platform: "instagram",
    date,
    caption: `${competitor} on ${date}`,
    hashtags: [],
    impressions: 1000,
    engagements,
    ...extra,
  };
}

function ad(competitor: string, startDate: string, endDate: string | null): CompetitorAd {
  return { competitor, library: "meta", startDate, endDate, format: "image", headline: `${competitor} ad` };
}

// Calendar weeks: last week Sun 2026-10-04..Sat 10, this week Sun 2026-10-11..Sat 17.
const posts: CompetitorPost[] = [
  post("alpha", "2026-10-05", 40),
  post("alpha", "2026-10-12", 50),
  post("alpha", "2026-10-13", 70),
  post("alpha", "2026-10-14", 30),
  post("beta", "2026-10-06", 100),
  post("beta", "2026-10-17", 80),
];

const ads: CompetitorAd[] = [
  ad("alpha", "2026-10-01", null),
  ad("alpha", "2026-09-01", "2026-09-30"),
  ad("beta", "2026-10-10", "2026-10-20"),
  ad("beta", "2026-10-20", null),
];

describe("isAdActive", () => {
  it("is active from its start date until its end date, inclusive", () => {
    expect(isAdActive(ad("x", "2026-10-01", "2026-10-05"), "2026-10-01")).toBe(true);
    expect(isAdActive(ad("x", "2026-10-01", "2026-10-05"), "2026-10-05")).toBe(true);
    expect(isAdActive(ad("x", "2026-10-01", "2026-10-05"), "2026-10-06")).toBe(false);
    expect(isAdActive(ad("x", "2026-10-02", null), "2026-10-01")).toBe(false);
    expect(isAdActive(ad("x", "2026-10-02", null), "2026-12-01")).toBe(true);
  });
});

describe("competitorActivity", () => {
  const activity = competitorActivity(competitors, posts, ads);

  it("returns one row per competitor in the given order", () => {
    expect(activity.map((a) => a.competitor.slug)).toEqual(["alpha", "beta"]);
  });

  it("counts posts this week and computes this week's engagement rate", () => {
    expect(activity[0].postsThisWeek).toBe(3);
    expect(activity[0].engagementRate).toBeCloseTo(0.05);
    expect(activity[1].postsThisWeek).toBe(1);
    expect(activity[1].engagementRate).toBeCloseTo(0.08);
  });

  it("compares engagement rate with last week", () => {
    expect(activity[0].engagementRateChange).toBeCloseTo(0.25);
    expect(activity[1].engagementRateChange).toBeCloseTo(-0.2);
  });

  it("counts ads active on the latest date in the data", () => {
    expect(activity[0].activeAds).toBe(1);
    expect(activity[1].activeAds).toBe(1);
  });

  it("uses the same weeks for every competitor", () => {
    // Gamma's posts are old: it has no posts this week, even though it has two weeks of its own data.
    const withStale = competitorActivity(
      [...competitors, { slug: "gamma", name: "Gamma", handle: "@gamma" }],
      [...posts, post("gamma", "2026-09-20", 10), post("gamma", "2026-09-27", 90)],
      ads,
    );
    expect(withStale[2].postsThisWeek).toBe(0);
    expect(withStale[2].engagementRate).toBe(0);
  });

  it("ignores posts with malformed dates", () => {
    const result = competitorActivity(competitors, [...posts, post("alpha", "2026-10-9", 999)], ads);
    expect(result[0].postsThisWeek).toBe(3);
  });

  it("handles no posts at all", () => {
    const result = competitorActivity(competitors, [], []);
    expect(result[0].postsThisWeek).toBe(0);
    expect(result[0].engagementRateChange).toBe(0);
  });
});

describe("competitorDetail", () => {
  const many: CompetitorPost[] = [10, 20, 30, 40, 50, 60, 70].map((e, i) =>
    post("alpha", `2026-10-${String(11 + i).padStart(2, "0")}`, e, {
      hashtags: i % 2 === 0 ? ["#coffee", "#latte"] : ["#coffee"],
    }),
  );

  it("returns the top 3 and bottom 3 posts this week by engagement rate", () => {
    const detail = competitorDetail("alpha", many, ads);
    expect(detail.topPosts.map((p) => p.engagements)).toEqual([70, 60, 50]);
    expect(detail.bottomPosts.map((p) => p.engagements)).toEqual([10, 20, 30]);
  });

  it("never repeats a post in both lists", () => {
    const detail = competitorDetail("alpha", many.slice(0, 4), ads);
    expect(detail.topPosts.map((p) => p.engagements)).toEqual([40, 30, 20]);
    expect(detail.bottomPosts.map((p) => p.engagements)).toEqual([10]);
  });

  it("ranks hashtags by how often they are used, then alphabetically", () => {
    const detail = competitorDetail("alpha", many, ads);
    expect(detail.topHashtags).toEqual([
      { tag: "#coffee", count: 7 },
      { tag: "#latte", count: 4 },
    ]);
  });

  it("lists only this competitor's ads active on the latest date", () => {
    const detail = competitorDetail("alpha", many, ads);
    expect(detail.activeAds.map((a) => a.headline)).toEqual(["alpha ad"]);
  });

  it("returns empty lists for a competitor with no data", () => {
    const detail = competitorDetail("nobody", many, ads);
    expect(detail.topPosts).toEqual([]);
    expect(detail.bottomPosts).toEqual([]);
    expect(detail.topHashtags).toEqual([]);
    expect(detail.activeAds).toEqual([]);
  });
});

describe("competitorHighlights", () => {
  it("picks the most active, the best engagement, and totals active ads", () => {
    const highlights = competitorHighlights(competitorActivity(competitors, posts, ads));
    expect(highlights.mostActive?.competitor.slug).toBe("alpha");
    expect(highlights.bestEngagement?.competitor.slug).toBe("beta");
    expect(highlights.activeAds).toBe(2);
    expect(highlights.competitorsWithAds).toBe(2);
  });

  it("returns nulls when nobody posted this week", () => {
    const highlights = competitorHighlights(competitorActivity(competitors, [], []));
    expect(highlights.mostActive).toBeNull();
    expect(highlights.bestEngagement).toBeNull();
    expect(highlights.activeAds).toBe(0);
  });
});

describe("weeklyEngagement", () => {
  // Latest date is Sat 2026-10-17, so the last 3 calendar weeks start on Sundays 09-27, 10-04, 10-11.
  const weekly = weeklyEngagement(competitors, posts, 3);

  it("returns Sunday-to-Saturday weeks oldest first, ending with the current week", () => {
    expect(weekly.weeks).toEqual([
      { start: "2026-09-27", end: "2026-10-03" },
      { start: "2026-10-04", end: "2026-10-10" },
      { start: "2026-10-11", end: "2026-10-17" },
    ]);
  });

  it("includes the current week even when it is unfinished", () => {
    // Tue 2026-10-13 is the latest post: the current week is still Oct 11-17.
    const partial = weeklyEngagement(competitors, [post("alpha", "2026-10-05", 40), post("alpha", "2026-10-13", 60)], 2);
    expect(partial.weeks).toEqual([
      { start: "2026-10-04", end: "2026-10-10" },
      { start: "2026-10-11", end: "2026-10-17" },
    ]);
    expect(partial.series[0].rates[1]).toBeCloseTo(0.06);
  });

  it("gives each competitor an engagement rate per week, or null when they did not post", () => {
    expect(weekly.series.map((s) => s.competitor.slug)).toEqual(["alpha", "beta"]);
    const [alpha, beta] = weekly.series;
    expect(alpha.rates[0]).toBeNull();
    expect(alpha.rates[1]).toBeCloseTo(0.04);
    expect(alpha.rates[2]).toBeCloseTo(0.05);
    expect(beta.rates[1]).toBeCloseTo(0.1);
    expect(beta.rates[2]).toBeCloseTo(0.08);
  });

  it("returns no weeks when there is no valid data", () => {
    expect(weeklyEngagement(competitors, [post("alpha", "bad", 1)]).weeks).toEqual([]);
  });
});

describe("platformActivity", () => {
  it("counts posts and engagement rate per platform this week, in platform order", () => {
    const mixed = [
      post("alpha", "2026-10-12", 50, { platform: "tiktok" }),
      post("alpha", "2026-10-13", 90, { platform: "tiktok" }),
      post("alpha", "2026-10-14", 20, { platform: "instagram" }),
      post("alpha", "2026-10-05", 999, { platform: "facebook" }),
      post("beta", "2026-10-17", 80, { platform: "linkedin" }),
    ];
    expect(platformActivity("alpha", mixed)).toEqual([
      { platform: "instagram", posts: 1, engagementRate: 0.02 },
      { platform: "tiktok", posts: 2, engagementRate: 0.07 },
    ]);
  });

  it("returns an empty list when the competitor did not post this week", () => {
    expect(platformActivity("nobody", posts)).toEqual([]);
  });
});
