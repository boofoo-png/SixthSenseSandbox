import { describe, expect, it } from "vitest";
import {
  LIBRARY_CAMPAIGNS,
  LIBRARY_SAMPLES,
  filterCounts,
  fromSaved,
  libraryText,
  showLibrary,
  type LibraryItem,
} from "./library";
import type { SavedContent } from "./saved";

const titles = (items: LibraryItem[]) => items.map((item) => item.title);

const saved: SavedContent[] = [
  { id: "s2", tool: "blog", title: "Newer blog", text: "Title\n\n- Point one", savedAt: 20 },
  { id: "s1", tool: "improve-copy", title: "Older copy", text: "Refill. Reuse.", savedAt: 10 },
];

describe("fromSaved", () => {
  it("turns saved results into library items, keeping their order", () => {
    expect(fromSaved(saved)).toEqual([
      { id: "saved-s2", title: "Newer blog", type: "Blog post", detail: "Saved from Blog", summary: "Title", text: "Title\n\n- Point one" },
      { id: "saved-s1", title: "Older copy", type: "Social post", detail: "Saved from Improve Copy", summary: "Refill. Reuse.", text: "Refill. Reuse." },
    ]);
  });
});

describe("showLibrary", () => {
  const all = [...fromSaved(saved), ...LIBRARY_SAMPLES];
  const base = { query: "", filter: "All content", campaign: null, sort: "newest" } as const;

  it("shows saved items first, then the Make's twelve samples", () => {
    const shown = showLibrary(all, base);
    expect(shown).toHaveLength(14);
    expect(titles(shown).slice(0, 3)).toEqual(["Newer blog", "Older copy", "Coastal trail, Vancouver.jpg"]);
  });

  it("filters by type", () => {
    expect(titles(showLibrary(all, { ...base, filter: "Ad copy" }))).toEqual(["Make your next getaway greener.", "Go beyond the guidebook."]);
  });

  it("shows nothing for Campaigns until a campaign folder is chosen", () => {
    expect(showLibrary(all, { ...base, filter: "Campaigns" })).toEqual([]);
    expect(titles(showLibrary(all, { ...base, filter: "Campaigns", campaign: "BOGO" }))).toEqual([
      "Make your next getaway greener.",
      "Weekend in Vancouver.mp4",
      "Travel lighter.",
    ]);
  });

  it("searches titles, types, details, summaries, and campaigns", () => {
    expect(titles(showLibrary(all, { ...base, query: "  black friday " }))).toEqual([
      "Coastal trail, Vancouver.jpg",
      "Local market moments.mp4",
      "Stay local. Explore more.",
    ]);
    expect(titles(showLibrary(all, { ...base, query: "mindful" }))).toEqual(["Travel lighter.", "Slow travel, small footprint"]);
  });

  it("sorts A to Z", () => {
    expect(titles(showLibrary(LIBRARY_SAMPLES, { ...base, sort: "a-z" })).slice(0, 3)).toEqual([
      "Coastal trail, Vancouver.jpg",
      "Eco-lodge in the forest.jpg",
      "Go beyond the guidebook.",
    ]);
  });
});

describe("filterCounts", () => {
  it("counts every type and the items in campaigns", () => {
    expect(filterCounts(LIBRARY_SAMPLES)).toEqual({
      "All content": 12,
      Campaigns: 6,
      Image: 3,
      Video: 2,
      "Social post": 3,
      "Blog post": 2,
      "Ad copy": 2,
    });
  });

  it("has the Make's two campaign folders", () => {
    expect(LIBRARY_CAMPAIGNS).toEqual(["Black Friday", "BOGO"]);
  });
});

describe("libraryText", () => {
  it("gives the text to reuse: saved text, or a sample's title and summary", () => {
    expect(libraryText(fromSaved(saved)[1])).toBe("Refill. Reuse.");
    const sample = LIBRARY_SAMPLES.find((item) => item.title === "Travel lighter.") as LibraryItem;
    expect(libraryText(sample)).toBe("Travel lighter.\n\nRefill. Reuse. Respect. Five habits for mindful travel.");
  });

  it("has nothing to reuse for an image without a summary", () => {
    expect(libraryText(LIBRARY_SAMPLES[0])).toBeNull();
  });
});
