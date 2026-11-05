import { describe, expect, it } from "vitest";
import type { TrackableCompetitor } from "./hospitality";
import type { CompetitorAd, CompetitorPost } from "./types";
import {
  attentionShare,
  audienceMatch,
  channelActivity,
  competitorSummary,
  newCampaigns,
  themePatterns,
} from "./watchlist";

const ranges = {
  current: { start: "2026-10-01", end: "2026-10-14" },
  comparison: { start: "2026-09-17", end: "2026-09-30" },
};

const competitor = (slug: string, source: "sign-up" | "sample" = "sample", audiences: TrackableCompetitor["audiences"] = ["Commercial"]): TrackableCompetitor => ({
  slug,
  name: slug.toUpperCase(),
  handle: `@${slug}`,
  website: "",
  source,
  audiences,
});

const post = (slug: string, date: string, engagements: number, extra: Partial<CompetitorPost> = {}): CompetitorPost => ({
  competitor: slug,
  platform: "instagram",
  date,
  caption: `${slug} ${date}`,
  hashtags: [],
  impressions: 1000,
  engagements,
  ...extra,
});

const ad = (slug: string, startDate: string, endDate: string | null = null): CompetitorAd => ({
  competitor: slug,
  library: "meta",
  startDate,
  endDate,
  format: "video",
  headline: `${slug} ad`,
});

describe("audienceMatch", () => {
  it("is highest for competitors added at sign-up", () => {
    const signUp = audienceMatch(competitor("a", "sign-up"), "Commercial");
    expect(signUp).toBeGreaterThanOrEqual(90);
    expect(signUp).toBeLessThanOrEqual(97);
  });

  it("is higher when the competitor sells to the chosen audience", () => {
    const sells = audienceMatch(competitor("b", "sample", ["Commercial"]), "Commercial");
    const doesNot = audienceMatch(competitor("b", "sample", ["Commercial"]), "Residential");
    expect(sells).toBeGreaterThan(doesNot);
    expect(sells).toBeGreaterThanOrEqual(78);
    expect(doesNot).toBeLessThan(78);
  });

  it("is stable for the same competitor", () => {
    expect(audienceMatch(competitor("c"), null)).toBe(audienceMatch(competitor("c"), null));
  });
});

describe("competitorSummary", () => {
  const posts = [
    post("a", "2026-10-02", 50, { hashtags: ["#eco", "#hotel"] }),
    post("a", "2026-10-05", 10, { hashtags: ["#eco"] }),
    post("a", "2026-10-09", 30, { hashtags: ["#eco", "#bulk"] }),
    post("a", "2026-09-20", 20),
    post("b", "2026-10-03", 99),
  ];
  const summary = competitorSummary("a", posts, [ad("a", "2026-10-01"), ad("a", "2026-09-01", "2026-09-10"), ad("b", "2026-10-01")], ranges);

  it("counts posts per week and compares with the previous period", () => {
    expect(summary.postsPerWeek).toBe(1.5); // 3 posts in 14 days
    expect(summary.postsChange).toBe(2); // 3 vs 1 post
  });

  it("gives the engagement rate and its change in points", () => {
    expect(summary.engagementRate).toBeCloseTo(0.03);
    expect(summary.engagementChangePoints).toBeCloseTo(1); // 3% vs 2%
  });

  it("finds the best and worst posts, hashtags, and running ads", () => {
    expect(summary.best?.date).toBe("2026-10-02");
    expect(summary.worst?.date).toBe("2026-10-05");
    expect(summary.hashtags.map((tag) => tag.tag)).toEqual(["#eco", "#bulk", "#hotel"]);
    expect(summary.activeAds).toHaveLength(1);
    expect(summary.adLibraries).toEqual(["Meta"]);
  });

  it("has no worst post when there is only one post", () => {
    const one = competitorSummary("b", posts, [], ranges);
    expect(one.best?.competitor).toBe("b");
    expect(one.worst).toBeNull();
    expect(one.postsChange).toBeNull();
  });
});

describe("attentionShare", () => {
  it("names the competitor with the largest share of engagements", () => {
    const share = attentionShare(
      [competitor("a"), competitor("b")],
      [post("a", "2026-10-02", 30), post("b", "2026-10-03", 90), post("b", "2026-09-20", 500)],
      ranges,
    );
    expect(share).toEqual({ leader: "B", share: 0.75, competitors: 2 });
  });

  it("is null without engagement", () => {
    expect(attentionShare([competitor("a")], [], ranges)).toBeNull();
  });
});

describe("newCampaigns", () => {
  it("counts ads that started in the period", () => {
    expect(newCampaigns([ad("a", "2026-10-03"), ad("a", "2026-09-29"), ad("b", "2026-10-14")], ranges.current)).toBe(2);
  });
});

describe("channelActivity", () => {
  it("lists the competitor's posts and ads, newest first, with how long ago", () => {
    const items = channelActivity(
      "a",
      [post("a", "2026-10-12", 10, { platform: "tiktok" }), post("a", "2026-10-02", 10), post("b", "2026-10-13", 10)],
      [ad("a", "2026-10-04")],
      ranges.current,
    );
    expect(items.map((item) => [item.channel, item.format, item.detail])).toEqual([
      ["TikTok", "Post", "Posted 2 days ago"],
      ["Meta", "Sponsored video", "10 days active"],
      ["Instagram", "Post", "Posted 12 days ago"],
    ]);
  });

  it("says when something was posted today and when an ad ended", () => {
    const items = channelActivity("a", [post("a", "2026-10-14", 1)], [ad("a", "2026-10-01", "2026-10-10")], ranges.current);
    expect(items.map((item) => item.detail)).toEqual(["Posted today", "Ran 9 days, ended Oct 10"]);
  });
});

describe("themePatterns", () => {
  const tracked = [competitor("a"), competitor("b"), competitor("c")];
  const themed = (slug: string, date: string, theme: string, platform: CompetitorPost["platform"] = "instagram") =>
    post(slug, date, 10, { theme, platform });

  it("keeps themes shared by two or more competitors, with growth and channels", () => {
    const patterns = themePatterns(
      [
        themed("a", "2026-10-02", "Sustainability"),
        themed("b", "2026-10-03", "Sustainability", "tiktok"),
        themed("c", "2026-10-04", "Sustainability"),
        themed("a", "2026-09-20", "Sustainability"),
        themed("a", "2026-10-05", "Bulk pricing", "linkedin"),
        themed("b", "2026-10-06", "Bulk pricing"),
        themed("c", "2026-10-07", "New products"),
      ],
      tracked,
      ranges,
    );
    expect(patterns.map((pattern) => [pattern.theme, pattern.posts, pattern.change, pattern.channels])).toEqual([
      ["Sustainability", 3, 2, ["Instagram", "TikTok"]],
      ["Bulk pricing", 2, null, ["Instagram", "LinkedIn"]],
    ]);
    expect(patterns[0].competitors).toEqual(["A", "B", "C"]);
  });
});
