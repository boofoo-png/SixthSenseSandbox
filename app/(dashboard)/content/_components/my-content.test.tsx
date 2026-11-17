import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SAVED_CONTENT_KEY } from "@/lib/hub/content/saved";
import { MyContent } from "./my-content";
import { resetSavedContentForTests } from "./use-saved-content";

beforeEach(() => {
  window.localStorage.clear();
  resetSavedContentForTests();
});
afterEach(cleanup);

const cards = () => screen.queryAllByRole("article").map((card) => within(card).getByRole("heading").textContent);
const filters = () => screen.getByRole("group", { name: "Content type" });
const status = () => screen.getByRole("status").textContent;

describe("My Content library (Figma Make)", () => {
  it("lists the sample library with counts, a search, and an upload link", () => {
    render(<MyContent back="/content" />);
    expect(screen.getByRole("heading", { level: 1, name: "My Content" })).toBeDefined();
    expect(cards()).toHaveLength(12);
    expect(within(filters()).getByRole("button", { name: "All content (12)" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(filters()).getByRole("button", { name: "Image (3)" })).toBeDefined();
    expect(status()).toBe("12 items");
    expect(screen.getByRole("link", { name: "Upload content" }).getAttribute("href")).toBe("/content/upload");
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/content");
  });

  it("shows content saved in this browser first, ready to reuse", () => {
    window.localStorage.setItem(
      SAVED_CONTENT_KEY,
      JSON.stringify({ version: 2, items: [{ id: "abc", tool: "social-post", title: "Small change, memorable stay.", text: "Small change, memorable stay.", savedAt: 5 }] }),
    );
    render(<MyContent back="/content" />);
    expect(cards()[0]).toBe("Small change, memorable stay.");
    expect(screen.getByRole("link", { name: "Reuse Small change, memorable stay." }).getAttribute("href")).toBe("/content/repurpose?from=saved-abc");
    expect(within(filters()).getByRole("button", { name: "All content (13)" })).toBeDefined();
  });

  it("filters by type and searches", () => {
    render(<MyContent back="/content" />);
    fireEvent.click(within(filters()).getByRole("button", { name: "Blog post (2)" }));
    expect(cards()).toEqual(["Sustainable city breaks", "Slow travel, small footprint"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search your content" }), { target: { value: "slow" } });
    expect(cards()).toEqual(["Slow travel, small footprint"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search your content" }), { target: { value: "nothing like this" } });
    expect(screen.getByText("No content found")).toBeDefined();
  });

  it("opens the Campaigns folder, then a campaign, and Back steps out again", () => {
    render(<MyContent back="/content/blog" />);
    fireEvent.click(screen.getByRole("button", { name: "Open Campaigns" }));
    expect(screen.getByText("Select Black Friday or BOGO to view its classified content.")).toBeDefined();
    expect(status()).toBe("2 campaigns");
    fireEvent.click(screen.getByRole("button", { name: /^BOGO/ }));
    expect(cards()).toEqual(["Make your next getaway greener.", "Weekend in Vancouver.mp4", "Travel lighter."]);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(status()).toBe("2 campaigns");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(status()).toBe("12 items");
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/content/blog");
  });

  it("sorts A to Z and switches to a list", () => {
    render(<MyContent back="/content" />);
    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));
    expect(cards()[0]).toBe("Coastal trail, Vancouver.jpg");
    expect(cards()[1]).toBe("Eco-lodge in the forest.jpg");
    expect(screen.getByRole("button", { name: "A to Z" })).toBeDefined();
    const view = screen.getByRole("group", { name: "Content view" });
    fireEvent.click(within(view).getByRole("button", { name: "List" }));
    expect(within(view).getByRole("button", { name: "List" }).getAttribute("aria-pressed")).toBe("true");
  });
});
