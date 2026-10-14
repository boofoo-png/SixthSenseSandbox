import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { PeriodComparison } from "@/lib/analytics/kpis";
import { KpiTiles } from "./kpi-tiles";
import { SummaryCard } from "./summary-card";

afterEach(cleanup);

const comparison: PeriodComparison = {
  current: {
    impressions: 48200,
    engagements: 3150,
    clicks: 420,
    followers: 12400,
    engagementRate: 0.0654,
    clickThroughRate: 0.0087,
  },
  previous: {
    impressions: 40000,
    engagements: 3000,
    clicks: 400,
    followers: 12000,
    engagementRate: 0.075,
    clickThroughRate: 0.01,
  },
  change: {
    impressions: 0.205,
    engagements: 0.05,
    clicks: 0.05,
    followers: 0.033,
    engagementRate: -0.128,
    clickThroughRate: -0.13,
  },
};

describe("KpiTiles", () => {
  it("shows the four headline KPIs with formatted values", () => {
    render(<KpiTiles comparison={comparison} />);
    expect(screen.getByText("Impressions")).toBeDefined();
    expect(screen.getByText("48,200")).toBeDefined();
    expect(screen.getByText("Engagements")).toBeDefined();
    expect(screen.getByText("3,150")).toBeDefined();
    expect(screen.getByText("Engagement rate")).toBeDefined();
    expect(screen.getByText("6.5%")).toBeDefined();
    expect(screen.getByText("Followers")).toBeDefined();
    expect(screen.getByText("12,400")).toBeDefined();
  });

  it("shows each KPI's change vs the comparison period", () => {
    render(<KpiTiles comparison={comparison} compareLabel="Oct 4 - 6" />);
    expect(screen.getByText("+21% vs Oct 4 - 6")).toBeDefined();
    expect(screen.getByText("-13% vs Oct 4 - 6")).toBeDefined();
  });
});

describe("SummaryCard", () => {
  it("shows the heading and each summary line", () => {
    render(<SummaryCard lines={["First line.", "Second line."]} />);
    expect(screen.getByRole("heading", { level: 2, name: "In plain English" })).toBeDefined();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "First line.",
      "Second line.",
    ]);
  });
});
