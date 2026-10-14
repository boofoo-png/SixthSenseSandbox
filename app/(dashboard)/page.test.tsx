import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { comparePeriods } from "@/lib/analytics/kpis";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { buildSummary, formatPercent } from "@/lib/analytics/summary";
import { competitorActivity, competitorHighlights } from "@/lib/competitors/activity";
import {
  SAMPLE_COMPETITORS,
  SAMPLE_TRENDS,
  createSampleAds,
  samplePostsBetween,
} from "@/lib/competitors/sample-data";
import { topTrends } from "@/lib/competitors/trends";
import { dataRange, resolveDateRange, type SearchParams } from "@/lib/date-range";
import OverviewPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
const TODAY = "2026-10-09";

async function renderPage(params: SearchParams = {}) {
  render(await OverviewPage({ searchParams: Promise.resolve(params) } as PageProps<"/">));
}

function expectedFor(params: SearchParams) {
  const resolved = resolveDateRange(params, TODAY);
  const ranges = { current: resolved.current, comparison: resolved.comparison };
  return { resolved, ranges, rows: sampleDataBetween(dataRange(resolved)) };
}

describe("Overview page", () => {
  it("renders the heading and the date bar with the default dates", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Overview" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Date range" })).toBeDefined();
    expect(screen.getByText("Showing Oct 4 - 9 compared with Sep 27 - Oct 2.")).toBeDefined();
  });

  it("renders the four KPI tiles, compared with the chosen period", async () => {
    await renderPage();
    const metrics = screen.getByRole("region", { name: "Key metrics" });
    for (const label of ["Impressions", "Engagements", "Engagement rate", "Followers"]) {
      expect(within(metrics).getByText(label)).toBeDefined();
    }
    expect(within(metrics).getAllByText(/vs Sep 27 - Oct 2$/).length).toBeGreaterThan(0);
  });

  it("renders the plain-English summary for the chosen dates", async () => {
    await renderPage();
    const { ranges, rows } = expectedFor({});
    const lines = buildSummary(rows, { ranges, currentPhrase: "during Oct 4 - 9", comparisonPhrase: "Sep 27 - Oct 2" });
    for (const line of lines) {
      expect(screen.getByText(line)).toBeDefined();
    }
  });

  it("follows the dates picked in the address", async () => {
    await renderPage({ period: "last-30-days", compare: "last-year" });
    expect(screen.getByText("Showing Sep 10 - Oct 9, 2026 compared with Sep 10 - Oct 9, 2025.")).toBeDefined();
    const { ranges, rows } = expectedFor({ period: "last-30-days", compare: "last-year" });
    const { current } = comparePeriods(rows, ranges);
    const metrics = screen.getByRole("region", { name: "Key metrics" });
    expect(within(metrics).getByText(new Intl.NumberFormat("en-US").format(current.impressions))).toBeDefined();
  });

  it("shows market highlights with clicks and click-through rate", async () => {
    await renderPage();
    const { ranges, rows } = expectedFor({});
    const { current } = comparePeriods(rows, ranges);
    const highlights = screen.getByRole("region", { name: "Market highlights" });
    expect(within(highlights).getByText(new Intl.NumberFormat("en-US").format(current.clicks))).toBeDefined();
    expect(within(highlights).getByText(formatPercent(current.clickThroughRate, 2))).toBeDefined();
  });

  it("compares platforms in a table", async () => {
    await renderPage();
    const table = screen.getByRole("table", { name: "Platform comparison" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Platform", "Impressions", "Engagement rate", "Change"]);
    for (const platform of ["Instagram", "Facebook", "TikTok", "LinkedIn"]) {
      expect(within(table).getByRole("rowheader", { name: platform })).toBeDefined();
    }
  });

  it("shows competitor activity highlights for the chosen dates", async () => {
    await renderPage();
    const { resolved, ranges } = expectedFor({});
    const highlights = competitorHighlights(
      competitorActivity(SAMPLE_COMPETITORS, samplePostsBetween(dataRange(resolved)), createSampleAds(TODAY), ranges),
    );
    const competitors = screen.getByRole("region", { name: "Competitor activity" });
    const mostActive = highlights.mostActive!;
    expect(
      within(competitors).getByText(`Most active: ${mostActive.competitor.name} (${mostActive.postsThisWeek} posts)`),
    ).toBeDefined();
    const best = highlights.bestEngagement!;
    expect(
      within(competitors).getByText(`Best engagement: ${best.competitor.name} (${formatPercent(best.engagementRate, 1)})`),
    ).toBeDefined();
    expect(
      within(competitors).getByText(`Ads running: ${highlights.activeAds} across ${highlights.competitorsWithAds} competitors`),
    ).toBeDefined();
  });

  it("shows the top trends with relevant ones marked", async () => {
    await renderPage();
    const trends = screen.getByRole("region", { name: "Trends" });
    const items = within(trends).getAllByRole("listitem");
    const expected = topTrends(SAMPLE_TRENDS);
    expect(items).toHaveLength(expected.length);
    expect(items[0].textContent).toContain(expected[0].label);
    expect(within(trends).getAllByText("Relevant to you").length).toBe(expected.filter((t) => t.relevant).length);
  });

  it("keeps the chosen dates in its links", async () => {
    await renderPage({ period: "last-7-days" });
    expect(screen.getByRole("link", { name: "View full analytics" }).getAttribute("href")).toBe("/analytics?period=last-7-days");
    expect(screen.getByRole("link", { name: "Compare competitors" }).getAttribute("href")).toBe("/competitors?period=last-7-days");
  });

  it("follows today's date", async () => {
    vi.setSystemTime(new Date(2026, 10, 20, 9));
    try {
      await renderPage();
      expect(screen.getByText("Showing Nov 15 - 20 compared with Nov 8 - 13.")).toBeDefined();
    } finally {
      vi.setSystemTime(new Date(2026, 9, 9, 12));
    }
  });
});
