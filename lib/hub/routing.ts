// Where a request should go before the page renders (used by proxy.ts).
// Only checks cookies: an optimistic check, not security.

/** Pages anyone can open without signing in. */
export const PUBLIC_PATHS: readonly string[] = ["/login", "/create-account", "/forgot-password", "/reset-password"];

/** Pages a signed-in user has no reason to see. */
const SIGNED_OUT_ONLY: readonly string[] = ["/login", "/create-account"];

/** The second Create an Account page ("Tell us about your industry"). */
export const ONBOARDING_PATH = "/onboarding";

/**
 * `signingUp`: step 1 of Create an Account is done but not step 2, so the account does not
 * exist yet and the person is not signed in.
 */
export type Visitor = { signedIn: boolean; onboarded: boolean; signingUp: boolean };

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

/**
 * The address to redirect to, or null to show the page.
 * `search` is the query string including "?" (or "").
 */
export function redirectFor(pathname: string, search: string, { signedIn, onboarded, signingUp }: Visitor): string | null {
  if (!signedIn) {
    if (isPublicPath(pathname)) return null;
    if (pathname === ONBOARDING_PATH) return signingUp ? null : "/create-account";
    const next = `${pathname}${search}`;
    return next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  }
  if (!onboarded) {
    return pathname === ONBOARDING_PATH || pathname === "/forgot-password" || pathname === "/reset-password" ? null : ONBOARDING_PATH;
  }
  return SIGNED_OUT_ONLY.includes(pathname) || pathname === ONBOARDING_PATH ? "/" : null;
}
