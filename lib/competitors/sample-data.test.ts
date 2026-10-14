import { describe, expect, it } from "vitest";
import { engagementRate } from "@/lib/analytics/kpis";
import { isIsoDate } from "@/lib/analytics/dates";
import {
  SAMPLE_COMPETITORS,
  SAMPLE_TRENDS,
  createSampleAds,
  createSamplePosts,
  samplePostsBetween,
} from "./sample-data";

const posts = createSamplePosts();
const ads = createSampleAds();

function postsFor(slug: string) {
  return posts.filter((post) => post.competitor === slug);
}

function rateFor(slug: string) {
  const own = postsFor(slug);
  return engagementRate(
    own.reduce((sum, p) => sum + p.engagements, 0),
    own.reduce((sum, p) => sum + p.impressions, 0),
  );
}

describe("SAMPLE_COMPETITORS", () => {
  it("has four fictional cafes with unique, URL-safe slugs", () => {
    expect(SAMPLE_COMPETITORS).toHaveLength(4);
    const slugs = SAMPLE_COMPETITORS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(4);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe("createSamplePosts", () => {
  it("is deterministic", () => {
    expect(createSamplePosts()).toEqual(posts);
  });

  it("only has posts from known competitors, within 30 days ending 2026-10-09", () => {
    const slugs = new Set(SAMPLE_COMPETITORS.map((c) => c.slug));
    for (const post of posts) {
      expect(slugs.has(post.competitor)).toBe(true);
      expect(isIsoDate(post.date)).toBe(true);
      expect(post.date >= "2026-09-10" && post.date <= "2026-10-09").toBe(true);
    }
  });

  it("gives every competitor posts in the latest week", () => {
    for (const { slug } of SAMPLE_COMPETITORS) {
      expect(postsFor(slug).some((post) => post.date >= "2026-10-04")).toBe(true);
    }
  });

  it("has sensible values and plain ASCII text", () => {
    for (const post of posts) {
      expect(post.impressions).toBeGreaterThan(0);
      expect(post.engagements).toBeGreaterThanOrEqual(0);
      expect(post.engagements).toBeLessThanOrEqual(post.impressions);
      expect(post.caption).toMatch(/^[\x20-\x7E]+$/);
      for (const tag of post.hashtags) {
        expect(tag).toMatch(/^#[A-Za-z0-9]+$/);
      }
    }
  });

  it("tells distinct stories: frequent low-engagement vs rare high-engagement posting", () => {
    expect(postsFor("brightside-bakery").length).toBeGreaterThan(postsFor("northwind-coffee").length * 2);
    expect(rateFor("northwind-coffee")).toBeGreaterThan(rateFor("brightside-bakery") * 2);
  });
});

describe("createSampleAds", () => {
  it("is deterministic and uses valid dates", () => {
    expect(createSampleAds()).toEqual(ads);
    for (const ad of ads) {
      expect(isIsoDate(ad.startDate)).toBe(true);
      if (ad.endDate !== null) {
        expect(isIsoDate(ad.endDate)).toBe(true);
        expect(ad.endDate >= ad.startDate).toBe(true);
      }
    }
  });

  it("has one competitor running several ads", () => {
    const running = ads.filter((ad) => ad.competitor === "ember-and-oak" && ad.endDate === null);
    expect(running.length).toBeGreaterThanOrEqual(2);
  });
});

describe("SAMPLE_TRENDS", () => {
  it("has a mix of relevant and irrelevant topics and hashtags", () => {
    expect(SAMPLE_TRENDS.some((t) => t.relevant)).toBe(true);
    expect(SAMPLE_TRENDS.some((t) => !t.relevant)).toBe(true);
    expect(SAMPLE_TRENDS.some((t) => t.kind === "hashtag")).toBe(true);
    expect(SAMPLE_TRENDS.some((t) => t.kind === "topic")).toBe(true);
  });
});

describe("samplePostsBetween", () => {
  it("covers any past date range", () => {
    const lastYear = samplePostsBetween({ start: "2025-10-01", end: "2025-10-31" });
    for (const { slug } of SAMPLE_COMPETITORS) {
      expect(lastYear.some((post) => post.competitor === slug)).toBe(true);
    }
    for (const post of lastYear) {
      expect(post.date >= "2025-10-01" && post.date <= "2025-10-31").toBe(true);
    }
  });

  it("gives the same posts for a date no matter which range it is part of", () => {
    const short = samplePostsBetween({ start: "2026-10-05", end: "2026-10-06" });
    const long = samplePostsBetween({ start: "2026-09-01", end: "2026-10-09" });
    expect(short.length).toBeGreaterThan(0);
    for (const post of short) {
      expect(long).toContainEqual(post);
    }
  });
});
