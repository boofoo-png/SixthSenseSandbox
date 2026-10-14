import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import AnalyticsPage from "./page";

afterEach(cleanup);

describe("Analytics page", () => {
  it("says exactly which dates this week and last week cover", () => {
    render(<AnalyticsPage />);
    expect(screen.getByText(/This week \(Oct 4 - 10, so far Sun - Fri\) compared with the same days last week \(Sep 27 - Oct 2\)\./)).toBeDefined();
  });

  it("renders the heading", () => {
    render(<AnalyticsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Analytics" })).toBeDefined();
  });

  it("renders the four KPI tiles", () => {
    render(<AnalyticsPage />);
    for (const label of ["Impressions", "Engagements", "Engagement rate", "Followers"]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("renders the plain-language summary from the sample data", () => {
    render(<AnalyticsPage />);
    expect(screen.getByRole("heading", { level: 2, name: "This week in plain English" })).toBeDefined();
    for (const line of buildSummary(createSampleData())) {
      expect(screen.getByText(line)).toBeDefined();
    }
  });
});

describe("Analytics page dates", () => {
  afterEach(() => {
    vi.setSystemTime(new Date(2026, 9, 9, 12));
  });

  it("follows today's date", () => {
    vi.setSystemTime(new Date(2026, 10, 20, 9));
    render(<AnalyticsPage />);
    expect(screen.getByText(/This week \(Nov 15 - 21, so far Sun - Fri\)/)).toBeDefined();
  });
});
