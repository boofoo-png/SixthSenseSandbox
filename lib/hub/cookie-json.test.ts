import { describe, expect, it } from "vitest";
import { MAX_COOKIE_VALUE, decodeCookieJson, encodeCookieJson } from "./cookie-json";

const isPoint = (value: unknown): value is { x: number } =>
  typeof value === "object" && value !== null && typeof (value as { x: unknown }).x === "number";

describe("cookie JSON", () => {
  it("round-trips a value that passes the check", () => {
    const encoded = encodeCookieJson({ x: 1 });
    expect(encoded).not.toBeNull();
    expect(decodeCookieJson(encoded ?? undefined, isPoint)).toEqual({ x: 1 });
  });

  it("refuses to write a value too big for a cookie", () => {
    expect(encodeCookieJson({ x: "y".repeat(MAX_COOKIE_VALUE) })).toBeNull();
  });

  it("returns null for missing, corrupted, or wrongly shaped values", () => {
    expect(decodeCookieJson(undefined, isPoint)).toBeNull();
    expect(decodeCookieJson("not base64 json", isPoint)).toBeNull();
    expect(decodeCookieJson(encodeCookieJson({ x: "nope" }) ?? undefined, isPoint)).toBeNull();
  });
});
