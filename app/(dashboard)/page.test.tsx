import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { comparePeriods } from "@/lib/analytics/kpis";
import { createSampleData } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { competitorActivity, competitorHighlights } from "@/lib/competitors/activity";
import {
  SAMPLE_COMPETITORS,
  SAMPLE_TRENDS,
  createSampleAds,
  createSamplePosts,
} from "@/lib/competitors/sample-data";
import { topTrends } from "@/lib/competitors/trends";
import OverviewPage from "./page";

afterEach(cleanup);

describe("Overview page", () => {
  it("says exactly which dates this week and last week cover", () => {
    render(<OverviewPage />);
    // The test clock is Fri 2026-10-09, so the week is Sun Oct 4 - Sat Oct 10.
    expect(screen.getByText(/This week \(Oct 4 - 10, so far Sun - Fri\) compared with the same days last week \(Sep 27 - Oct 2\)\./)).toBeDefined();
  });

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

  it("shows competitor activity highlights", () => {
    render(<OverviewPage />);
    const competitors = screen.getByRole("region", { name: "Competitor activity" });
    const highlights = competitorHighlights(
      competitorActivity(SAMPLE_COMPETITORS, createSamplePosts(), createSampleAds()),
    );
    const mostActive = highlights.mostActive!;
    expect(
      within(competitors).getByText(
        `Most active: ${mostActive.competitor.name} (${mostActive.postsThisWeek} posts this week)`,
      ),
    ).toBeDefined();
    const best = highlights.bestEngagement!;
    expect(
      within(competitors).getByText(
        `Best engagement: ${best.competitor.name} (${formatPercent(best.engagementRate, 1)})`,
      ),
    ).toBeDefined();
    expect(
      within(competitors).getByText(
        `Ads running: ${highlights.activeAds} across ${highlights.competitorsWithAds} competitors`,
      ),
    ).toBeDefined();
    expect(within(competitors).getByRole("link", { name: "Compare competitors" }).getAttribute("href")).toBe(
      "/competitors",
    );
    expect(within(competitors).queryByText("Coming soon")).toBeNull();
  });

  it("shows the top trends with relevant ones marked", () => {
    render(<OverviewPage />);
    const trends = screen.getByRole("region", { name: "Trends" });
    const items = within(trends).getAllByRole("listitem");
    const expected = topTrends(SAMPLE_TRENDS);
    expect(items).toHaveLength(expected.length);
    expect(items[0].textContent).toContain(expected[0].label);
    expect(items[0].textContent).toContain(`+${formatPercent(expected[0].growth)}`);
    expect(within(trends).getAllByText("Relevant to you").length).toBe(
      expected.filter((t) => t.relevant).length,
    );
    expect(within(trends).queryByText("Coming soon")).toBeNull();
  });

  it("links to the full analytics page", () => {
    render(<OverviewPage />);
    expect(screen.getByRole("link", { name: "View full analytics" }).getAttribute("href")).toBe("/analytics");
  });
});

describe("Overview page dates", () => {
  afterEach(() => {
    vi.setSystemTime(new Date(2026, 9, 9, 12));
  });

  it("follows today's date", () => {
    vi.setSystemTime(new Date(2026, 10, 20, 9));
    render(<OverviewPage />);
    expect(screen.getByText(/This week \(Nov 15 - 21, so far Sun - Fri\) compared with the same days last week \(Nov 8 - 13\)\./)).toBeDefined();
  });
});
