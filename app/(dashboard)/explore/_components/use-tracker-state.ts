"use client";

import { useSyncExternalStore } from "react";
import { AUDIENCE_TRENDS_KEY, STARTER_STATE, loadTrackerState, saveTrackerState, type TrackerState } from "@/lib/hub/audience-trends";

// Saved audiences, their selection, and the watchlist, kept in this browser. Same pattern as saved
// content: the server renders the starter state and the browser fills in what it saved.

const listeners = new Set<() => void>();
let cache: TrackerState | null = null;

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): TrackerState {
  if (cache === null) cache = loadTrackerState(browserStorage());
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === AUDIENCE_TRENDS_KEY || event.key === null) {
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
export function resetTrackerForTests() {
  cache = null;
}

/** The tracker state and a way to change it (the change stays on screen even if storage is blocked). */
export function useTrackerState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => STARTER_STATE);
  return {
    state,
    update: (change: (current: TrackerState) => TrackerState) => {
      cache = change(getSnapshot());
      saveTrackerState(browserStorage(), cache);
      for (const listener of listeners) listener();
    },
  };
}
