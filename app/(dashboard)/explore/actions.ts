"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAudience } from "@/lib/hub/audience";
import { encodeCookieJson } from "@/lib/hub/cookie-json";
import { ONE_YEAR, cookieOptions } from "@/lib/hub/cookie-options";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { profileCookieName } from "@/lib/hub/profile";

/** "a=1&b=2" from the form, without anything after "#" and without an old `saved`. */
function returnQuery(raw: FormDataEntryValue | null): URLSearchParams {
  const params = new URLSearchParams(typeof raw === "string" ? raw.split("#")[0] : "");
  params.delete("saved");
  return params;
}

/** Save the audience as the default, so searches and reports start from it (docs/FUNCTIONALITY.md). */
export async function saveDefaultAudience(formData: FormData): Promise<void> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  const profile = profileForSession(store, email);
  if (!profile) redirect("/onboarding");

  const params = returnQuery(formData.get("query"));
  const slug = formData.get("audience");
  const audience = typeof slug === "string" ? findAudience(slug) : null;
  if (audience) {
    const updated = encodeCookieJson({ ...profile, defaultAudience: audience.slug });
    if (updated) {
      store.set(profileCookieName(email), updated, cookieOptions(ONE_YEAR));
      params.set("audience", audience.slug);
      params.set("saved", "1");
    }
  }
  const query = params.toString();
  redirect(query ? `/explore?${query}` : "/explore");
}
