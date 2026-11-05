import { CONTENT_TOOLS, type ToolSlug } from "./tools";

// Content saved with a tool's Save button, kept in this browser under a versioned key (like
// AI Studio's planned posts). Repurpose content can start from it.

export const SAVED_CONTENT_KEY = "sixthsense.saved-content";
const VERSION = 2;
const MAX_SAVED = 50;

export type SavedContent = { id: string; tool: ToolSlug; title: string; text: string; savedAt: number };

const SLUGS = new Set<string>(CONTENT_TOOLS.map((tool) => tool.slug));

function isSavedContent(value: unknown): value is SavedContent {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<SavedContent>;
  return (
    typeof item.id === "string" &&
    typeof item.tool === "string" &&
    SLUGS.has(item.tool) &&
    typeof item.title === "string" &&
    typeof item.text === "string" &&
    typeof item.savedAt === "number"
  );
}

/** Saved content, newest first; anything broken or from another version is ignored. */
export function loadSavedContent(storage: Storage | undefined): SavedContent[] {
  try {
    const raw = storage?.getItem(SAVED_CONTENT_KEY);
    if (!raw) return [];
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null || (saved as { version?: unknown }).version !== VERSION) return [];
    const items = (saved as { items?: unknown }).items;
    return Array.isArray(items) ? items.filter(isSavedContent).sort((a, b) => b.savedAt - a.savedAt) : [];
  } catch {
    return [];
  }
}

/** Adds an item (the newest 50 are kept); false when storage is missing or blocked. */
export function saveContent(storage: Storage | undefined, item: SavedContent): boolean {
  if (!storage) return false;
  try {
    const items = [item, ...loadSavedContent(storage).filter((existing) => existing.id !== item.id)].slice(0, MAX_SAVED);
    storage.setItem(SAVED_CONTENT_KEY, JSON.stringify({ version: VERSION, items }));
    return true;
  } catch {
    return false;
  }
}
