import { describe, expect, it } from "vitest";
import { RESET_LIFETIME_MS, checkResetToken, createReset, decodeReset, encodeReset } from "./reset";

const NOW = new Date("2026-10-29T12:00:00Z").getTime();

describe("password reset links", () => {
  it("creates a token that only works for the email it was made for, until it expires", () => {
    const { token, stored } = createReset("jordan@example.com", NOW);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(checkResetToken(stored, token, NOW + RESET_LIFETIME_MS - 1)).toBe("jordan@example.com");
    expect(checkResetToken(stored, token, NOW + RESET_LIFETIME_MS + 1)).toBeNull();
  });

  it("rejects a wrong or missing token", () => {
    const { stored } = createReset("jordan@example.com", NOW);
    expect(checkResetToken(stored, "0".repeat(64), NOW)).toBeNull();
    expect(checkResetToken(stored, "", NOW)).toBeNull();
    expect(checkResetToken(null, "anything", NOW)).toBeNull();
  });

  it("keeps only a hash of the token in the cookie", () => {
    const { token, stored } = createReset("jordan@example.com", NOW);
    const value = encodeReset(stored);
    expect(Buffer.from(value, "base64url").toString()).not.toContain(token);
    expect(decodeReset(value)).toEqual(stored);
    expect(decodeReset("garbage")).toBeNull();
  });

  it("lasts 15 minutes", () => {
    expect(RESET_LIFETIME_MS).toBe(15 * 60 * 1000);
  });
});
