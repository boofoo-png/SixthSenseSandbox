// Settings for every cookie the prototype writes (see docs/DECISIONS.md, prototype sign-in).

export const ONE_DAY = 60 * 60 * 24;
export const THIRTY_DAYS = ONE_DAY * 30;
export const ONE_YEAR = ONE_DAY * 365;

/** httpOnly, same-site, secure in production; `maxAge` in seconds, or a session cookie without it. */
export function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}
