import { createHmac } from "node:crypto";
import type { MetaConfig } from "./config";

// Calls to Meta's Graph API (plan 1.4). Server only. The access token goes in the Authorization
// header, never in a URL or a log, and every call carries appsecret_proof. `fetch` can be swapped
// in tests, which never touch the network.

export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type GraphError = "expired" | "permission" | "rate-limited" | "no-instagram" | "other";
export type GraphResult<T> = { ok: true; data: T } | { ok: false; error: GraphError };

export type InstagramPage = { pageId: string; pageName: string; igUserId: string; igUsername: string };

export type InstagramPost = {
  id: string;
  caption: string;
  permalink: string;
  timestamp: string;
  type: string;
  likes: number;
  comments: number;
  thumbnail: string | null;
};

export type FacebookPost = {
  id: string;
  message: string;
  permalink: string;
  createdTime: string;
  reactions: number;
  comments: number;
  shares: number;
};

/** The Facebook Page's numbers for the period. Meta renamed Page metrics in 2026, so each may be null. */
export type PageSnapshot = {
  /** Times the Page's content was seen (page_media_view). */
  views: number | null;
  /** Accounts that saw the Page's content (page_total_media_view_unique). */
  viewers: number | null;
  /** Reactions, comments, shares and clicks on the Page's posts (page_post_engagements). */
  engagements: number | null;
  previous: { viewers: number | null; engagements: number | null };
  posts: FacebookPost[];
};

/** One account's numbers for a period. A null figure means Meta did not return it. */
export type MetaSnapshot = {
  username: string;
  followers: number | null;
  mediaCount: number | null;
  pageFollowers: number | null;
  reach: number | null;
  views: number | null;
  accountsEngaged: number | null;
  interactions: number | null;
  /** New followers over the period (Meta only reports this for accounts with 100+ followers). */
  newFollowers: number | null;
  /** The same length of time just before, for the change figures. */
  previous: { reach: number | null; interactions: number | null };
  posts: InstagramPost[];
  /** Null when the Page could not be read (for example, no Page access token). */
  facebook: PageSnapshot | null;
};

const GRAPH = "https://graph.facebook.com";

function errorOf(body: unknown): GraphError {
  const error = (body as { error?: { code?: number } } | null)?.error;
  const code = error?.code;
  if (code === 190 || code === 102) return "expired";
  if (code === 10 || (typeof code === "number" && code >= 200 && code < 300)) return "permission";
  if (code === 4 || code === 17 || code === 32 || code === 613) return "rate-limited";
  return "other";
}

async function getJson(fetcher: Fetch, url: URL, token?: string): Promise<GraphResult<Record<string, unknown>>> {
  try {
    const response = await fetcher(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || body === null || typeof body !== "object") {
      logRefusal(url, body);
      return { ok: false, error: errorOf(body) };
    }
    return { ok: true, data: body as Record<string, unknown> };
  } catch {
    return { ok: false, error: "other" };
  }
}

/** In development, says why Meta refused a call (path, metric, and Meta's message; never the token or proof). */
function logRefusal(url: URL, body: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  const error = (body as { error?: { code?: number; message?: string } } | null)?.error;
  const metric = url.searchParams.get("metric");
  console.warn(`[meta] ${url.pathname}${metric ? ` (${metric})` : ""} refused: code ${error?.code ?? "?"}: ${error?.message ?? "no message"}`);
}

