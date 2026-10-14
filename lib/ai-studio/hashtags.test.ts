import { describe, expect, it } from "vitest";
import { suggestHashtags, toHashtag } from "./hashtags";
import type { ContentIdea } from "./types";

const idea: ContentIdea = {
  id: "matcha",
  title: "Matcha desserts of the week",
  angle: "Feature one dessert each week.",
  trend: "Matcha desserts",
  topic: "matcha desserts",
  format: "photo",
  platforms: ["instagram"],
  brief: { shots: ["Matcha desserts on a plate", "Close-up detail"], length: "1-2 photos", tips: ["Shoot in daylight", "Keep it tidy"] },
};

describe("toHashtag", () => {
  it("turns words into a single lowercase hashtag", () => {
    expect(toHashtag("Matcha desserts")).toBe("#matchadesserts");
    expect(toHashtag("#ShopLocal")).toBe("#shoplocal");
    expect(toHashtag("Oat-milk lattes!")).toBe("#oatmilklattes");
  });

  it("returns null when nothing usable is left", () => {
    expect(toHashtag("!!!")).toBeNull();
  });
});

describe("suggestHashtags", () => {
  it("suggests 5 to 8 unique, valid hashtags", () => {
    const tags = suggestHashtags(idea, ["#coffee", "#latteart"]);
    expect(tags.length).toBeGreaterThanOrEqual(5);
    expect(tags.length).toBeLessThanOrEqual(8);
    expect(new Set(tags).size).toBe(tags.length);
    for (const tag of tags) {
      expect(tag).toMatch(/^#[a-z0-9]+$/);
    }
  });

  it("starts with the trend's hashtag and includes the user's own top tags", () => {
    const tags = suggestHashtags(idea, ["#coffee", "#LatteArt"]);
    expect(tags[0]).toBe("#matchadesserts");
    expect(tags).toContain("#latteart");
  });

  it("never repeats a tag the user already listed", () => {
    const tags = suggestHashtags(idea, ["#cafe", "#cafe", "#matchadesserts"]);
    expect(tags.filter((tag) => tag === "#cafe")).toHaveLength(1);
    expect(tags.filter((tag) => tag === "#matchadesserts")).toHaveLength(1);
  });
});
