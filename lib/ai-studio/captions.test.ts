import { describe, expect, it } from "vitest";
import { CAPTION_LIMITS, suggestCaptions } from "./captions";
import type { ContentIdea } from "./types";

const idea: ContentIdea = {
  id: "pumpkin-spice-drinks-taste-test",
  title: "Pumpkin spice drinks taste test",
  angle: "Invite regulars to rate them on camera.",
  trend: "Pumpkin spice drinks",
  topic: "pumpkin spice drinks",
  format: "reel",
  platforms: ["tiktok", "instagram"],
  brief: {
    shots: ["Close-up of pumpkin spice drinks being made", "The finished drink on the counter"],
    length: "15-30 seconds",
    tips: ["Film vertically in natural light", "Keep each shot 2-4 seconds"],
  },
};

describe("suggestCaptions", () => {
  it("returns three different captions in the chosen tone", () => {
    const captions = suggestCaptions(idea, "friendly");
    expect(captions).toHaveLength(3);
    expect(new Set(captions).size).toBe(3);
  });

  it("gives each tone its own wording", () => {
    const friendly = suggestCaptions(idea, "friendly");
    const playful = suggestCaptions(idea, "playful");
    const professional = suggestCaptions(idea, "professional");
    expect(friendly).not.toEqual(playful);
    expect(playful).not.toEqual(professional);
  });

  it("mentions the topic and the cafe, in plain ASCII", () => {
    for (const caption of suggestCaptions(idea, "playful", "linkedin", "Sunrise Cafe")) {
      expect(caption.toLowerCase()).toContain("pumpkin spice drinks");
      expect(caption).toContain("Sunrise Cafe");
      expect(caption).toMatch(/^[\x20-\x7E]+$/);
    }
  });

  it("uses 'our cafe' when no name is given", () => {
    expect(suggestCaptions(idea, "friendly").some((caption) => caption.includes("our cafe"))).toBe(true);
  });

  it("stays within each platform's caption length limit", () => {
    const longIdea = { ...idea, topic: "x".repeat(3000) };
    for (const platform of ["instagram", "facebook", "tiktok", "linkedin"] as const) {
      for (const caption of suggestCaptions(longIdea, "professional", platform)) {
        expect(caption.length).toBeLessThanOrEqual(CAPTION_LIMITS[platform]);
      }
    }
  });

  it("is the same every time for the same inputs", () => {
    expect(suggestCaptions(idea, "friendly")).toEqual(suggestCaptions(idea, "friendly"));
  });
});
