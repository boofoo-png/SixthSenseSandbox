"use client";

import { useSyncExternalStore } from "react";
import { addPost, removePost, updatePost } from "@/lib/ai-studio/planned-posts";
import { STORAGE_KEY, loadPosts, savePosts } from "@/lib/ai-studio/storage";
import type { PlannedPost } from "@/lib/ai-studio/types";

// One shared store for every component on the page, backed by localStorage.
// Built on useSyncExternalStore so the server renders an empty list and the
// browser fills it in without a hydration error (see docs/DECISIONS.md).

const EMPTY: PlannedPost[] = [];
const listeners = new Set<() => void>();
let cache: PlannedPost[] | null = null;

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): PlannedPost[] {
  if (cache === null) {
    cache = loadPosts(browserStorage());
  }
  return cache;
}

function getServerSnapshot(): PlannedPost[] {
  return EMPTY;
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changed the saved posts: reload them.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cache = null;
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setPosts(next: PlannedPost[]) {
  cache = next;
  savePosts(browserStorage(), next);
  notify();
}

/** Clears the in-memory copy so tests start fresh. */
export function resetPlannedPostsForTests() {
  cache = null;
}

/** Planned posts saved in this browser, with functions to change them. */
export function usePlannedPosts() {
  const posts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    posts,
    add: (post: PlannedPost) => setPosts(addPost(getSnapshot(), post)),
    update: (id: string, changes: Partial<Omit<PlannedPost, "id">>) => setPosts(updatePost(getSnapshot(), id, changes)),
    remove: (id: string) => setPosts(removePost(getSnapshot(), id)),
  };
}
