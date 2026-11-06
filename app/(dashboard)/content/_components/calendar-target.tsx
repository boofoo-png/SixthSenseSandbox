"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { WorkspaceBusiness } from "@/lib/hub/businesses";

// Which business's calendar Content Creation's "Add to calendar" puts posts on (the one chosen
// in the top bar), and today's date for the post editor.

export type CalendarTarget = { business: WorkspaceBusiness; today: string };

const Context = createContext<CalendarTarget | null>(null);

export function CalendarTargetProvider({ value, children }: { value: CalendarTarget; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCalendarTarget(): CalendarTarget | null {
  return useContext(Context);
}
