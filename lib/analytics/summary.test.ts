import { describe, expect, it } from "vitest";
import { formatPercent } from "./summary";

describe("formatPercent", () => {
  it("shows a whole percent without a sign", () => {
    expect(formatPercent(0.1234)).toBe("12%");
    expect(formatPercent(-0.0756)).toBe("8%");
  });

  it("can show decimals", () => {
    expect(formatPercent(-0.0756, 1)).toBe("7.6%");
  });

  it("rounds halves up", () => {
    expect(formatPercent(0.125)).toBe("13%");
  });
});
