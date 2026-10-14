// Planned posts are kept in the browser (see docs/DECISIONS.md: AI Studio browser storage).
import { parsePlannedPost } from "./planned-posts";
import type { PlannedPost } from "./types";

export const STORAGE_KEY = "marketing-dashboard.planned-posts";
const VERSION = 1;

/**
 * Planned posts saved in the browser. Anything unexpected (no storage,
 * blocked storage, corrupted JSON, another version, invalid posts) is
 * ignored, so a bad saved value can never break the page.
 */
export function loadPosts(storage: Storage | undefined): PlannedPost[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== "object" || saved === null || !("version" in saved) || !("posts" in saved)) {
      return [];
    }
    if (saved.version !== VERSION || !Array.isArray(saved.posts)) {
      return [];
    }
    return saved.posts.flatMap((item: unknown) => {
      const post = parsePlannedPost(item);
      return post ? [post] : [];
    });
  } catch {
    return [];
  }
}

/** Saves planned posts; returns false instead of throwing when storage is missing or blocked. */
export function savePosts(storage: Storage | undefined, posts: readonly PlannedPost[]): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, posts }));
    return true;
  } catch {
    return false;
  }
}
