import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ComingSoon, comingSoonItem } from "./coming-soon";
import FindingsPage from "../findings/page";
import ExplorePage from "../explore/page";
import AiManagementPage from "../ai-management/page";
import ContentPage from "../content/page";
import CampaignsPage from "../campaigns/page";
import ProfilePage from "../profile/page";
import SettingsPage from "../settings/page";

afterEach(cleanup);

describe("comingSoonItem", () => {
  it("finds an unbuilt page by its address", () => {
    const item = comingSoonItem("/campaigns");
    expect(item.label).toBe("Campaigns");
    expect(item.planned.length).toBeGreaterThan(0);
  });

  it("refuses pages that are already built or do not exist", () => {
    expect(() => comingSoonItem("/competitors")).toThrow();
    expect(() => comingSoonItem("/nowhere")).toThrow();
  });
});

describe("ComingSoon", () => {
  it("shows the page name, what it is for, and what is planned", () => {
    const item = comingSoonItem("/content");
    render(<ComingSoon item={item} />);
    expect(screen.getByRole("heading", { level: 1, name: "Content Creation" })).toBeDefined();
    expect(screen.getByText("Coming soon")).toBeDefined();
    expect(screen.getByText(item.summary)).toBeDefined();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([...item.planned]);
  });

  it("links back to the dashboard", () => {
    render(<ComingSoon item={comingSoonItem("/content")} />);
    expect(screen.getByRole("link", { name: "Back to dashboard" }).getAttribute("href")).toBe("/");
  });
});

describe("placeholder pages", () => {
  const pages = [
    ["Revisit Findings", FindingsPage],
    ["Explore Audience and Trend", ExplorePage],
    ["AI Management", AiManagementPage],
    ["Content Creation", ContentPage],
    ["Campaigns", CampaignsPage],
    ["Profile", ProfilePage],
    ["Settings", SettingsPage],
  ] as const;

  it.each(pages)("%s shows its Coming soon page", (label, Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: label })).toBeDefined();
  });
});
