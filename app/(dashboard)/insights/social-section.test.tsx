import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SocialSection } from "./_components/social-section";

afterEach(cleanup);

const section = () => screen.getByRole("region", { name: "Instagram and Facebook" });

const report = {
  username: "sixthsenseapp",
  followers: 120,
  pageFollowers: null,
  reach: 200,
  views: 500,
  engagementRate: 15,
  reachChange: 25,
  topPosts: [
    { id: "b", caption: "Room refresh", permalink: "https://www.instagram.com/p/b/", timestamp: "2026-11-05T10:00:00+0000", type: "IMAGE", likes: 10, comments: 2, thumbnail: null },
  ],
  facebook: {
    views: 90,
    viewers: 60,
    engagements: 12,
    viewersChange: 50,
    topPosts: [{ id: "f2", message: "Launch day", permalink: "https://www.facebook.com/2", createdTime: "2026-11-04T10:00:00+0000", reactions: 5, comments: 2, shares: 1 }],
  },
};

describe("Reports: Instagram and Facebook", () => {
  it("shows live numbers and top posts, marked live", () => {
    render(<SocialSection state={{ status: "live", report }} business="Hotel Depot" period="7 days" />);
    expect(within(section()).getByText("Live from @sixthsenseapp")).toBeDefined();
    expect(within(section()).getByText("Followers").nextElementSibling?.textContent).toBe("120");
    expect(within(section()).getByText("Page followers").nextElementSibling?.textContent).toBe("No data yet");
    expect(within(section()).getByText("+25.0% vs the previous period")).toBeDefined();
    const [post, facebookPost] = within(section()).getAllByRole("listitem");
    expect(post.textContent).toContain("Room refresh");
    expect(post.textContent).toContain("10 likes · 2 comments");
    const open = within(post).getByRole("link", { name: /Open on Instagram/ });
    expect(open.getAttribute("href")).toBe("https://www.instagram.com/p/b/");
    expect(open.getAttribute("rel")).toBe("noopener noreferrer");
    expect(within(section()).getByText("Viewers, last 7 days").nextElementSibling?.textContent).toBe("60");
    expect(within(section()).getByText("+50.0% vs the previous period")).toBeDefined();
    expect(facebookPost.textContent).toContain("5 reactions · 2 comments · 1 shares");
    expect(within(facebookPost).getByRole("link", { name: /Open on Facebook/ }).getAttribute("href")).toBe("https://www.facebook.com/2");
  });

  it("explains when Meta has no Page numbers yet", () => {
    const empty = { ...report.facebook, views: null, viewers: null, engagements: null, viewersChange: null };
    render(<SocialSection state={{ status: "live", report: { ...report, facebook: empty } }} business="Sixth Sense" period="7 days" />);
    expect(within(section()).getAllByText("Views, last 7 days")[1].nextElementSibling?.textContent).toBe("No data yet"); // the Facebook one
    expect(section().textContent).toContain("isn't reporting views or engagement for this Page yet");
  });

  it("still shows Page followers when the Page's views and posts can't be read", () => {
    render(<SocialSection state={{ status: "live", report: { ...report, pageFollowers: 7, facebook: null } }} business="Sixth Sense" period="7 days" />);
    expect(within(section()).getByText("Page followers").nextElementSibling?.textContent).toBe("7");
    expect(section().textContent).toContain("couldn't be read just now");
  });

  it("asks the business to connect when it has not", () => {
    render(<SocialSection state={{ status: "not-connected" }} business="Hospitality Emporium" period="7 days" />);
    expect(section().textContent).toContain("Connect Hospitality Emporium's Instagram");
    expect(within(section()).getByRole("link", { name: "Connect in Settings" }).getAttribute("href")).toBe("/settings?section=workspace");
  });

  it("offers Reconnect when access has expired", () => {
    render(<SocialSection state={{ status: "failed", error: "expired" }} business="Hotel Depot" period="30 days" />);
    expect(within(section()).getByRole("status").textContent).toMatch(/expired/);
    expect(within(section()).getByRole("link", { name: "Reconnect in Settings" })).toBeDefined();
  });
});
