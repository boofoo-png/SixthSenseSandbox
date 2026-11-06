import { beforeEach, describe, expect, it, vi } from "vitest";
import { metaCookieName } from "@/lib/hub/accounts";
import { clearSnapshotCache, connectionFor, liveSnapshot, summaryFor } from "./access";
import type { Fetch } from "./graph";
import { sealConnection, type MetaConnection } from "./token";

const config = { appId: "1234567890", appSecret: "app-secret", tokenSecret: "s".repeat(43), graphVersion: "v26.0" };
const email = "demo@sixthsense.app";
const now = Date.parse("2026-11-06T12:00:00Z");
const connection: MetaConnection = {
  token: "EAAG-token",
  expiresAt: now + 1000 * 3600 * 24 * 59,
  igUserId: "1784",
  igUsername: "sixthsense",
  pageId: "2",
  pageName: "Sixth Sense Test",
  connectedAt: now,
};
const jarWith = (values: Record<string, string>) => ({ get: (name: string) => (name in values ? { value: values[name] } : undefined) });
const sealedJar = () => jarWith({ [metaCookieName(email, "hotel-depot")]: sealConnection(connection, { email, businessId: "hotel-depot" }, config.tokenSecret) });

beforeEach(() => clearSnapshotCache());

describe("connectionFor / summaryFor", () => {
  it("reads the business's own connection and never exposes the token in the summary", () => {
    expect(connectionFor(sealedJar(), email, "hotel-depot", config, now)?.igUsername).toBe("sixthsense");
    const summary = summaryFor(sealedJar(), email, "hotel-depot", config, now);
    expect(summary).toEqual({ status: "connected", igUsername: "sixthsense", pageName: "Sixth Sense Test", connectedAt: now, expiresAt: connection.expiresAt });
    expect(JSON.stringify(summary)).not.toContain("EAAG");
  });

  it("is not connected for the other business, and not configured without keys", () => {
    expect(summaryFor(sealedJar(), email, "hospitality-emporium", config, now)).toEqual({ status: "not-connected" });
    expect(summaryFor(sealedJar(), email, "hotel-depot", null, now)).toEqual({ status: "not-configured" });
  });
});

describe("liveSnapshot", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body));
  const fetcher = vi.fn<Fetch>(async (url) => (new URL(url).pathname.endsWith("/1784") ? ok({ username: "sixthsense", followers_count: 42 }) : ok({ data: [] })));

  it("is sample without a connection", async () => {
    expect(await liveSnapshot(null, 7, config, fetcher, now)).toEqual({ status: "sample" });
  });

  it("reads live numbers and remembers them for 15 minutes", async () => {
    fetcher.mockClear();
    const first = await liveSnapshot(connection, 7, config, fetcher, now);
    expect(first.status === "live" && first.snapshot.followers).toBe(42);
    const calls = fetcher.mock.calls.length;
    await liveSnapshot(connection, 7, config, fetcher, now + 60_000);
    expect(fetcher.mock.calls.length).toBe(calls);
    await liveSnapshot(connection, 7, config, fetcher, now + 16 * 60_000);
    expect(fetcher.mock.calls.length).toBe(calls * 2);
  });

  it("reports failures without remembering them", async () => {
    const failing: Fetch = async () => new Response(JSON.stringify({ error: { code: 190 } }), { status: 400 });
    expect(await liveSnapshot(connection, 30, config, failing, now)).toEqual({ status: "failed", error: "expired" });
    const live = await liveSnapshot(connection, 30, config, fetcher, now);
    expect(live.status).toBe("live");
  });
});
