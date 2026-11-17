import { describe, expect, it } from "vitest";
import {
  COMPETITOR_CAMPAIGNS,
  FINDINGS,
  engagementGap,
  firstTarget,
  matchesFinding,
  nextMoves,
  type CompetitorCampaign,
} from "./competitor-performance";

const [launch, seasonal, spotlight] = COMPETITOR_CAMPAIGNS;

describe("competitor performance data", () => {
  it("has the Make's findings, in order", () => {
    expect(FINDINGS).toEqual([
      "All findings",
      "Most viewed post",
      "Most liked post",
      "Most popular item",
      "Most popular trends",
      "Common reused layouts",
      "Most used by users",
    ]);
  });

  it("uses the app's fictional sample suppliers for the Make's three campaigns", () => {
    expect(COMPETITOR_CAMPAIGNS.map((campaign) => [campaign.brand, campaign.title])).toEqual([
      ["Coastline Linen Co.", "Product launch announcement"],
      ["Northbay Hospitality Supply", "Seasonal offer campaign"],
      ["Evergreen Amenities", "Community spotlight"],
    ]);
  });
});

describe("matchesFinding", () => {
  it("matches every campaign for All findings, otherwise by tag", () => {
    expect(COMPETITOR_CAMPAIGNS.every((campaign) => matchesFinding(campaign, "All findings"))).toBe(true);
    expect(COMPETITOR_CAMPAIGNS.filter((campaign) => matchesFinding(campaign, "Most liked post"))).toEqual([launch]);
    expect(COMPETITOR_CAMPAIGNS.filter((campaign) => matchesFinding(campaign, "Common reused layouts"))).toEqual([seasonal]);
  });
});

describe("engagementGap", () => {
  it("is the competitor's lead in points, to one decimal", () => {
    expect(engagementGap(launch)).toBe(1.8);
    expect(engagementGap(seasonal)).toBe(2.1);
    expect(engagementGap(spotlight)).toBe(1.6);
  });
});

describe("firstTarget", () => {
  it("closes a third of the gap first", () => {
    expect(firstTarget(launch)).toBe(2.4);
    expect(firstTarget(seasonal)).toBe(2.8);
  });

  it("aims a little higher when the business already leads", () => {
    const ahead: CompetitorCampaign = { ...launch, business: { ...launch.business, engagement: 4 } };
    expect(engagementGap(ahead)).toBe(-0.4);
    expect(firstTarget(ahead)).toBe(4.2);
  });
});

describe("nextMoves", () => {
  it("turns the Make's benchmark into three steps with this campaign's numbers", () => {
    expect(nextMoves(launch)).toEqual([
      {
        title: "Spot the opportunity",
        detail: "Your 1.8% engagement trails Coastline Linen Co. at 3.6%. Test a stronger product demo next week.",
      },
      {
        title: "Post Tuesday, repeat Friday",
        detail: "Film a 20–30s demo: customer problem → product solution → question. Try a different use case on Friday.",
      },
      {
        title: "Review each Reel after 7 days",
        detail: "Beat your 1.8% baseline. Aim first for 2.4%; the competitor benchmark is 3.6%.",
      },
    ]);
  });

  it("follows the selected campaign", () => {
    const [spot, , review] = nextMoves(spotlight);
    expect(spot.detail).toBe("Your 2.4% engagement trails Evergreen Amenities at 4%. Test a stronger community story next week.");
    expect(review).toEqual({
      title: "Review each story after 7 days",
      detail: "Beat your 2.4% baseline. Aim first for 2.9%; the competitor benchmark is 4%.",
    });
  });

  it("says when the business already leads", () => {
    const ahead: CompetitorCampaign = { ...launch, business: { ...launch.business, engagement: 4 } };
    expect(nextMoves(ahead)[0].detail).toBe("Your 4% engagement leads Coastline Linen Co. at 3.6%. Keep testing a product demo to hold the lead.");
  });
});
