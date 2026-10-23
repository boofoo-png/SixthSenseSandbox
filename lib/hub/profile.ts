import { DEMO_ACCOUNT } from "./constants";
import { decodeCookieJson, encodeCookieJson, isRecord } from "./cookie-json";
import type { BusinessProfile } from "./onboarding";

// The business profile from the second Create an Account page, kept in the `ss_profile` cookie.
// No server-only imports, so proxy.ts can use it.

/** Cookie holding the business profile (base64url JSON). */
export const PROFILE_COOKIE = "ss_profile";

export function encodeProfile(profile: BusinessProfile): string {
  const encoded = encodeCookieJson(profile);
  // validateOnboarding refuses answers too big for a cookie, so this only fails on a bug.
  if (!encoded) throw new Error("Business profile is too large to save in a cookie");
  return encoded;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function isProfile(value: unknown): value is BusinessProfile {
  if (!isRecord(value)) return false;
  const p = value as Partial<BusinessProfile>;
  return (
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
    isStringArray(p.invites)
  );
}

/** Read the profile cookie; null when it is missing or not a profile. */
export function decodeProfile(value: string | undefined): BusinessProfile | null {
  return decodeCookieJson(value, isProfile);
}

/** True when the signed-in person has finished onboarding. The demo account always has. */
export function isOnboarded(sessionEmail: string, profileValue: string | undefined): boolean {
  if (sessionEmail === DEMO_ACCOUNT.email) return true;
  return decodeProfile(profileValue)?.email === sessionEmail;
}
