import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword", () => {
  it("never stores the password as typed", () => {
    const stored = hashPassword("correct horse");
    expect(stored).not.toContain("correct horse");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("uses a fresh salt each time", () => {
    expect(hashPassword("correct horse")).not.toBe(hashPassword("correct horse"));
  });
});

describe("verifyPassword", () => {
  it("accepts the right password", () => {
    expect(verifyPassword("correct horse", hashPassword("correct horse"))).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("wrong horse", hashPassword("correct horse"))).toBe(false);
  });

  it("rejects malformed stored values instead of throwing", () => {
    expect(verifyPassword("anything", "")).toBe(false);
    expect(verifyPassword("anything", "scrypt$nothex$zz")).toBe(false);
    expect(verifyPassword("anything", "md5$abc$def")).toBe(false);
  });
});
