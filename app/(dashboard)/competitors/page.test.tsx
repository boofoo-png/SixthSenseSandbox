import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SAMPLE_COMPETITORS } from "@/lib/competitors/sample-data";
import CompetitorsPage from "./page";

afterEach(cleanup);

describe("Competitors page", () => {
  it("renders the heading and a sample data notice", () => {
    render(<CompetitorsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Competitors" })).toBeDefined();
    expect(screen.getByText(/Sample data: these competitors are fictional businesses/)).toBeDefined();
  });

  it("says exactly which dates this week and last week cover", () => {
    render(<CompetitorsPage />);
    // The test clock is Fri 2026-10-09, so the week is Sun Oct 4 - Sat Oct 10.
    expect(screen.getByText(/This week \(Oct 4 - 10, so far Sun - Fri\) compared with the same days last week \(Sep 27 - Oct 2\)\./)).toBeDefined();
  });

  it("compares competitors in a table", () => {
    render(<CompetitorsPage />);
    const table = screen.getByRole("table", { name: "Competitor comparison" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual([
      "Competitor",
      "Posts this week",
      "Engagement rate",
      "Change vs last week",
      "Active ads",
    ]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(SAMPLE_COMPETITORS.length);
  });

  it("shows the engagement-over-time chart for every competitor", () => {
    const { container } = render(<CompetitorsPage />);
    expect(screen.getByRole("figure", { name: "Engagement rate by week" })).toBeDefined();
    expect(container.querySelectorAll("path[data-series]")).toHaveLength(SAMPLE_COMPETITORS.length);
  });

  it("links each competitor to its detail page", () => {
    render(<CompetitorsPage />);
    const table = screen.getByRole("table", { name: "Competitor comparison" });
    for (const competitor of SAMPLE_COMPETITORS) {
      const link = within(table).getByRole("link", { name: competitor.name });
      expect(link.getAttribute("href")).toBe(`/competitors/${competitor.slug}`);
    }
  });
});

describe("Competitors page dates", () => {
  afterEach(() => {
    vi.setSystemTime(new Date(2026, 9, 9, 12));
  });

  it("follows today's date", () => {
    vi.setSystemTime(new Date(2026, 10, 20, 9));
    render(<CompetitorsPage />);
    expect(screen.getByText(/This week \(Nov 15 - 21, so far Sun - Fri\)/)).toBeDefined();
  });
});
