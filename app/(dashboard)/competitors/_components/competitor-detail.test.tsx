import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { CompetitorDetail as Detail } from "@/lib/competitors/activity";
import type { CompetitorPost } from "@/lib/competitors/types";
import { CompetitorDetail } from "./competitor-detail";

afterEach(cleanup);

const competitor = { slug: "alpha", name: "Alpha Cafe", handle: "@alpha" };

function post(caption: string, engagements: number): CompetitorPost {
  return {
    competitor: "alpha",
    platform: "instagram",
    date: "2026-10-08",
    caption,
    hashtags: [],
    impressions: 1000,
    engagements,
  };
}

const full: Detail = {
  topPosts: [post("Best post", 80), post("Second post", 60)],
  bottomPosts: [post("Worst post", 5)],
  topHashtags: [
    { tag: "#coffee", count: 7 },
    { tag: "#latte", count: 3 },
  ],
  activeAds: [
    {
      competitor: "alpha",
      library: "meta",
      startDate: "2026-10-01",
      endDate: null,
      format: "video",
      headline: "Try our new latte",
    },
  ],
};

const empty: Detail = { topPosts: [], bottomPosts: [], topHashtags: [], activeAds: [] };

function section(name: string) {
  return screen.getByRole("region", { name });
}

describe("CompetitorDetail", () => {
  it("shows the competitor's name and handle", () => {
    render(<CompetitorDetail competitor={competitor} detail={full} />);
    expect(screen.getByRole("heading", { level: 1, name: "Alpha Cafe" })).toBeDefined();
    expect(screen.getByText("@alpha")).toBeDefined();
  });

  it("lists top and lowest performing posts with their engagement rate", () => {
    render(<CompetitorDetail competitor={competitor} detail={full} />);
    const top = section("Top posts this week");
    expect(within(top).getByText("Best post")).toBeDefined();
    expect(within(top).getByText("8.0% engagement")).toBeDefined();
    expect(within(top).getAllByText("Instagram, 2026-10-08")).toHaveLength(2);
    expect(within(section("Lowest performing posts this week")).getByText("Worst post")).toBeDefined();
  });

  it("lists the most used hashtags with counts", () => {
    render(<CompetitorDetail competitor={competitor} detail={full} />);
    const hashtags = section("Most used hashtags");
    expect(within(hashtags).getByText("#coffee")).toBeDefined();
    expect(within(hashtags).getByText("7 posts")).toBeDefined();
  });

  it("lists active ads with their ad library and start date", () => {
    render(<CompetitorDetail competitor={competitor} detail={full} />);
    const ads = section("Active ads");
    expect(within(ads).getByText("Try our new latte")).toBeDefined();
    expect(within(ads).getByText("Meta ad library, video, running since 2026-10-01")).toBeDefined();
  });

  it("shows posts and engagement rate per platform", () => {
    render(
      <CompetitorDetail
        competitor={competitor}
        detail={full}
        platforms={[
          { platform: "instagram", posts: 3, engagementRate: 0.042 },
          { platform: "tiktok", posts: 1, engagementRate: 0.09 },
        ]}
      />,
    );
    const byPlatform = section("By platform this week");
    const rows = within(byPlatform).getAllByRole("listitem").map((item) => item.textContent);
    expect(rows).toEqual(["Instagram3 posts, 4.2% engagement", "TikTok1 post, 9.0% engagement"]);
  });

  it("shows friendly empty states", () => {
    render(<CompetitorDetail competitor={competitor} detail={empty} />);
    expect(within(section("By platform this week")).getByText("No posts this week.")).toBeDefined();
    expect(within(section("Top posts this week")).getByText("No posts this week.")).toBeDefined();
    expect(within(section("Lowest performing posts this week")).getByText("Not enough posts this week to compare.")).toBeDefined();
    expect(within(section("Most used hashtags")).getByText("No hashtags used yet.")).toBeDefined();
    expect(within(section("Active ads")).getByText("No ads running right now.")).toBeDefined();
  });

  it("links back to the comparison and says it is sample data", () => {
    render(<CompetitorDetail competitor={competitor} detail={full} />);
    expect(screen.getByRole("link", { name: "All competitors" }).getAttribute("href")).toBe("/competitors");
    expect(screen.getByText(/Sample data: a fictional business/)).toBeDefined();
  });
});
