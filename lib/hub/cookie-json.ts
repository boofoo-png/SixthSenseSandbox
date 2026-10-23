// Values kept in cookies as base64url JSON (accounts, business profiles, drafts).
// Browsers drop cookies over about 4096 bytes without telling anyone, so writes are capped.

/** Largest cookie value written; leaves room for the name and attributes within 4096 bytes. */
export const MAX_COOKIE_VALUE = 3800;

/** Encode a value for a cookie; null when it would be too big to keep. */
export function encodeCookieJson(value: unknown): string | null {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return encoded.length <= MAX_COOKIE_VALUE ? encoded : null;
}

/** Decode a cookie value; null when it is missing, corrupted, or fails `isValid`. */
export function decodeCookieJson<T>(value: string | undefined, isValid: (parsed: unknown) => parsed is T): T | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
