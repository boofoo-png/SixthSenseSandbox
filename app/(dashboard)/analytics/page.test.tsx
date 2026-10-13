import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import AnalyticsPage from "./page";

afterEach(cleanup);

describe("Analytics page", () => {
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
