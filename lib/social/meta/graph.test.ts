import { describe, expect, it } from "vitest";
import { findInstagramPage, readSnapshot, revokePermissions, tokenFromCode, type Fetch } from "./graph";

const config = { appId: "1234567890", appSecret: "app-secret", tokenSecret: "s".repeat(43), graphVersion: "v26.0" };
const TOKEN = "EAAG-long-token";
const now = Date.parse("2026-11-06T12:00:00Z");

type Call = { url: URL; init?: RequestInit };

/** A fake Graph API: routes by path (and metric), records each call. */
function fakeGraph(routes: Record<string, { status?: number; body: unknown }>) {
  const calls: Call[] = [];
  const fetcher: Fetch = async (url, init) => {
    const parsed = new URL(url);
    calls.push({ url: parsed, init });
    const path = parsed.pathname.replace("/v26.0/", "");
    const key = parsed.searchParams.get("metric") ? `${path}?metric=${parsed.searchParams.get("metric")}` : path;
    const route = routes[key] ?? { status: 404, body: { error: { code: 100, message: "Unknown path" } } };
    return new Response(JSON.stringify(route.body), { status: route.status ?? 200 });
  };
  return { fetcher, calls };
}

describe("tokenFromCode", () => {
  it("swaps the code for a short token, then a long-lived one", async () => {
    let step = 0;
    const calls: URL[] = [];
    const fetcher: Fetch = async (url) => {
      calls.push(new URL(url));
      step += 1;
      const body = step === 1 ? { access_token: "short" } : { access_token: TOKEN, expires_in: 5_184_000 };
      return new Response(JSON.stringify(body));
    };
    const result = await tokenFromCode(config, "http://localhost:3000/api/meta/callback", "the-code", fetcher, now);
    expect(result).toEqual({ ok: true, data: { token: TOKEN, expiresAt: now + 5_184_000_000 } });
    expect(calls[0].searchParams.get("code")).toBe("the-code");
    expect(calls[0].searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/meta/callback");
    expect(calls[1].searchParams.get("grant_type")).toBe("fb_exchange_token");
    expect(calls[1].searchParams.get("fb_exchange_token")).toBe("short");
  });

  it("reports a refused code", async () => {
    const fetcher: Fetch = async () => new Response(JSON.stringify({ error: { code: 100 } }), { status: 400 });
    expect(await tokenFromCode(config, "x", "bad", fetcher)).toEqual({ ok: false, error: "other" });
  });

  it("reports a network failure instead of throwing", async () => {
    const fetcher: Fetch = async () => {
      throw new Error("offline");
    };
    expect(await tokenFromCode(config, "x", "c", fetcher)).toEqual({ ok: false, error: "other" });
  });
});

describe("findInstagramPage", () => {
  it("picks the first Page with an Instagram account, sending the token only in the header", async () => {
    const { fetcher, calls } = fakeGraph({
      "me/accounts": {
        body: {
          data: [
            { id: "1", name: "No Instagram Page" },
            { id: "2", name: "Sixth Sense Test", instagram_business_account: { id: "1784", username: "sixthsense" } },
          ],
        },
      },
    });
    expect(await findInstagramPage(config, TOKEN, fetcher)).toEqual({ ok: true, data: { pageId: "2", pageName: "Sixth Sense Test", igUserId: "1784", igUsername: "sixthsense" } });
    expect(calls[0].url.toString()).not.toContain(TOKEN);
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(calls[0].url.searchParams.get("appsecret_proof")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("says so when no shared Page has Instagram linked", async () => {
    const { fetcher } = fakeGraph({ "me/accounts": { body: { data: [{ id: "1", name: "Page" }] } } });
    expect(await findInstagramPage(config, TOKEN, fetcher)).toEqual({ ok: false, error: "no-instagram" });
  });

  it("maps Meta's error codes", async () => {
    for (const [code, error] of [
      [190, "expired"],
      [200, "permission"],
      [10, "permission"],
      [4, "rate-limited"],
      [1, "other"],
    ] as const) {
      const { fetcher } = fakeGraph({ "me/accounts": { status: 400, body: { error: { code } } } });
      expect(await findInstagramPage(config, TOKEN, fetcher)).toEqual({ ok: false, error });
    }
  });
});

describe("readSnapshot", () => {
  const page = { igUserId: "1784", pageId: "2" };
  const total = (value: number) => ({ body: { data: [{ name: "x", total_value: { value } }] } });

  it("reads followers, the period's insights, the Page's followers, and recent posts", async () => {
    const { fetcher, calls } = fakeGraph({
      "1784": { body: { username: "sixthsense", followers_count: 42, media_count: 3 } },
      "me/accounts": { body: { data: [{ id: "2", followers_count: 17 }] } },
      "1784/media": {
        body: {
          data: [
            { id: "m1", caption: "Hello", media_type: "IMAGE", permalink: "https://www.instagram.com/p/abc/", timestamp: "2026-11-05T10:00:00+0000", like_count: 5, comments_count: 1, media_url: "https://cdn.example/1.jpg" },
            { id: "m2", media_type: "VIDEO", permalink: "javascript:alert(1)", like_count: 9 },
          ],
        },
      },
      "1784/insights?metric=reach": total(120),
      "1784/insights?metric=views": total(300),
      "1784/insights?metric=accounts_engaged": total(15),
      "1784/insights?metric=total_interactions": total(22),
      "1784/insights?metric=follower_count": { body: { data: [{ name: "follower_count", values: [{ value: 2 }, { value: 3 }] }] } },
    });
    const result = await readSnapshot(config, TOKEN, page, 7, fetcher, now);
    expect(result).toEqual({
      ok: true,
      data: {
        username: "sixthsense",
        followers: 42,
        mediaCount: 3,
        pageFollowers: 17,
        reach: 120,
        views: 300,
        accountsEngaged: 15,
        interactions: 22,
        newFollowers: 5,
        previous: { reach: 120, interactions: 22 },
        facebook: null,
        posts: [{ id: "m1", caption: "Hello", permalink: "https://www.instagram.com/p/abc/", timestamp: "2026-11-05T10:00:00+0000", type: "IMAGE", likes: 5, comments: 1, thumbnail: "https://cdn.example/1.jpg" }],
      },
    });
    const reaches = calls.filter((call) => call.url.searchParams.get("metric") === "reach").map((call) => call.url);
    const [earlier, latest] = [...reaches].sort((a, b) => Number(a.searchParams.get("since")) - Number(b.searchParams.get("since")));
    expect(latest.searchParams.get("metric_type")).toBe("total_value");
    expect(Number(latest.searchParams.get("until"))).toBe(now / 1000);
    expect(Number(latest.searchParams.get("until")) - Number(latest.searchParams.get("since"))).toBe(7 * 24 * 3600);
    expect(earlier.searchParams.get("until")).toBe(latest.searchParams.get("since"));
    expect(calls.every((call) => !call.url.toString().includes(TOKEN))).toBe(true);
  });

  it("reads the Page with its own token: views, viewers, post engagement, and recent posts", async () => {
    const daily = (...values: number[]) => ({ body: { data: [{ name: "x", values: values.map((value) => ({ value })) }] } });
    const { fetcher, calls } = fakeGraph({
      "1784": { body: { username: "sixthsense", followers_count: 42 } },
      "me/accounts": { body: { data: [{ id: "2", followers_count: 17, access_token: "PAGE-TOKEN" }] } },
      "2/insights?metric=page_media_view": daily(10, 20),
      "2/insights?metric=page_total_media_view_unique": daily(4, 5),
      "2/posts": {
        body: {
          data: [
            { id: "2_1", message: "Launch", created_time: "2026-11-04T10:00:00+0000", permalink_url: "https://www.facebook.com/2_1", shares: { count: 1 }, reactions: { summary: { total_count: 5 } }, comments: { summary: { total_count: 2 } } },
          ],
        },
      },
    });
    const result = await readSnapshot(config, TOKEN, page, 7, fetcher, now);
    expect(result.ok && result.data.facebook).toEqual({
      views: 30,
      viewers: 9,
      engagements: null,
      previous: { viewers: 9, engagements: null },
      posts: [{ id: "2_1", message: "Launch", permalink: "https://www.facebook.com/2_1", createdTime: "2026-11-04T10:00:00+0000", reactions: 5, comments: 2, shares: 1 }],
    });
    const pageCalls = calls.filter((call) => call.url.pathname.startsWith("/v26.0/2/"));
    expect(pageCalls.every((call) => (call.init?.headers as Record<string, string>).Authorization === "Bearer PAGE-TOKEN")).toBe(true);
    expect(calls.every((call) => !call.url.toString().includes("PAGE-TOKEN"))).toBe(true);
  });

  it("leaves out a metric Meta refuses, keeping the rest", async () => {
    const { fetcher } = fakeGraph({
      "1784": { body: { username: "sixthsense", followers_count: 42 } },
      "1784/insights?metric=reach": total(120),
    });
    const result = await readSnapshot(config, TOKEN, page, 30, fetcher, now);
    expect(result.ok && result.data).toMatchObject({ followers: 42, reach: 120, views: null, pageFollowers: null, newFollowers: null, posts: [], facebook: null });
  });

  it("fails when the account itself cannot be read, e.g. an expired token", async () => {
    const { fetcher } = fakeGraph({ "1784": { status: 400, body: { error: { code: 190 } } } });
    expect(await readSnapshot(config, TOKEN, page, 7, fetcher, now)).toEqual({ ok: false, error: "expired" });
  });
});

describe("revokePermissions", () => {
  it("deletes the app's permissions and reports failure without throwing", async () => {
    const { fetcher, calls } = fakeGraph({ "me/permissions": { body: { success: true } } });
    expect(await revokePermissions(config, TOKEN, fetcher)).toBe(true);
    expect(calls[0].init?.method).toBe("DELETE");
    const failing: Fetch = async () => {
      throw new Error("offline");
    };
    expect(await revokePermissions(config, TOKEN, failing)).toBe(false);
  });
});
