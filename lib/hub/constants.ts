// Sign-in values shared by the browser, the server, and proxy.ts. Keep this file free of
// server-only imports (node:crypto) so client components can use it.

/** Cookie holding the signed-in email address. */
export const SESSION_COOKIE = "ss_session";
/** Cookie holding the account created in this browser, with its password hashed. */
export const ACCOUNT_COOKIE = "ss_account";

/** Cookie holding step 1 of Create an Account until step 2 is finished (password hashed). */
export const SIGNUP_COOKIE = "ss_signup";
/** Cookie holding step 2 answers typed before going Back to step 1. */
export const ONBOARDING_DRAFT_COOKIE = "ss_onboarding_draft";

/** Set when sign-up just finished, so the dashboard shows its "New account" version. */
export const NEW_ACCOUNT_COOKIE = "ss_new";

/** Shown on the login page so anyone can try the prototype. Not a secret. */
export const DEMO_ACCOUNT = {
  email: "demo@sixthsense.app",
  password: "sixthsense-demo",
  name: "Demo User",
} as const;
