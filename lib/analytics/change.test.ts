import { describe, expect, it } from "vitest";
import { isNoticeable, roundPercent } from "./change";

describe("roundPercent", () => {
  it("converts a fraction to a whole percent", () => {
    expect(roundPercent(0.124)).toBe(12);
    expect(roundPercent(-0.08)).toBe(-8);
  });

  it("rounds halves away from zero for both signs, so up and down match", () => {
    expect(roundPercent(0.125)).toBe(13);
    expect(roundPercent(-0.125)).toBe(-13);
  });

  it("is not thrown off by floating-point noise", () => {
    // 0.07 / 0.08 - 1 is -0.12499999999999997 in floating point.
    expect(roundPercent(0.07 / 0.08 - 1)).toBe(-13);
  });

  it("never returns negative zero", () => {
    expect(Object.is(roundPercent(-0.001), 0)).toBe(true);
  });
});

describe("isNoticeable", () => {
  it("treats changes that round to 5% or more as noticeable", () => {
    expect(isNoticeable(0.05)).toBe(true);
    expect(isNoticeable(-0.049)).toBe(true);
    expect(isNoticeable(0.044)).toBe(false);
    expect(isNoticeable(-0.02)).toBe(false);
  });
});
