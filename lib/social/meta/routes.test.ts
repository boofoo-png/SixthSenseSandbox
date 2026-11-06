import { describe, expect, it } from "vitest";
import { BUSINESS_COOKIE } from "@/lib/hub/businesses";
import { metaCookieName } from "@/lib/hub/accounts";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import type { Fetch } from "./graph";
import { STATE_COOKIE } from "./oauth";
import { finishConnect, startConnect } from "./routes";
import { openConnection } from "./token";

const config = { appId: "1234567890", appSecret: "app-secret", tokenSecret: "s".repeat(43), graphVersion: "v26.0" };
const origin = "http://localhost:3000";
const email = DEMO_ACCOUNT.email;
const now = Date.parse("2026-11-06T12:00:00Z");
const jarWith = (values: Record<string, string>) => ({ get: (name: string) => (name in values ? { value: values[name] } : undefined) });

const meta: Fetch = async (url) => {
  const path = new URL(url).pathname;
  if (path.endsWith("/oauth/access_token")) return new Response(JSON.stringify({ access_token: "EAAG-long", expires_in: 5_184_000 }));
  if (path.endsWith("/me/accounts")) return new Response(JSON.stringify({ data: [{ id: "2", name: "Sixth Sense Test", instagram_business_account: { id: "1784", username: "sixthsense" } }] }));
  return new Response("{}", { status: 404 });
};

/** Runs Connect for the chosen business and returns the cookies a browser would send back. */
function started(business = "sixth-sense") {
  const cookies: Record<string, string> = { [SESSION_COOKIE]: email, [BUSINESS_COOKIE]: business };
  const outcome = startConnect(jarWith(cookies), origin, config, now);
  const state = new URL(outcome.location).searchParams.get("state") ?? "";
  return { outcome, state, cookies: { ...cookies, [STATE_COOKIE]: outcome.cookies[0].value } };
}

describe("startConnect", () => {
  it("sends signed-out visitors to log in, and explains when the app is not set up", () => {
    expect(startConnect(jarWith({}), origin, config, now).location).toBe("/login");
    expect(startConnect(jarWith({ [SESSION_COOKIE]: email }), origin, null, now).location).toBe("/settings?section=workspace&meta=not-configured");
  });

  it("goes to Facebook Login with a state cookie for 10 minutes", () => {
    const { outcome } = started();
    const url = new URL(outcome.location);
    expect(url.hostname).toBe("www.facebook.com");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/meta/callback");
    expect(outcome.cookies).toEqual([{ name: STATE_COOKIE, value: expect.any(String), maxAge: 600 }]);
  });
});

describe("finishConnect", () => {
  it("saves a sealed connection for the business that started it and clears the state", async () => {
    const { state, cookies } = started();
    const outcome = await finishConnect(jarWith(cookies), new URLSearchParams({ code: "abc", state }), origin, config, meta, now);
    expect(outcome.location).toBe("/settings?section=workspace&meta=connected");
    expect(outcome.cookies[0]).toEqual({ name: STATE_COOKIE, value: "", maxAge: 0 });
    const saved = outcome.cookies[1];
    expect(saved.name).toBe(metaCookieName(email, "sixth-sense"));
    expect(saved.value).not.toContain("EAAG");
    expect(saved.maxAge).toBe(5_184_000);
    expect(openConnection(saved.value, { email, businessId: "sixth-sense" }, config.tokenSecret, now)).toMatchObject({ igUsername: "sixthsense", pageName: "Sixth Sense Test", token: "EAAG-long" });
  });

  it("refuses a missing or different state (another browser, or a forged link)", async () => {
    const { cookies } = started();
    const other = started();
    for (const state of ["", other.state]) {
      const outcome = await finishConnect(jarWith(cookies), new URLSearchParams({ code: "abc", state }), origin, config, meta, now);
      expect(outcome.location).toBe("/settings?section=workspace&meta=expired-login");
      expect(outcome.cookies).toHaveLength(1);
    }
  });

  it("explains a cancelled login and a Page without Instagram", async () => {
    const { state, cookies } = started();
    const cancelled = await finishConnect(jarWith(cookies), new URLSearchParams({ error: "access_denied", state }), origin, config, meta, now);
    expect(cancelled.location).toBe("/settings?section=workspace&meta=cancelled");
    const noInstagram: Fetch = async (url) =>
      new URL(url).pathname.endsWith("/me/accounts") ? new Response(JSON.stringify({ data: [{ id: "1", name: "Page" }] })) : meta(url);
    const outcome = await finishConnect(jarWith(cookies), new URLSearchParams({ code: "abc", state }), origin, config, noInstagram, now);
    expect(outcome.location).toBe("/settings?section=workspace&meta=no-instagram");
  });

  it("only redirects within the app", async () => {
    const { state, cookies } = started();
    const outcome = await finishConnect(jarWith(cookies), new URLSearchParams({ code: "abc", state, next: "https://evil.example" }), origin, config, meta, now);
    expect(outcome.location.startsWith("/settings")).toBe(true);
  });
});
