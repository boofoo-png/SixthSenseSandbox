import { accountKey } from "./account-key";
import { DEMO_ACCOUNT } from "./constants";
import { decodeCookieJson, encodeCookieJson, isRecord } from "./cookie-json";
import type { BusinessProfile } from "./onboarding";

// The business profile from the second Create an Account page, kept in the `ss_profile` cookie.
// No server-only imports, so proxy.ts can use it.

/** The single profile cookie used before each account had its own; still read. */
export const PROFILE_COOKIE = "ss_profile";
export const PROFILE_PREFIX = "ss_profile_";

/** The cookie holding this account's business profile (base64url JSON). */
export function profileCookieName(email: string): string {
  return `${PROFILE_PREFIX}${accountKey(email)}`;
}

/** The saved profile value for `email`: its own cookie, or the old shared one. */
export function profileValueFor(jar: { get(name: string): { value: string } | undefined }, email: string): string | undefined {
  return jar.get(profileCookieName(email))?.value ?? jar.get(PROFILE_COOKIE)?.value;
}

export function encodeProfile(profile: BusinessProfile): string {
  const encoded = encodeCookieJson(profile);
  // validateOnboarding refuses answers too big for a cookie, so this only fails on a bug.
  if (!encoded) throw new Error("Business profile is too large to save in a cookie");
  return encoded;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** Profiles saved before several audiences could be chosen have one `audience`. */
type SavedProfile = Omit<BusinessProfile, "audiences"> & { audiences?: string[]; audience?: string };

function isSavedProfile(value: unknown): value is SavedProfile {
  if (!isRecord(value)) return false;
  const p = value as Partial<SavedProfile>;
  return (
    typeof p.email === "string" &&
    isStringArray(p.industries) &&
    Array.isArray(p.regions) &&
    (isStringArray(p.audiences) || typeof p.audience === "string") &&
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
  const saved = decodeCookieJson(value, isSavedProfile);
  if (!saved) return null;
  const { audience, audiences, ...rest } = saved;
  return { ...rest, audiences: audiences ?? (audience ? [audience] : []) };
}

/** True when the signed-in person has finished onboarding. The demo account always has. */
export function isOnboarded(sessionEmail: string, profileValue: string | undefined): boolean {
  if (sessionEmail === DEMO_ACCOUNT.email) return true;
  return decodeProfile(profileValue)?.email === sessionEmail;
}
