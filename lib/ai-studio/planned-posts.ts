import { isIsoDate } from "@/lib/analytics/dates";
import { PLATFORMS, type Platform } from "@/lib/analytics/types";
import type { PlannedPost } from "./types";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Returns the post if it is a valid planned post, or null (used for anything loaded from storage). */
export function parsePlannedPost(value: unknown): PlannedPost | null {
  if (!isRecord(value)) {
    return null;
  }
  const { id, date, time, platform, caption, hashtags, ideaTitle } = value;
  if (
    !isNonEmptyString(id) ||
    typeof date !== "string" ||
    !isIsoDate(date) ||
    typeof time !== "string" ||
    !TIME.test(time) ||
    !PLATFORMS.includes(platform as Platform) ||
    !isNonEmptyString(caption) ||
    !Array.isArray(hashtags) ||
    !hashtags.every((tag) => typeof tag === "string") ||
    typeof ideaTitle !== "string"
  ) {
    return null;
  }
  return { id, date, time, platform: platform as Platform, caption, hashtags, ideaTitle };
}

/** Posts in date order, then time order. */
export function sortPosts(posts: readonly PlannedPost[]): PlannedPost[] {
  return [...posts].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

/** Adds a post (replacing one with the same id) and keeps the list in order. */
export function addPost(posts: readonly PlannedPost[], post: PlannedPost): PlannedPost[] {
  return sortPosts([...posts.filter((p) => p.id !== post.id), post]);
}

/** Changes some fields of a post; ignored if the result would not be a valid post. */
export function updatePost(posts: readonly PlannedPost[], id: string, changes: Partial<Omit<PlannedPost, "id">>): PlannedPost[] {
  const existing = posts.find((p) => p.id === id);
  const updated = existing ? parsePlannedPost({ ...existing, ...changes }) : null;
  return updated ? addPost(posts, updated) : [...posts];
}

export function removePost(posts: readonly PlannedPost[], id: string): PlannedPost[] {
  return posts.filter((p) => p.id !== id);
}

/** Posts grouped by date (in date order), each day in time order. */
export function postsByDay(posts: readonly PlannedPost[]): Map<string, PlannedPost[]> {
  const groups = new Map<string, PlannedPost[]>();
  for (const post of sortPosts(posts)) {
    groups.set(post.date, [...(groups.get(post.date) ?? []), post]);
  }
  return groups;
}
