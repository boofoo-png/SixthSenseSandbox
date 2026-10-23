import { DEMO_ACCOUNT } from "./constants";
import type { BusinessProfile } from "./onboarding";

// The business profile from the second Create an Account page, kept in the `ss_profile` cookie.
// No server-only imports, so proxy.ts can use it.

/** Cookie holding the business profile (base64url JSON). */
export const PROFILE_COOKIE = "ss_profile";

export function encodeProfile(profile: BusinessProfile): string {
  return Buffer.from(JSON.stringify(profile)).toString("base64url");
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** Read the profile cookie; null when it is missing or not a profile. */
export function decodeProfile(value: string | undefined): BusinessProfile | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Partial<BusinessProfile>;
    const ok =
      typeof p.email === "string" &&
      isStringArray(p.industries) &&
      Array.isArray(p.regions) &&
      typeof p.audience === "string" &&
      isStringArray(p.goals) &&
      typeof p.website === "string" &&
      Array.isArray(p.socials) &&
      Array.isArray(p.competitors) &&
      isStringArray(p.reportLinks) &&
      isStringArray(p.documents) &&
      isStringArray(p.invites);
    return ok ? (p as BusinessProfile) : null;
  } catch {
    return null;
  }
}

/** True when the signed-in person has finished onboarding. The demo account always has. */
export function isOnboarded(sessionEmail: string, profileValue: string | undefined): boolean {
  if (sessionEmail === DEMO_ACCOUNT.email) return true;
  return decodeProfile(profileValue)?.email === sessionEmail;
}
