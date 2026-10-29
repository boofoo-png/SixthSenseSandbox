import { describe, expect, it } from "vitest";
import { engagementRate } from "@/lib/analytics/kpis";
import { isAdActive } from "./activity";
import {
  SAMPLE_SUPPLIERS,
  THEMES,
  competitorFromSignUp,
  hospitalityAds,
  hospitalityPostsBetween,
} from "./hospitality";

const RANGE = { start: "2026-09-10", end: "2026-10-09" };
const signUp = competitorFromSignUp({ name: "Pacific Room Supply", website: "https://pacificroom.example" });
const everyone = [signUp, ...SAMPLE_SUPPLIERS];

describe("SAMPLE_SUPPLIERS", () => {
  it("are five fictional hospitality suppliers with URL-safe slugs and the audiences they serve", () => {
    expect(SAMPLE_SUPPLIERS).toHaveLength(5);
    expect(new Set(SAMPLE_SUPPLIERS.map((c) => c.slug)).size).toBe(5);
    for (const supplier of SAMPLE_SUPPLIERS) {
      expect(supplier.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(supplier.source).toBe("sample");
      expect(supplier.audiences.length).toBeGreaterThan(0);
    }
  });
});

describe("competitorFromSignUp", () => {
  it("turns a competitor added at sign-up into one that can be tracked", () => {
    expect(signUp).toMatchObject({
      name: "Pacific Room Supply",
      website: "https://pacificroom.example",
      source: "sign-up",
      slug: "pacific-room-supply",
      handle: "@pacificroomsupply",
    });
  });

  it("makes a usable slug from any name", () => {
    expect(competitorFromSignUp({ name: "Amazon.ca & Co!", website: "" }).slug).toBe("amazon-ca-co");
    expect(competitorFromSignUp({ name: "!!!", website: "" }).slug).toMatch(/^competitor-[a-z0-9]+$/);
  });
});

describe("hospitalityPostsBetween", () => {
  const posts = hospitalityPostsBetween(everyone, RANGE);

  it("gives every competitor, including ones from sign-up, posts with a campaign theme", () => {
    for (const competitor of everyone) {
      expect(posts.some((post) => post.competitor === competitor.slug)).toBe(true);
    }
    for (const post of posts) {
      expect(THEMES).toContain(post.theme);
      expect(post.caption.length).toBeGreaterThan(0);
      expect(post.summary?.length).toBeGreaterThan(0);
    }
  });

  it("is the same every time, whatever order the competitors come in", () => {
    const mine = (list: typeof everyone) => hospitalityPostsBetween(list, RANGE).filter((p) => p.competitor === signUp.slug);
    expect(mine([...everyone].reverse())).toEqual(mine(everyone));
  });

  it("gives competitors different results", () => {
    const rates = everyone.map((competitor) => {
      const own = posts.filter((post) => post.competitor === competitor.slug);
      return engagementRate(own.reduce((s, p) => s + p.engagements, 0), own.reduce((s, p) => s + p.impressions, 0));
    });
    expect(new Set(rates.map((rate) => rate.toFixed(4))).size).toBeGreaterThan(3);
  });
});

describe("hospitalityAds", () => {
  it("gives some competitors ads, some still running on the last day", () => {
    const ads = hospitalityAds(everyone, RANGE.end);
    expect(ads.length).toBeGreaterThan(0);
    expect(ads.every((ad) => everyone.some((c) => c.slug === ad.competitor))).toBe(true);
    expect(ads.some((ad) => isAdActive(ad, RANGE.end))).toBe(true);
    expect(hospitalityAds(everyone, RANGE.end)).toEqual(ads);
  });
});