function graphUrl(config: MetaConfig, path: string, token: string, params: Record<string, string> = {}): URL {
  const url = new URL(`${GRAPH}/${config.graphVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("appsecret_proof", createHmac("sha256", config.appSecret).update(token).digest("hex"));
  return url;
}

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value: unknown): string => (typeof value === "string" ? value : "");

/** Swaps the login code for a long-lived (about 60 day) user token. */
export async function tokenFromCode(config: MetaConfig, redirectUri: string, code: string, fetcher: Fetch, now = Date.now()): Promise<GraphResult<{ token: string; expiresAt: number }>> {
  const short = new URL(`${GRAPH}/${config.graphVersion}/oauth/access_token`);
  short.searchParams.set("client_id", config.appId);
  short.searchParams.set("client_secret", config.appSecret);
  short.searchParams.set("redirect_uri", redirectUri);
  short.searchParams.set("code", code);
  const first = await getJson(fetcher, short);
  if (!first.ok) return first;
  const shortToken = str(first.data.access_token);
  if (!shortToken) return { ok: false, error: "other" };

  const long = new URL(`${GRAPH}/${config.graphVersion}/oauth/access_token`);
  long.searchParams.set("grant_type", "fb_exchange_token");
  long.searchParams.set("client_id", config.appId);
  long.searchParams.set("client_secret", config.appSecret);
  long.searchParams.set("fb_exchange_token", shortToken);
  const second = await getJson(fetcher, long);
  if (!second.ok) return second;
  const token = str(second.data.access_token);
  if (!token) return { ok: false, error: "other" };
  const seconds = num(second.data.expires_in) ?? 60 * 24 * 3600;
  return { ok: true, data: { token, expiresAt: now + seconds * 1000 } };
}

/** The first Facebook Page the person shared that has an Instagram professional account linked. */
export async function findInstagramPage(config: MetaConfig, token: string, fetcher: Fetch): Promise<GraphResult<InstagramPage>> {
  const result = await getJson(fetcher, graphUrl(config, "me/accounts", token, { fields: "id,name,instagram_business_account{id,username}", limit: "50" }), token);
  if (!result.ok) return result;
  const pages = Array.isArray(result.data.data) ? (result.data.data as Record<string, unknown>[]) : [];
  for (const page of pages) {
    const ig = page.instagram_business_account as Record<string, unknown> | undefined;
    if (ig && str(ig.id) && str(page.id)) {
      return { ok: true, data: { pageId: str(page.id), pageName: str(page.name) || "Facebook Page", igUserId: str(ig.id), igUsername: str(ig.username) || "instagram" } };
    }
  }
  return { ok: false, error: "no-instagram" };
}

const INSIGHT_METRICS = ["reach", "views", "accounts_engaged", "total_interactions"] as const;

/** Followers, reach, views, engagement and recent posts for the last `days` days (1 to 30). */
export async function readSnapshot(
  config: MetaConfig,
  token: string,
  page: Pick<InstagramPage, "igUserId" | "pageId">,
  days: number,
  fetcher: Fetch,
  now = Date.now(),
): Promise<GraphResult<MetaSnapshot>> {
  const span = Math.min(30, Math.max(1, days)) * 24 * 3600;
  const until = Math.floor(now / 1000);
  const since = until - span;
  const insightUrl = (metric: string, from: number, to: number, type = "total_value") =>
    graphUrl(config, `${page.igUserId}/insights`, token, { metric, period: "day", metric_type: type, since: String(from), until: String(to) });

  const [profile, pages, posts, followerDays, previousReach, previousInteractions, ...insights] = await Promise.all([
    getJson(fetcher, graphUrl(config, page.igUserId, token, { fields: "username,followers_count,media_count" }), token),
    getJson(fetcher, graphUrl(config, "me/accounts", token, { fields: "id,followers_count,access_token", limit: "50" }), token),
    getJson(
      fetcher,
      graphUrl(config, `${page.igUserId}/media`, token, { fields: "id,caption,media_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url", limit: "25" }),
      token,
    ),
    getJson(fetcher, insightUrl("follower_count", since, until, "time_series"), token),
    getJson(fetcher, insightUrl("reach", since - span, since), token),
    getJson(fetcher, insightUrl("total_interactions", since - span, since), token),
    // One call per metric, so a renamed metric only loses that one number.
    ...INSIGHT_METRICS.map((metric) => getJson(fetcher, insightUrl(metric, since, until), token)),
  ]);

  if (!profile.ok) return profile;

  const totalOf = (result: GraphResult<Record<string, unknown>>): number | null => {
    if (!result.ok) return null;
    const first = Array.isArray(result.data.data) ? (result.data.data[0] as Record<string, unknown> | undefined) : undefined;
    return num((first?.total_value as Record<string, unknown> | undefined)?.value);
  };
  const insight = (index: number) => totalOf(insights[index]);
  const followerValues = (() => {
    if (!followerDays.ok || !Array.isArray(followerDays.data.data)) return [];
    const first = followerDays.data.data[0] as Record<string, unknown> | undefined;
    return Array.isArray(first?.values) ? (first.values as Record<string, unknown>[]).map((row) => num(row.value)).filter((value): value is number => value !== null) : [];
  })();

  const pageRow = pages.ok && Array.isArray(pages.data.data) ? (pages.data.data as Record<string, unknown>[]).find((row) => str(row.id) === page.pageId) : undefined;
  const pageToken = str(pageRow?.access_token);
  const facebook = pageToken ? await readPage(config, pageToken, page.pageId, since, until, span, fetcher) : null;

  const media = posts.ok && Array.isArray(posts.data.data) ? (posts.data.data as Record<string, unknown>[]) : [];
  return {
    ok: true,
    data: {
      username: str(profile.data.username),
      followers: num(profile.data.followers_count),
      mediaCount: num(profile.data.media_count),
      pageFollowers: num(pageRow?.followers_count),
      reach: insight(0),
      views: insight(1),
      accountsEngaged: insight(2),
      interactions: insight(3),
      newFollowers: followerValues.length > 0 ? followerValues.reduce((sum, value) => sum + value, 0) : null,
      previous: { reach: totalOf(previousReach), interactions: totalOf(previousInteractions) },
      facebook,
      posts: media
        .filter((item) => str(item.id) && str(item.permalink).startsWith("https://"))
        .map((item) => ({
          id: str(item.id),
          caption: str(item.caption),
          permalink: str(item.permalink),
          timestamp: str(item.timestamp),
          type: str(item.media_type),
          likes: num(item.like_count) ?? 0,
          comments: num(item.comments_count) ?? 0,
          thumbnail: str(item.thumbnail_url) || (str(item.media_type) === "VIDEO" ? "" : str(item.media_url)) || null,
        })),
    },
  };
}

/** Adds up a daily Page metric's values; null when Meta refused it or sent none. */
function sumDaily(result: GraphResult<Record<string, unknown>>): number | null {
  if (!result.ok || !Array.isArray(result.data.data)) return null;
  const first = result.data.data[0] as Record<string, unknown> | undefined;
  const values = Array.isArray(first?.values) ? (first.values as Record<string, unknown>[]).map((row) => num(row.value)).filter((value): value is number => value !== null) : [];
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) : null;
}

const summaryCount = (value: unknown): number => num((value as { summary?: { total_count?: unknown } } | undefined)?.summary?.total_count) ?? 0;

/** The Page's views, viewers, post engagement and recent posts, read with the Page's own token. */
async function readPage(config: MetaConfig, pageToken: string, pageId: string, since: number, until: number, span: number, fetcher: Fetch): Promise<PageSnapshot> {
  const metric = (name: string, from: number, to: number) =>
    getJson(fetcher, graphUrl(config, `${pageId}/insights`, pageToken, { metric: name, period: "day", since: String(from), until: String(to) }), pageToken);
  const [views, viewers, engagements, previousViewers, previousEngagements, posts] = await Promise.all([
    metric("page_media_view", since, until),
    metric("page_total_media_view_unique", since, until),
    metric("page_post_engagements", since, until),
    metric("page_total_media_view_unique", since - span, since),
    metric("page_post_engagements", since - span, since),
    getJson(
      fetcher,
      graphUrl(config, `${pageId}/posts`, pageToken, {
        fields: "id,message,created_time,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)",
        limit: "25",
      }),
      pageToken,
    ),
  ]);
  const rows = posts.ok && Array.isArray(posts.data.data) ? (posts.data.data as Record<string, unknown>[]) : [];
  return {
    views: sumDaily(views),
    viewers: sumDaily(viewers),
    engagements: sumDaily(engagements),
    previous: { viewers: sumDaily(previousViewers), engagements: sumDaily(previousEngagements) },
    posts: rows
      .filter((row) => str(row.id) && str(row.permalink_url).startsWith("https://"))
      .map((row) => ({
        id: str(row.id),
        message: str(row.message),
        permalink: str(row.permalink_url),
        createdTime: str(row.created_time),
        reactions: summaryCount(row.reactions),
        comments: summaryCount(row.comments),
        shares: num((row.shares as { count?: unknown } | undefined)?.count) ?? 0,
      })),
  };
}

/** Asks Meta to remove the app's permissions. Disconnecting still works if this fails. */
export async function revokePermissions(config: MetaConfig, token: string, fetcher: Fetch): Promise<boolean> {
  try {
    const response = await fetcher(graphUrl(config, "me/permissions", token).toString(), { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
