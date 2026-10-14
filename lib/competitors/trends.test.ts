import { describe, expect, it } from "vitest";
import { topTrends } from "./trends";
import type { Trend } from "./types";

function trend(label: string, growth: number, relevant: boolean): Trend {
  return { label, kind: "topic", source: "social", growth, relevant };
}

describe("topTrends", () => {
  const trends = [
    trend("a", 0.2, true),
    trend("b", 2.5, false),
    trend("c", 0.9, true),
    trend("d", 0.1, false),
  ];

  it("puts relevant trends first, each group sorted by growth", () => {
    expect(topTrends(trends).map((t) => t.label)).toEqual(["c", "a", "b", "d"]);
  });

  it("limits the number of trends", () => {
    expect(topTrends(trends, 2).map((t) => t.label)).toEqual(["c", "a"]);
  });

  it("does not change the input order", () => {
    topTrends(trends);
    expect(trends.map((t) => t.label)).toEqual(["a", "b", "c", "d"]);
  });
});
