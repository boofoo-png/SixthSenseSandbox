// Settings for the Meta (Instagram and Facebook) connection, read from .env.local on the server.
// Without them the app runs as before on sample data, and Connect explains it is not set up.
// Never import this from a "use client" file: the App Secret and token secret must stay on the server.

export const DEFAULT_GRAPH_VERSION = "v26.0";

/** Must exactly match a Valid OAuth Redirect URI in the Meta app (with the site's origin in front). */
export const META_CALLBACK_PATH = "/api/meta/callback";

export type MetaConfig = {
  appId: string;
  appSecret: string;
  /** Encrypts saved access tokens (see token.ts). At least 32 characters. */
  tokenSecret: string;
  graphVersion: string;
};

const MIN_TOKEN_SECRET = 32;

/** The connection's settings, or null when any are missing or unusable. */
export function metaConfig(): MetaConfig | null {
  const appId = process.env.META_APP_ID?.trim() ?? "";
  const appSecret = process.env.META_APP_SECRET?.trim() ?? "";
  const tokenSecret = process.env.SOCIAL_TOKEN_SECRET?.trim() ?? "";
  const version = process.env.META_GRAPH_VERSION?.trim() ?? "";
  if (!/^\d{5,20}$/.test(appId) || !appSecret || tokenSecret.length < MIN_TOKEN_SECRET) return null;
  return { appId, appSecret, tokenSecret, graphVersion: /^v\d{1,3}\.\d$/.test(version) ? version : DEFAULT_GRAPH_VERSION };
}

export function metaConfigured(): boolean {
  return metaConfig() !== null;
}
