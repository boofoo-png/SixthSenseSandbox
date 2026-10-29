import { describe, expect, it } from "vitest";
import type { Competitor, CompetitorPost } from "./types";
import { FINDINGS, findPosts, formatPostDate, isFinding } from "./findings";

const competitors: Competitor[] = [
  { slug: "a", name: "Alpha Supply", handle: "@a" },
  { slug: "b", name: "Bravo Linens", handle: "@b" },
];

function post(competitor: string, caption: string, date: string, impressions: number, engagements: number, theme = "Sustainability"): CompetitorPost {
  return { competitor, platform: "instagram", date, caption, hashtags: [], impressions, engagements, theme, summary: `${caption} summary` };
}

const posts = [
  post("a", "Quiet but recent", "2026-10-09", 100, 1),
  post("a", "Most seen", "2026-10-03", 9000, 90),
  post("b", "Most engaged", "2026-10-05", 2000, 400),
  post("b", "Delivery news", "2026-10-07", 500, 10, "Fast delivery"),
  post("z", "Not tracked", "2026-10-09", 99999, 9999),
];

describe("FINDINGS", () => {
  it("are the mid-fi filters that sample data can answer", () => {
    expect(FINDINGS.map((finding) => finding.label)).toEqual(["Most viewed post", "Most liked post", "Most popular trends"]);
    expect(isFinding("most-viewed")).toBe(true);
    expect(isFinding("nonsense")).toBe(false);
  });
});

describe("findPosts", () => {
  it("shows the newest posts from tracked competitors when no filter is chosen", () => {
    const cards = findPosts(posts, competitors, null, 3);
    expect(cards.map((card) => card.post.caption)).toEqual(["Quiet but recent", "Delivery news", "Most engaged"]);
    expect(cards[0].competitorName).toBe("Alpha Supply");
  });

  it("ranks by views or likes", () => {
    expect(findPosts(posts, competitors, "most-viewed", 1)[0].post.caption).toBe("Most seen");
    expect(findPosts(posts, competitors, "most-liked", 1)[0].post.caption).toBe("Most engaged");
  });

  it("shows posts in the theme most competitors share", () => {
    const captions = findPosts(posts, competitors, "popular-trends", 5).map((card) => card.post.caption);
    expect(captions).toEqual(["Most engaged", "Most seen", "Quiet but recent"]);
  });

  it("tags each card with its theme and what it stands out for", () => {
    const card = findPosts(posts, competitors, "most-liked", 1)[0];
    expect(card.tags).toEqual(["Sustainability", "Most liked post", "Most popular trend"]);
  });
});

describe("formatPostDate", () => {
  it("says how long ago, like the mid-fi", () => {
    expect(formatPostDate("2026-10-09", "2026-10-09")).toBe("Oct 9 (today)");
    expect(formatPostDate("2026-10-08", "2026-10-09")).toBe("Oct 8 (1 day ago)");
    expect(formatPostDate("2026-10-04", "2026-10-09")).toBe("Oct 4 (5 days ago)");
    expect(formatPostDate("2026-09-18", "2026-10-09")).toBe("Sep 18 (3 weeks ago)");
  });
});
