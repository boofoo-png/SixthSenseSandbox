import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { comparePeriods } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import OverviewPage from "./page";

afterEach(cleanup);

describe("Overview page", () => {
  it("renders the heading", () => {
    render(<OverviewPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Overview" })).toBeDefined();
  });

  it("renders the four KPI tiles and the plain-English summary", () => {
    render(<OverviewPage />);
    const metrics = screen.getByRole("region", { name: "Key metrics" });
    for (const label of ["Impressions", "Engagements", "Engagement rate", "Followers"]) {
      expect(within(metrics).getByText(label)).toBeDefined();
    }
    for (const line of buildSummary(createSampleData())) {
      expect(screen.getByText(line)).toBeDefined();
    }
  });

  it("shows market highlights with clicks and click-through rate", () => {
    render(<OverviewPage />);
    const { current } = comparePeriods(createSampleData());
    const highlights = screen.getByRole("region", { name: "Market highlights" });
    expect(within(highlights).getByText(new Intl.NumberFormat("en-US").format(current.clicks))).toBeDefined();
    expect(within(highlights).getByText(formatPercent(current.clickThroughRate, 2))).toBeDefined();
  });

  it("compares platforms in a table", () => {
    render(<OverviewPage />);
    const table = screen.getByRole("table", { name: "Platform comparison" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Platform", "Impressions", "Engagement rate", "Change vs last week"]);
    for (const platform of ["Instagram", "Facebook", "TikTok", "LinkedIn"]) {
      expect(within(table).getByRole("rowheader", { name: platform })).toBeDefined();
    }
  });

  it("shows coming soon cards for competitor activity and trends", () => {
    render(<OverviewPage />);
    const competitors = screen.getByRole("region", { name: "Competitor activity" });
    expect(within(competitors).getByText("Coming soon")).toBeDefined();
    expect(within(competitors).getByRole("link").getAttribute("href")).toBe("/competitors");
    const trends = screen.getByRole("region", { name: "Trends" });
    expect(within(trends).getByText("Coming soon")).toBeDefined();
  });

  it("links to the full analytics page", () => {
    render(<OverviewPage />);
    expect(screen.getByRole("link", { name: "View full analytics" }).getAttribute("href")).toBe("/analytics");
  });
});
