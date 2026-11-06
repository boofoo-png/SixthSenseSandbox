import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { MetaConfig } from "./config";
import type { ConnectionOwner } from "./token";

// The Facebook Login for Business step of connecting (plan 1.3). Read only: no publishing or
// messaging permissions are asked for.

export const META_SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement", "business_management"] as const;

export const STATE_COOKIE = "ss_meta_state";
export const STATE_MAX_AGE_SECONDS = 10 * 60;

export function loginDialogUrl(config: MetaConfig, redirectUri: string, state: string): string {
  const url = new URL(`https://www.facebook.com/${config.graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES.join(","));
  return url.toString();
}

function sign(parts: string[], email: string, secret: string): string {
  return createHmac("sha256", secret).update(`meta-state\n${email.trim().toLowerCase()}\n${parts.join("\n")}`).digest("base64url");
}

/** A random state for the login link, and the cookie that proves this browser started it. */
export function createState(owner: ConnectionOwner, secret: string, now = Date.now()): { state: string; cookie: string } {
  const state = randomBytes(32).toString("base64url");
  const expires = String(now + STATE_MAX_AGE_SECONDS * 1000);
  const parts = [state, owner.businessId, expires];
  return { state, cookie: [...parts, sign(parts, owner.email, secret)].join(".") };
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The business the login was started for, or null when the state does not match, was changed, or is too old. */
export function readState(state: string | null, cookie: string | undefined, email: string, secret: string, now = Date.now()): string | null {
  if (!state || !cookie) return null;
  const parts = cookie.split(".");
  if (parts.length !== 4) return null;
  const [saved, businessId, expires, signature] = parts;
  if (!same(signature, sign([saved, businessId, expires], email, secret))) return null;
  if (!same(state, saved) || !(Number(expires) >= now)) return null;
  return /^[a-z0-9-]{1,40}$/.test(businessId) ? businessId : null;
}
