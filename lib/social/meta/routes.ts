import { metaCookieName } from "@/lib/hub/accounts";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { cookieOptions } from "@/lib/hub/cookie-options";
import { workspaceFor } from "@/lib/hub/workspace";
import { clearSnapshotCache } from "./access";
import { META_CALLBACK_PATH, metaConfig, type MetaConfig } from "./config";
import { findInstagramPage, tokenFromCode, type Fetch } from "./graph";
import { STATE_COOKIE, STATE_MAX_AGE_SECONDS, createState, loginDialogUrl, readState } from "./oauth";
import { settingsWith, type MetaResult } from "./results";
import { sealConnection } from "./token";

// What /api/meta/connect and /api/meta/callback do (plan 2.2 and 2.3), kept apart from the route
// files so it can be tested without a server. Each returns where to send the browser and which
// cookies to set or delete.

type CookieReader = { get(name: string): { value: string } | undefined };
export type CookieChange = { name: string; value: string; maxAge: number };
export type RouteOutcome = { location: string; cookies: CookieChange[] };

const clearState: CookieChange = { name: STATE_COOKIE, value: "", maxAge: 0 };

export const callbackUrl = (origin: string): string => `${origin}${META_CALLBACK_PATH}`;

export function startConnect(jar: CookieReader, origin: string, config: MetaConfig | null = metaConfig(), now = Date.now()): RouteOutcome {
  const email = jar.get(SESSION_COOKIE)?.value;
  if (!email) return { location: "/login", cookies: [] };
  if (!config) return { location: settingsWith("not-configured"), cookies: [] };
  const { business } = workspaceFor(jar);
  const { state, cookie } = createState({ email, businessId: business.id }, config.tokenSecret, now);
  return {
    location: loginDialogUrl(config, callbackUrl(origin), state),
    cookies: [{ name: STATE_COOKIE, value: cookie, maxAge: STATE_MAX_AGE_SECONDS }],
  };
}

export async function finishConnect(
  jar: CookieReader,
  params: URLSearchParams,
  origin: string,
  config: MetaConfig | null = metaConfig(),
  fetcher: Fetch = fetch,
  now = Date.now(),
): Promise<RouteOutcome> {
  const email = jar.get(SESSION_COOKIE)?.value;
  if (!email) return { location: "/login", cookies: [clearState] };
  if (!config) return { location: settingsWith("not-configured"), cookies: [clearState] };

  const businessId = readState(params.get("state"), jar.get(STATE_COOKIE)?.value, email, config.tokenSecret, now);
  if (!businessId || !workspaceFor(jar).businesses.some((business) => business.id === businessId)) {
    return { location: settingsWith("expired-login"), cookies: [clearState] };
  }
  if (params.get("error")) return { location: settingsWith("cancelled"), cookies: [clearState] };
  const code = params.get("code");
  if (!code) return { location: settingsWith("error"), cookies: [clearState] };

  const token = await tokenFromCode(config, callbackUrl(origin), code, fetcher, now);
  if (!token.ok) return { location: settingsWith(token.error === "permission" ? "permission" : "error"), cookies: [clearState] };
  const page = await findInstagramPage(config, token.data.token, fetcher);
  if (!page.ok) {
    const result: MetaResult = page.error === "no-instagram" ? "no-instagram" : page.error === "permission" ? "permission" : "error";
    return { location: settingsWith(result), cookies: [clearState] };
  }

  const sealed = sealConnection({ token: token.data.token, expiresAt: token.data.expiresAt, ...page.data, connectedAt: now }, { email, businessId }, config.tokenSecret);
  clearSnapshotCache(page.data.igUserId);
  return {
    location: settingsWith("connected"),
    cookies: [clearState, { name: metaCookieName(email, businessId), value: sealed, maxAge: Math.max(60, Math.floor((token.data.expiresAt - now) / 1000)) }],
  };
}

/** Cookie options for a change: httpOnly, SameSite=Lax, Secure in production. */
export const optionsFor = (change: CookieChange) => cookieOptions(change.maxAge || undefined);
