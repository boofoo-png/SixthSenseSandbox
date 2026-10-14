import { describe, expect, it } from "vitest";
import { linePath, linearScale, niceAxis, spreadLabels, ticks } from "./scale";

describe("niceAxis", () => {
  it("picks a round step and a maximum that is a whole number of steps", () => {
    expect(niceAxis(0.103)).toEqual({ max: 0.15, step: 0.05 });
    expect(niceAxis(0.085)).toEqual({ max: 0.1, step: 0.025 });
    expect(niceAxis(0.021)).toEqual({ max: 0.03, step: 0.01 });
  });

  it("returns a usable axis for zero data", () => {
    const axis = niceAxis(0);
    expect(axis.max).toBeGreaterThan(0);
    expect(axis.step).toBeGreaterThan(0);
  });
});

describe("ticks", () => {
  it("splits 0..max into evenly spaced ticks", () => {
    expect(ticks(0.1, 4).map((t) => Number(t.toFixed(3)))).toEqual([0, 0.025, 0.05, 0.075, 0.1]);
  });
});

describe("linearScale", () => {
  it("maps a domain onto a range, including inverted ranges for SVG y", () => {
    const y = linearScale([0, 0.1], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(0.05)).toBe(100);
    expect(y(0.1)).toBe(0);
  });

  it("handles a zero-width domain without dividing by zero", () => {
    expect(linearScale([5, 5], [0, 100])(5)).toBe(0);
  });
});

describe("linePath", () => {
  it("draws a path through the points", () => {
    expect(linePath([{ x: 0, y: 10 }, { x: 50, y: 20 }, { x: 100, y: 5 }])).toBe("M0,10L50,20L100,5");
  });

  it("breaks the line where a value is missing", () => {
    expect(linePath([{ x: 0, y: 10 }, null, { x: 100, y: 5 }, { x: 150, y: 8 }])).toBe("M0,10M100,5L150,8");
  });

  it("returns an empty path when there are no points", () => {
    expect(linePath([null, null])).toBe("");
  });
});

describe("spreadLabels", () => {
  it("keeps labels at their positions when they do not overlap", () => {
    expect(spreadLabels([10, 50, 90], 14)).toEqual([10, 50, 90]);
  });

  it("spreads overlapping labels evenly around their midpoint, keeping their order", () => {
    // 45 and 50 overlap: centred on 47.5 and 14 apart.
    expect(spreadLabels([50, 45, 100], 14)).toEqual([54.5, 40.5, 100]);
  });

  it("merges clusters that grow into each other", () => {
    const placed = spreadLabels([10, 12, 30, 32], 10);
    const sorted = [...placed].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBeGreaterThanOrEqual(10 - 1e-9);
    }
  });

  it("keeps labels inside the bounds", () => {
    const placed = spreadLabels([2, 3], 14, 0, 100);
    expect(placed[0]).toBeGreaterThanOrEqual(0);
    expect(Math.abs(placed[0] - placed[1])).toBeGreaterThanOrEqual(14);
  });
});
