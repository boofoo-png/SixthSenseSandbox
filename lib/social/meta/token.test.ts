import { describe, expect, it } from "vitest";
import { openConnection, sealConnection, type MetaConnection } from "./token";

const SECRET = "s".repeat(43);
const owner = { email: "demo@sixthsense.app", businessId: "hotel-depot" };
const now = Date.parse("2026-11-06T12:00:00Z");

const connection: MetaConnection = {
  token: "EAAG-long-lived-token",
  expiresAt: now + 60 * 24 * 3600 * 1000,
  igUserId: "17841400000000000",
  igUsername: "hoteldepot",
  pageId: "100000000000000",
  pageName: "Hotel Depot",
  connectedAt: now,
};

describe("sealConnection / openConnection", () => {
  it("round-trips a connection for the same account and business", () => {
    const sealed = sealConnection(connection, owner, SECRET);
    expect(openConnection(sealed, owner, SECRET, now)).toEqual(connection);
  });

  it("never shows the token in the sealed value", () => {
    const sealed = sealConnection(connection, owner, SECRET);
    expect(sealed).not.toContain("EAAG");
    expect(sealed).not.toContain("hoteldepot");
    expect(sealed).toMatch(/^v1\.[A-Za-z0-9_-]+$/);
  });

  it("gives a different value each time", () => {
    expect(sealConnection(connection, owner, SECRET)).not.toBe(sealConnection(connection, owner, SECRET));
  });

  it("reads as not connected for another account or business", () => {
    const sealed = sealConnection(connection, owner, SECRET);
    expect(openConnection(sealed, { ...owner, email: "someone@else.com" }, SECRET, now)).toBeNull();
    expect(openConnection(sealed, { ...owner, businessId: "hospitality-emporium" }, SECRET, now)).toBeNull();
  });

  it("reads as not connected with another secret, when changed, or when malformed", () => {
    const sealed = sealConnection(connection, owner, SECRET);
    expect(openConnection(sealed, owner, "t".repeat(43), now)).toBeNull();
    const middle = Math.floor(sealed.length / 2);
    const changed = sealed.slice(0, middle) + (sealed[middle] === "A" ? "B" : "A") + sealed.slice(middle + 1);
    expect(openConnection(changed, owner, SECRET, now)).toBeNull();
    for (const bad of [undefined, "", "v1.", "v2.abc", "not-a-token", "v1.!!!!"]) {
      expect(openConnection(bad, owner, SECRET, now)).toBeNull();
    }
  });

  it("reads as not connected once the token has expired", () => {
    const sealed = sealConnection(connection, owner, SECRET);
    expect(openConnection(sealed, owner, SECRET, connection.expiresAt + 1)).toBeNull();
  });
});
