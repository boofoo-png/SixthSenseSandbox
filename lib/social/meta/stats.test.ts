import { describe, expect, it } from "vitest";
import { overviewFor } from "@/lib/hub/overview";
import type { InstagramPost, MetaSnapshot } from "./graph";
import { engagementRate, liveOverview, percentChange, socialReport } from "./stats";

const sample = overviewFor("7d", [], "2026-11-06");
const post = (id: string, likes: number, comments: number): InstagramPost => ({
  id,
  caption: id,
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: "2026-11-05T10:00:00+0000",
  type: "IMAGE",
  likes,
  comments,
  thumbnail: null,
});
const snapshot: MetaSnapshot = {
  username: "sixthsenseapp",
  followers: 120,
  mediaCount: 4,
  pageFollowers: 30,
  reach: 200,
  views: 500,
  accountsEngaged: 20,
  interactions: 30,
  newFollowers: 20,
  previous: { reach: 160, interactions: 16 },
  posts: [post("a", 4, 0), post("b", 10, 2), post("c", 1, 1), post("d", 6, 0)],
  facebook: {
    views: 90,
    viewers: 60,
    engagements: 12,
    previous: { viewers: 40, engagements: 16 },
    posts: [
      { id: "f1", message: "Hello", permalink: "https://www.facebook.com/1", createdTime: "2026-11-05T10:00:00+0000", reactions: 1, comments: 0, shares: 0 },
      { id: "f2", message: "Launch", permalink: "https://www.facebook.com/2", createdTime: "2026-11-04T10:00:00+0000", reactions: 5, comments: 2, shares: 1 },
    ],
  },
};

describe("percentChange / engagementRate", () => {
  it("handles nothing to compare with", () => {
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(5, 0)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
    expect(engagementRate(30, 200)).toBe(15);
    expect(engagementRate(3, 0)).toBeNull();
  });
});

describe("liveOverview", () => {
  it("keeps the sample when there is no live snapshot", () => {
    expect(liveOverview(sample, null)).toEqual({ overview: sample, audience: null, engagementLive: false, instagramLive: false, facebookLive: false });
  });

  it("uses live followers, engagement and Instagram reach, leaving the rest as sample", () => {
    const live = liveOverview(sample, snapshot);
    expect(live.audience).toEqual({ kind: "new", value: 20, change: 20 });
    expect(live.overview.engagement.rate).toBe(15);
    expect(live.overview.engagement.change).toBe(5); // 10% before, 15% now
    expect(live.overview.engagement.bars).toEqual([33, 100, 17, 50]);
    expect(live.overview.channels.find((row) => row.channel === "Instagram")).toMatchObject({ momentum: 25, change: 87.5 });
    expect(live.overview.channels.find((row) => row.channel === "Facebook")).toMatchObject({ momentum: 50, change: -25 });
    expect(live.overview.channels.find((row) => row.channel === "Web")).toEqual(sample.channels.find((row) => row.channel === "Web"));
    expect(live.overview.marketInterest).toEqual(sample.marketInterest);
    expect(live).toMatchObject({ engagementLive: true, instagramLive: true, facebookLive: true });
    expect(sample.channels.find((row) => row.channel === "Instagram")?.momentum).not.toBe(25); // sample unchanged
  });

  it("shows total followers when Meta has no new-follower count (under 100 followers)", () => {
    const live = liveOverview(sample, { ...snapshot, newFollowers: null, reach: null, previous: { reach: null, interactions: null }, facebook: null });
    expect(live.audience).toEqual({ kind: "total", value: 120 });
    expect(live).toMatchObject({ engagementLive: false, instagramLive: false, facebookLive: false });
    expect(live.overview.channels).toEqual(sample.channels);
    expect(live.overview.engagement).toEqual(sample.engagement);
  });
});

describe("socialReport", () => {
  it("lists the three posts with the most likes and comments", () => {
    const report = socialReport(snapshot);
    expect(report.topPosts.map((item) => item.id)).toEqual(["b", "d", "a"]);
    expect(report).toMatchObject({ username: "sixthsenseapp", followers: 120, pageFollowers: 30, reach: 200, views: 500, engagementRate: 15, reachChange: 25 });
    expect(report.facebook).toMatchObject({ views: 90, viewers: 60, engagements: 12, viewersChange: 50 });
    expect(report.facebook?.topPosts.map((item) => item.id)).toEqual(["f2", "f1"]);
    expect(socialReport({ ...snapshot, facebook: null }).facebook).toBeNull();
  });
});
