import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { decodeCookieJson, encodeCookieJson, isRecord } from "./cookie-json";

// Forgot Password in the prototype (docs/FUNCTIONALITY.md). Nothing can be emailed, so the reset
// link is shown on screen; the cookie keeps only a hash of its token, and the link expires.

export const RESET_COOKIE = "ss_reset";
export const RESET_LIFETIME_MS = 15 * 60 * 1000;

export type StoredReset = { email: string; tokenHash: string; expiresAt: number };

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** A new reset token for `email` (to put in the link) and what the cookie keeps. */
export function createReset(email: string, now: number): { token: string; stored: StoredReset } {
  const token = randomBytes(32).toString("hex");
  return { token, stored: { email, tokenHash: hash(token), expiresAt: now + RESET_LIFETIME_MS } };
}

/** The email the token resets, or null when it is wrong, missing, or expired. */
export function checkResetToken(stored: StoredReset | null, token: string, now: number): string | null {
  if (!stored || !/^[0-9a-f]{64}$/.test(token) || now > stored.expiresAt) return null;
  const expected = Buffer.from(stored.tokenHash, "hex");
  const actual = Buffer.from(hash(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? stored.email : null;
}

const isStoredReset = (value: unknown): value is StoredReset =>
  isRecord(value) &&
  typeof value.email === "string" &&
  typeof value.tokenHash === "string" &&
  typeof value.expiresAt === "number";

export function encodeReset(stored: StoredReset): string {
  // A few short strings, always far below the cookie limit.
  return encodeCookieJson(stored) ?? "";
}

export function decodeReset(value: string | undefined): StoredReset | null {
  return decodeCookieJson(value, isStoredReset);
}
