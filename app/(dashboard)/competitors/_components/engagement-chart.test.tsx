import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { WeeklyEngagement } from "@/lib/competitors/activity";
import { EngagementChart } from "./engagement-chart";

afterEach(cleanup);

const data: WeeklyEngagement = {
  weeks: [
    { start: "2026-09-20", end: "2026-09-26" },
    { start: "2026-09-27", end: "2026-10-03" },
    { start: "2026-10-04", end: "2026-10-10" },
  ],
  series: [
    { competitor: { slug: "alpha", name: "Alpha Cafe", handle: "@a" }, rates: [0.04, 0.05, 0.06] },
    { competitor: { slug: "beta", name: "Beta Bakery", handle: "@b" }, rates: [0.08, null, 0.07] },
  ],
};

describe("EngagementChart", () => {
  it("is a labelled figure with a heading", () => {
    render(<EngagementChart data={data} />);
    expect(screen.getByRole("figure", { name: "Engagement rate by week" })).toBeDefined();
  });

  it("draws one line per competitor", () => {
    const { container } = render(<EngagementChart data={data} />);
    expect(container.querySelectorAll("path[data-series]")).toHaveLength(2);
  });

  it("has a legend naming each competitor with its latest value", () => {
    render(<EngagementChart data={data} />);
    const legend = screen.getByRole("list", { name: "Legend" });
    const items = within(legend).getAllByRole("listitem").map((item) => item.textContent);
    expect(items).toEqual(["Alpha Cafe6.0%", "Beta Bakery7.0%"]);
  });

  it("gives every data point a hover label", () => {
    const { container } = render(<EngagementChart data={data} />);
    const titles = [...container.querySelectorAll("svg title")].map((t) => t.textContent);
    expect(titles).toContain("Alpha Cafe, week of Oct 4: 6.0%");
    expect(titles).toContain("Beta Bakery, week of Sep 20: 8.0%");
    // Five points: Beta has no posts in the middle week.
    expect(titles).toHaveLength(5);
  });

  it("offers the same data as a table", () => {
    render(<EngagementChart data={data} />);
    const table = screen.getByRole("table", { name: "Engagement rate by week (table)" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Competitor", "Week of Sep 20", "Week of Sep 27", "Week of Oct 4"]);
    const beta = within(table).getByRole("row", { name: /Beta Bakery/ });
    expect(within(beta).getAllByRole("cell").map((c) => c.textContent)).toEqual(["8.0%", "No posts", "7.0%"]);
  });

  it("shows a message instead of an empty chart when there is no data", () => {
    render(<EngagementChart data={{ weeks: [], series: [] }} />);
    expect(screen.getByText("No competitor posts to chart yet.")).toBeDefined();
  });
});
