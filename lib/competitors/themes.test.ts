import { describe, expect, it } from "vitest";
import type { Competitor, CompetitorPost } from "./types";
import { recurringThemes } from "./themes";

const competitors: Competitor[] = [
  { slug: "a", name: "Alpha Supply", handle: "@a" },
  { slug: "b", name: "Bravo Linens", handle: "@b" },
  { slug: "c", name: "Charlie Goods", handle: "@c" },
];

function post(competitor: string, theme: string | undefined, caption: string, date = "2026-10-01", engagements = 10): CompetitorPost {
  return { competitor, platform: "instagram", date, caption, hashtags: [], impressions: 100, engagements, theme };
}

describe("recurringThemes", () => {
  it("finds themes used by two or more competitors, most widespread first", () => {
    const themes = recurringThemes(
      [
        post("a", "Sustainability", "Bamboo towels"),
        post("b", "Sustainability", "Refill stations"),
        post("c", "Sustainability", "Compostable slippers"),
        post("a", "Fast delivery", "Next-day delivery"),
        post("b", "Fast delivery", "Restock alerts"),
        post("b", "Fast delivery", "Restock alerts again"),
        post("c", "Bulk pricing", "Volume pricing"),
      ],
      competitors,
    );
    expect(themes.map((theme) => [theme.theme, theme.competitors, theme.posts])).toEqual([
      ["Sustainability", ["Alpha Supply", "Bravo Linens", "Charlie Goods"], 3],
      ["Fast delivery", ["Alpha Supply", "Bravo Linens"], 3],
    ]);
  });

  it("gives the best-performing post as the example", () => {
    const [theme] = recurringThemes(
      [post("a", "Sustainability", "Quiet post", "2026-10-01", 5), post("b", "Sustainability", "Loud post", "2026-10-02", 50)],
      competitors,
    );
    expect(theme.example).toEqual({ competitor: "Bravo Linens", caption: "Loud post" });
  });

  it("ignores posts without a theme and competitors that are not listed", () => {
    expect(recurringThemes([post("a", undefined, "x"), post("b", undefined, "y"), post("z", "Sustainability", "z"), post("a", "Sustainability", "w")], competitors)).toEqual([]);
  });
});
