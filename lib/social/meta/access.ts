import { metaCookieName } from "@/lib/hub/accounts";
import { metaConfig, type MetaConfig } from "./config";
import { readSnapshot, type Fetch, type GraphError, type MetaSnapshot } from "./graph";
import { openConnection, type MetaConnection } from "./token";

// Data access for the Meta connection (plan 2.1). Server only: pages and route handlers call these,
// and only plain numbers and post details (never the token) are passed on to components.

type CookieReader = { get(name: string): { value: string } | undefined };

/** What the page needs to know about a business's connection, safe to pass to the browser. */
export type ConnectionSummary =
  | { status: "not-configured" }
  | { status: "not-connected" }
  | { status: "connected"; igUsername: string; pageName: string; connectedAt: number; expiresAt: number };

export function connectionFor(jar: CookieReader, email: string, businessId: string, config: MetaConfig | null = metaConfig(), now = Date.now()): MetaConnection | null {
  if (!config) return null;
  return openConnection(jar.get(metaCookieName(email, businessId))?.value, { email, businessId }, config.tokenSecret, now);
}

export function summaryFor(jar: CookieReader, email: string, businessId: string, config: MetaConfig | null = metaConfig(), now = Date.now()): ConnectionSummary {
  if (!config) return { status: "not-configured" };
  const connection = connectionFor(jar, email, businessId, config, now);
  if (!connection) return { status: "not-connected" };
  const { igUsername, pageName, connectedAt, expiresAt } = connection;
  return { status: "connected", igUsername, pageName, connectedAt, expiresAt };
}

export type LiveSnapshot = { status: "live"; snapshot: MetaSnapshot } | { status: "sample" } | { status: "failed"; error: GraphError };

const CACHE_MS = 15 * 60 * 1000; // results are remembered per server process (cleared when this file reloads)
const cache = new Map<string, { at: number; value: LiveSnapshot }>();

/** Clears remembered results (tests, and after connecting or disconnecting). */
export function clearSnapshotCache(igUserId?: string) {
  if (!igUserId) cache.clear();
  else for (const key of cache.keys()) if (key.startsWith(`${igUserId}:`)) cache.delete(key);
}

/**
 * The connected account's numbers for the last `days` days, remembered for 15 minutes so page
 * loads do not run into Meta's rate limits. "sample" when there is no connection; failures are
 * not remembered, so the next load tries again.
 */
export async function liveSnapshot(
  connection: MetaConnection | null,
  days: number,
  config: MetaConfig | null = metaConfig(),
  fetcher: Fetch = fetch,
  now = Date.now(),
): Promise<LiveSnapshot> {
  if (!connection || !config) return { status: "sample" };
  const key = `${connection.igUserId}:${connection.pageId}:${days}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.value;
  const result = await readSnapshot(config, connection.token, connection, days, fetcher, now);
  if (!result.ok) return { status: "failed", error: result.error };
  const value: LiveSnapshot = { status: "live", snapshot: result.data };
  cache.set(key, { at: now, value });
  return value;
}
