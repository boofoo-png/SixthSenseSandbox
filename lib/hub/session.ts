import { decodeStoredAccount, type StoredAccount } from "./account";
import { DEMO_ACCOUNT } from "./constants";
import { verifyPassword } from "./password";
import { isPublicPath } from "./routing";

// Prototype sign-in (see docs/DECISIONS.md, 2026-10-22). There is no database: a person can
// sign in with the demo account or with the account created in their own browser.

export { decodeStoredAccount };
export { ACCOUNT_COOKIE, DEMO_ACCOUNT, SESSION_COOKIE } from "./constants";

export type SignedInUser = { email: string; name: string };

/** The user these details sign in as, or null when they match no account. */
export function checkCredentials(
  email: string,
  password: string,
  stored: StoredAccount | null,
): SignedInUser | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return null;
  if (normalized === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
    return { email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name };
  }
  if (stored && stored.account.email === normalized && verifyPassword(password, stored.passwordHash)) {
    return { email: stored.account.email, name: `${stored.account.firstName} ${stored.account.lastName}`.trim() };
  }
  return null;
}

/** A page inside the app to go to after signing in; the dashboard for anything else. */
export function safeNextPath(next: string | null | undefined): string {
  // Browsers drop tabs and line breaks from URLs and treat a backslash like "/", so "/\t/evil.com" would
  // become "//evil.com", another site. Refuse those characters, then check the origin is ours.
  if (!next || !next.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(next)) return "/";
  const base = "http://sixthsense.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return "/";
  }
  if (url.origin !== base || isPublicPath(url.pathname)) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
