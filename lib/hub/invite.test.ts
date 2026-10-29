import { describe, expect, it } from "vitest";
import { decodeInvite, inviteLinkFor } from "./invite";

describe("invite links", () => {
  it("names the company that sent it", () => {
    const link = inviteLinkFor("http://localhost:3000", "Harbourline Supply Co.");
    const url = new URL(link);
    expect(url.pathname).toBe("/create-account");
    expect(decodeInvite(url.searchParams.get("invite") ?? undefined)).toEqual({ company: "Harbourline Supply Co." });
  });

  it("ignores missing, broken, or oversized codes", () => {
    expect(decodeInvite(undefined)).toBeNull();
    expect(decodeInvite("garbage")).toBeNull();
    expect(decodeInvite(Buffer.from(JSON.stringify({ company: "x".repeat(101) })).toString("base64url"))).toBeNull();
  });
});
