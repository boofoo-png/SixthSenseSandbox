"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encodeCookieJson } from "@/lib/hub/cookie-json";
import { ONE_YEAR, cookieOptions } from "@/lib/hub/cookie-options";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { profileCookieName } from "@/lib/hub/profile";
import { availableCompetitors, trackedCompetitors } from "@/lib/hub/tracking";

/** "a=1&b=2" from the form, without anything after "#" and without an old `saved`. */
function returnQuery(raw: FormDataEntryValue | null): string {
  const params = new URLSearchParams(typeof raw === "string" ? raw.split("#")[0] : "");
  params.delete("saved");
  params.set("saved", "1");
  return params.toString();
}

/**
 * Save which competitors to track (docs/FUNCTIONALITY.md, audience-based selection). The form
 * lists only the competitors shown for the chosen audience (`shown`) and the ticked ones
 * (`track`); tracked competitors that were not shown stay tracked.
 */
export async function saveTrackedCompetitors(formData: FormData): Promise<void> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  const profile = profileForSession(store, email);
  if (!profile) redirect("/onboarding");

  const available = availableCompetitors(profile);
  const exists = new Set(available.map((competitor) => competitor.slug));
  const strings = (key: string) => formData.getAll(key).filter((value): value is string => typeof value === "string");
  const shown = new Set(strings("shown"));
  const kept = trackedCompetitors(profile, available)
    .map((competitor) => competitor.slug)
    .filter((slug) => !shown.has(slug));
  const ticked = strings("track").filter((slug) => exists.has(slug) && shown.has(slug));
  const next = [...new Set([...kept, ...ticked])];

  const updated = encodeCookieJson({ ...profile, trackedCompetitors: next });
  if (updated) store.set(profileCookieName(email), updated, cookieOptions(ONE_YEAR));
  redirect(`/competitors?${returnQuery(formData.get("query"))}`);
}
