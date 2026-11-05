"use client";

import { useSyncExternalStore } from "react";
import { SAVED_CONTENT_KEY, loadSavedContent, saveContent, type SavedContent } from "@/lib/hub/content/saved";

// Content saved with Save, kept in this browser. Same pattern as AI Studio's planned posts:
// the server renders none and the browser fills them in without a hydration error.

const EMPTY: SavedContent[] = [];
const listeners = new Set<() => void>();
let cache: SavedContent[] | null = null;

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): SavedContent[] {
  if (cache === null) cache = loadSavedContent(browserStorage());
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SAVED_CONTENT_KEY || event.key === null) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Clears the in-memory copy so tests start fresh. */
export function resetSavedContentForTests() {
  cache = null;
}

/** Saved content, newest first, and a way to add to it (false when the browser blocks storage). */
export function useSavedContent() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  return {
    items,
    save: (item: SavedContent): boolean => {
      const saved = saveContent(browserStorage(), item);
      cache = saved ? loadSavedContent(browserStorage()) : [item, ...getSnapshot().filter((existing) => existing.id !== item.id)];
      for (const listener of listeners) listener();
      return saved;
    },
  };
}
