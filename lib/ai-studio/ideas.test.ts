import { describe, expect, it } from "vitest";
import type { DailyMetrics, Platform } from "@/lib/analytics/types";
import type { Trend } from "@/lib/competitors/types";
import { FORMAT_PLATFORMS, generateIdeas, rankPlatforms, topicFromTrend } from "./ideas";

const trends: Trend[] = [
  { label: "Pumpkin spice drinks", kind: "topic", source: "social", growth: 1.8, relevant: true },
  { label: "#shoplocal", kind: "hashtag", source: "social", growth: 0.6, relevant: true },
  { label: "#booktok", kind: "hashtag", source: "social", growth: 2.1, relevant: false },
  { label: "Matcha desserts", kind: "topic", source: "search", growth: 0.9, relevant: true },
];

const best: Platform[] = ["tiktok", "instagram", "facebook", "linkedin"];

describe("topicFromTrend", () => {
  it("uses topics as plain lowercase words", () => {
    expect(topicFromTrend(trends[0])).toBe("pumpkin spice drinks");
  });

  it("turns known hashtags into words", () => {
    expect(topicFromTrend(trends[1])).toBe("shop local");
    expect(topicFromTrend({ ...trends[1], label: "#fallvibes" })).toBe("fall vibes");
  });

  it("falls back to the hashtag text without the #", () => {
    expect(topicFromTrend({ ...trends[1], label: "#latteseason" })).toBe("latteseason");
  });
});

describe("rankPlatforms", () => {
  function row(platform: Platform, engagements: number): DailyMetrics {
    return { platform, date: "2026-10-05", impressions: 1000, engagements, clicks: 0, followers: 1 };
  }

  it("orders platforms by engagement rate, best first", () => {
    expect(rankPlatforms([row("facebook", 20), row("tiktok", 70), row("instagram", 50)])).toEqual([
      "tiktok",
      "instagram",
      "facebook",
    ]);
  });
});

describe("generateIdeas", () => {
  it("returns the requested number of ideas, built only on relevant trends", () => {
    const ideas = generateIdeas({ trends, bestPlatforms: best, count: 3 });
    expect(ideas).toHaveLength(3);
    for (const idea of ideas) {
      expect(idea.trend).not.toBe("#booktok");
    }
  });

  it("starts with the fastest-growing relevant trend", () => {
    expect(generateIdeas({ trends, bestPlatforms: best })[0].trend).toBe("Pumpkin spice drinks");
  });

  it("is the same every time for the same inputs", () => {
    expect(generateIdeas({ trends, bestPlatforms: best })).toEqual(generateIdeas({ trends, bestPlatforms: best }));
  });

  it("shows different ideas on the next page", () => {
    const first = generateIdeas({ trends, bestPlatforms: best, page: 0 }).map((idea) => idea.id);
    const second = generateIdeas({ trends, bestPlatforms: best, page: 1 }).map((idea) => idea.id);
    expect(second.some((id) => first.includes(id))).toBe(false);
  });

  it("suggests up to two platforms that suit the format, in the user's best order", () => {
    for (const idea of generateIdeas({ trends, bestPlatforms: best, count: 6 })) {
      expect(idea.platforms.length).toBeGreaterThan(0);
      expect(idea.platforms.length).toBeLessThanOrEqual(2);
      for (const platform of idea.platforms) {
        expect(FORMAT_PLATFORMS[idea.format]).toContain(platform);
      }
      const order = idea.platforms.map((p) => best.indexOf(p));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
    }
  });

  it("writes titles and angles in plain ASCII that mention the topic", () => {
    for (const idea of generateIdeas({ trends, bestPlatforms: best, count: 6 })) {
      expect(idea.title).toMatch(/^[\x20-\x7E]+$/);
      expect(idea.angle).toMatch(/^[\x20-\x7E]+$/);
      expect(`${idea.title} ${idea.angle}`.toLowerCase()).toContain(idea.topic);
    }
  });

  it("gives every idea a content brief to help create the photo or video", () => {
    for (const idea of generateIdeas({ trends, bestPlatforms: best, count: 6 })) {
      const { shots, length, tips } = idea.brief;
      expect(shots.length).toBeGreaterThanOrEqual(2);
      expect(tips.length).toBeGreaterThanOrEqual(2);
      expect(length).not.toBe("");
      expect(shots.some((shot) => shot.toLowerCase().includes(idea.topic))).toBe(true);
      for (const text of [...shots, length, ...tips]) {
        expect(text).toMatch(/^[\x20-\x7E]+$/);
      }
    }
  });

  it("fits the brief to the format", () => {
    const ideas = generateIdeas({ trends, bestPlatforms: best, count: 18 });
    const reel = ideas.find((idea) => idea.format === "reel")!;
    const carousel = ideas.find((idea) => idea.format === "carousel")!;
    expect(reel.brief.length).toMatch(/seconds/);
    expect(carousel.brief.length).toMatch(/slides/);
  });

  it("returns no ideas when no trend is relevant", () => {
    expect(generateIdeas({ trends: [trends[2]], bestPlatforms: best })).toEqual([]);
  });
});
