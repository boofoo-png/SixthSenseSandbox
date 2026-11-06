"use client";

import { useSyncExternalStore } from "react";
import {
  SCHEDULE_KEY,
  loadSchedules,
  saveSchedules,
  scheduleFor,
  type Business,
  type BusinessSchedule,
  type SavedSchedules,
} from "@/lib/hub/posting-plan";

// Each business's schedule, kept in this browser (same pattern as AI Studio's planned posts).
// Until a business is changed it shows its sample schedule.

const EMPTY: SavedSchedules = {};
const listeners = new Set<() => void>();
let cache: SavedSchedules | null = null;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getSnapshot(): SavedSchedules {
  if (cache === null) cache = loadSchedules(storage());
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SCHEDULE_KEY || event.key === null) {
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
export function resetSchedulesForTests() {
  cache = null;
}

/** The business's schedule and a way to change it. `saved` is false when the browser blocks storage. */
export function useSchedule(business: Business, today: string) {
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const schedule = scheduleFor(saved, business, today);
  return {
    schedule,
    /** False until the business's schedule has been changed (it is still the sample one). */
    isSample: saved[business.id] === undefined,
    update: (change: (current: BusinessSchedule) => BusinessSchedule): boolean => {
      const current = getSnapshot();
      const next = { ...current, [business.id]: change(scheduleFor(current, business, today)) };
      cache = next;
      const ok = saveSchedules(storage(), next);
      for (const listener of listeners) listener();
      return ok;
    },
  };
}
