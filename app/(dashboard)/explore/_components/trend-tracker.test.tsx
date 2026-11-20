import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AUDIENCE_TRENDS_KEY } from "@/lib/hub/audience-trends";
import { TrendTracker } from "./trend-tracker";
import { resetTrackerForTests } from "./use-tracker-state";

beforeEach(() => {
  window.localStorage.clear();
  resetTrackerForTests();
});
afterEach(cleanup);

const region = (name: string | RegExp) => screen.getByRole("region", { name });
const trendList = () => region(/^Ranked signals for/);
const trendRows = () => within(trendList()).queryAllByRole("button", { name: /^Investigate / });
const savedAudiences = () => screen.getByRole("group", { name: "Saved to your profile" });
const stored = () => JSON.parse(window.localStorage.getItem(AUDIENCE_TRENDS_KEY) ?? "null");

describe("Audience Trends tracker (Figma Make)", () => {
  it("starts with the sample audiences selected and every trend ranked", () => {
    render(<TrendTracker />);
    expect(screen.getByText("Live audience trend tracker")).toBeDefined();
    expect(within(savedAudiences()).getByRole("checkbox", { name: "Hospitality buyers (niche)" })).toHaveProperty("checked", true);
    expect(within(savedAudiences()).getByRole("checkbox", { name: "Conscious travellers (broad)" })).toHaveProperty("checked", true);
    expect(trendList().querySelector("h2")?.textContent).toBe("Ranked signals for Hospitality buyers, Conscious travellers");
    expect(within(trendList()).getByText("7 matching trends")).toBeDefined();
  });

  it("narrows the trends when an audience is unselected, and remembers it", () => {
    render(<TrendTracker />);
    fireEvent.click(within(savedAudiences()).getByRole("checkbox", { name: "Conscious travellers (broad)" }));
    expect(within(trendList()).getByText("4 matching trends")).toBeDefined();
    expect(trendList().querySelector("h2")?.textContent).toBe("Ranked signals for Hospitality buyers");
    expect(stored().selected).toEqual(["starter-hospitality-buyers"]);
  });

  it("filters by source, with no audience depth bar and no LinkedIn", () => {
    render(<TrendTracker />);
    expect(screen.queryByRole("group", { name: "Audience depth" })).toBeNull();
    const source = screen.getByRole("group", { name: "Source" });
    expect(within(source).getAllByRole("button").map((button) => button.textContent)).toEqual(["All platforms", "Instagram", "TikTok"]);
    fireEvent.click(within(source).getByRole("button", { name: "TikTok" }));
    expect(trendRows().map((row) => row.getAttribute("aria-label"))).toEqual([
      "Investigate Small luxury moments",
      "Investigate Low-waste room resets",
      "Investigate Budget travel swaps",
    ]);
  });

  it("suggests audiences while searching and adds one to the profile", () => {
    render(<TrendTracker />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search audiences" }), { target: { value: "lei" } });
    const suggestions = screen.getByRole("list", { name: "Suggested audiences" });
    fireEvent.click(within(suggestions).getByRole("button", { name: "Add Leisure travellers to profile" }));
    expect(within(savedAudiences()).getByRole("checkbox", { name: "Leisure travellers (broad)" })).toHaveProperty("checked", true);
    expect(stored().audiences.map((audience: { name: string }) => audience.name)).toContain("Leisure travellers");
  });

  it("adds a custom audience, refusing a duplicate", () => {
    render(<TrendTracker />);
    fireEvent.click(screen.getByRole("button", { name: "Add custom audience" }));
    const form = screen.getByRole("form", { name: "Add custom audience" });
    fireEvent.change(within(form).getByRole("textbox", { name: "Audience name" }), { target: { value: "hospitality buyers" } });
    fireEvent.click(within(form).getByRole("button", { name: "Save to profile" }));
    expect(screen.getByRole("alert").textContent).toBe("Hospitality buyers is already saved to your profile.");

    fireEvent.change(within(form).getByRole("textbox", { name: "Audience name" }), { target: { value: "Eco restaurant owners" } });
    fireEvent.change(within(form).getByRole("combobox", { name: "Audience type" }), { target: { value: "broad" } });
    fireEvent.click(within(form).getByRole("button", { name: "Save to profile" }));
    expect(screen.queryByRole("form", { name: "Add custom audience" })).toBeNull();
    expect(within(savedAudiences()).getByRole("checkbox", { name: "Eco restaurant owners (broad)" })).toHaveProperty("checked", true);
  });

  it("removes audiences and explains the empty profile", () => {
    render(<TrendTracker />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Hospitality buyers from profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Conscious travellers from profile" }));
    expect(screen.getByText(/Search above or add your first custom audience/)).toBeDefined();
    expect(trendList().querySelector("h2")?.textContent).toBe("Ranked signals for all audiences");
    expect(stored().audiences).toEqual([]);
  });

  it("turns the chosen trend into campaign direction", () => {
    render(<TrendTracker />);
    const direction = region("Proof over promises × Hospitality buyers");
    expect(within(direction).getByRole("link", { name: "Use in Campaigns" }).getAttribute("href")).toBe("/campaigns");
    fireEvent.click(within(trendList()).getByRole("button", { name: "Investigate Budget travel swaps" }));
    const next = region("Budget travel swaps × Conscious travellers");
    expect(within(next).getByText("Skip")).toBeDefined();
    expect(within(next).getByText(/weak relevance to the current premium hospitality offer/)).toBeDefined();
  });

  it("selects a trend from the radar", () => {
    render(<TrendTracker />);
    fireEvent.click(screen.getByRole("button", { name: "Silent room unboxing: 43 momentum, 62 fit" }));
    expect(region("Silent room unboxing × Boutique hotel guests")).toBeDefined();
  });

  it("stars trends into the watchlist", () => {
    render(<TrendTracker />);
    const watchlist = region("Saved signals");
    expect(within(watchlist).getAllByRole("button").map((button) => button.textContent)).toEqual(["Direct booking value"]);
    fireEvent.click(within(trendList()).getByRole("button", { name: "Watch Proof over promises" }));
    expect(within(watchlist).getByText("2")).toBeDefined();
    fireEvent.click(within(trendList()).getByRole("button", { name: "Watch Direct booking value" }));
    expect(within(watchlist).getAllByRole("button").map((button) => button.textContent)).toEqual(["Proof over promises"]);
    expect(stored().watchlist).toEqual(["Proof over promises"]);
  });
});
