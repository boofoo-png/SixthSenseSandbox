import { describe, expect, it } from "vitest";
import { META_SCOPES, createState, loginDialogUrl, readState } from "./oauth";

const SECRET = "s".repeat(43);
const owner = { email: "demo@sixthsense.app", businessId: "hotel-depot" };
const now = Date.parse("2026-11-06T12:00:00Z");
const config = { appId: "1234567890", appSecret: "x", tokenSecret: SECRET, graphVersion: "v26.0" };

describe("loginDialogUrl", () => {
  it("asks Facebook for read-only Instagram and Page permissions and comes back to the callback", () => {
    const url = new URL(loginDialogUrl(config, "http://localhost:3000/api/meta/callback", "abc"));
    expect(url.origin + url.pathname).toBe("https://www.facebook.com/v26.0/dialog/oauth");
    expect(url.searchParams.get("client_id")).toBe("1234567890");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/meta/callback");
    expect(url.searchParams.get("state")).toBe("abc");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe(META_SCOPES.join(","));
    expect(META_SCOPES).not.toContain("instagram_content_publishing");
    expect(url.toString()).not.toContain(config.appSecret);
  });
});

describe("createState / readState", () => {
  it("gives the business back when the state matches its cookie", () => {
    const { state, cookie } = createState(owner, SECRET, now);
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(readState(state, cookie, owner.email, SECRET, now + 60_000)).toBe("hotel-depot");
  });

  it("refuses a different state, account, secret, or a changed cookie", () => {
    const { state, cookie } = createState(owner, SECRET, now);
    const other = createState(owner, SECRET, now);
    expect(readState(other.state, cookie, owner.email, SECRET, now)).toBeNull();
    expect(readState(state, cookie, "someone@else.com", SECRET, now)).toBeNull();
    expect(readState(state, cookie, owner.email, "t".repeat(43), now)).toBeNull();
    expect(readState(state, cookie.replace("hotel-depot", "hospitality-emporium"), owner.email, SECRET, now)).toBeNull();
    expect(readState(state, undefined, owner.email, SECRET, now)).toBeNull();
    expect(readState(null, cookie, owner.email, SECRET, now)).toBeNull();
  });

  it("expires after 10 minutes", () => {
    const { state, cookie } = createState(owner, SECRET, now);
    expect(readState(state, cookie, owner.email, SECRET, now + 10 * 60_000 + 1)).toBeNull();
  });
});
