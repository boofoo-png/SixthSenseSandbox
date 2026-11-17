import type { SavedContent } from "./saved";
import { CONTENT_TOOLS, type ToolSlug } from "./tools";

// My Content, the content library from the team's Figma Make (MyContentPage in SixthSenseApp.tsx):
// search, type filters with counts, Campaigns folders, newest first or A to Z, grid or list.
// It lists what was saved in this browser first, then the Make's twelve sample items.

export const LIBRARY_TYPES = ["Image", "Video", "Social post", "Blog post", "Ad copy"] as const;
export type LibraryType = (typeof LIBRARY_TYPES)[number];
export const LIBRARY_FILTERS = ["All content", "Campaigns", ...LIBRARY_TYPES] as const;
export type LibraryFilter = (typeof LIBRARY_FILTERS)[number];
export const LIBRARY_CAMPAIGNS = ["Black Friday", "BOGO"] as const;
export type LibraryCampaign = (typeof LIBRARY_CAMPAIGNS)[number];
export type LibrarySort = "newest" | "a-z";

export type LibraryItem = {
  id: string;
  title: string;
  type: LibraryType;
  detail: string;
  image?: { src: string; alt: string };
  summary?: string;
  campaign?: LibraryCampaign;
  /** The full text of something saved with a tool's Save button. */
  text?: string;
};

const photo = (name: "amenities" | "bathroom" | "bottles" | "counter" | "dispenser", alt: string) => ({ src: `/content/${name}.jpg`, alt });

/** The Make's sample library, in its order (newest first). */
export const LIBRARY_SAMPLES: readonly LibraryItem[] = [
  { id: "sample-1", title: "Coastal trail, Vancouver.jpg", type: "Image", detail: "JPG", image: photo("bathroom", ""), campaign: "Black Friday" },
  { id: "sample-2", title: "Local market moments.mp4", type: "Video", detail: "MP4 · 0:24", image: photo("counter", ""), campaign: "Black Friday" },
  { id: "sample-3", title: "Stay local. Explore more.", type: "Social post", detail: "Instagram", image: photo("dispenser", ""), campaign: "Black Friday" },
  {
    id: "sample-4",
    title: "Sustainable city breaks",
    type: "Blog post",
    detail: "Article",
    summary: "A thoughtful guide to exploring more and leaving a little less behind.",
  },
  {
    id: "sample-5",
    title: "Make your next getaway greener.",
    type: "Ad copy",
    detail: "Campaign",
    summary: "Discover local stays and lower-impact travel ideas.",
    campaign: "BOGO",
  },
  { id: "sample-6", title: "Weekend in Vancouver.mp4", type: "Video", detail: "MP4 · 0:45", image: photo("bottles", ""), campaign: "BOGO" },
  { id: "sample-7", title: "Market morning.jpg", type: "Image", detail: "JPG", image: photo("amenities", "") },
  {
    id: "sample-8",
    title: "Travel lighter.",
    type: "Social post",
    detail: "LinkedIn",
    summary: "Refill. Reuse. Respect. Five habits for mindful travel.",
    campaign: "BOGO",
  },
  { id: "sample-9", title: "Slow travel, small footprint", type: "Blog post", detail: "Article", summary: "Simple ideas for a more mindful journey." },
  { id: "sample-10", title: "Eco-lodge in the forest.jpg", type: "Image", detail: "JPG", image: photo("bathroom", "") },
  { id: "sample-11", title: "Go beyond the guidebook.", type: "Ad copy", detail: "Campaign", summary: "Find your next local experience." },
  { id: "sample-12", title: "Good days start local.", type: "Social post", detail: "Instagram", image: photo("counter", "") },
];

const TYPE_OF_TOOL: Record<ToolSlug, LibraryType> = {
  "social-post": "Social post",
  video: "Video",
  blog: "Blog post",
  "ad-copy": "Ad copy",
  "edit-posts": "Social post",
  "improve-copy": "Social post",
  repurpose: "Social post",
  upload: "Blog post",
};

/** Saved results as library items, in the order given (newest first). */
export function fromSaved(saved: readonly SavedContent[]): LibraryItem[] {
  return saved.map((item) => ({
    id: `saved-${item.id}`,
    title: item.title,
    type: TYPE_OF_TOOL[item.tool],
    detail: `Saved from ${CONTENT_TOOLS.find((tool) => tool.slug === item.tool)?.title ?? "Content Creation"}`,
    summary: item.text.split("\n").find((line) => line.trim())?.trim() ?? "",
    text: item.text,
  }));
}

/** The items to show for the search, filter, chosen campaign folder, and sort. */
export function showLibrary(
  items: readonly LibraryItem[],
  { query, filter, campaign, sort }: { query: string; filter: LibraryFilter; campaign: LibraryCampaign | null; sort: LibrarySort },
): LibraryItem[] {
  const text = query.trim().toLowerCase();
  const shown = items.filter(
    (item) =>
      (filter === "All content" || (filter === "Campaigns" ? campaign !== null && item.campaign === campaign : item.type === filter)) &&
      (!text || `${item.title} ${item.type} ${item.detail} ${item.summary ?? ""} ${item.campaign ?? ""}`.toLowerCase().includes(text)),
  );
  return sort === "a-z" ? shown.toSorted((a, b) => a.title.localeCompare(b.title)) : shown;
}

/** How many items each filter holds (Campaigns counts the items in any campaign). */
export function filterCounts(items: readonly LibraryItem[]): Record<LibraryFilter, number> {
  const counts = Object.fromEntries(LIBRARY_FILTERS.map((filter) => [filter, 0])) as Record<LibraryFilter, number>;
  counts["All content"] = items.length;
  for (const item of items) {
    counts[item.type] += 1;
    if (item.campaign) counts.Campaigns += 1;
  }
  return counts;
}

/** The text to reuse in Repurpose content, or null when the item has none (a photo or video). */
export function libraryText(item: LibraryItem): string | null {
  if (item.text) return item.text;
  return item.summary ? `${item.title}\n\n${item.summary}` : null;
}
