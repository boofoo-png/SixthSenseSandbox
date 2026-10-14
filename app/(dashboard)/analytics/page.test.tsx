import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import { dataRange, resolveDateRange, type SearchParams } from "@/lib/date-range";
import AnalyticsPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/analytics", useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
const TODAY = "2026-10-09";

async function renderPage(params: SearchParams = {}) {
  render(await AnalyticsPage({ searchParams: Promise.resolve(params) } as PageProps<"/analytics">));
}

describe("Analytics page", () => {
  it("renders the heading and the date bar", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Analytics" })).toBeDefined();
    expect(screen.getByText("Showing Oct 4 - 9 compared with Sep 27 - Oct 2.")).toBeDefined();
  });

  it("renders the four KPI tiles", async () => {
    await renderPage();
    const metrics = screen.getByRole("region", { name: "Key metrics" });
    for (const label of ["Impressions", "Engagements", "Engagement rate", "Followers"]) {
      expect(within(metrics).getByText(label)).toBeDefined();
    }
  });

  it("renders the plain-language summary for the chosen dates", async () => {
    const params = { period: "last-7-days" };
    await renderPage(params);
    expect(screen.getByRole("heading", { level: 2, name: "In plain English" })).toBeDefined();
    const resolved = resolveDateRange(params, TODAY);
    const lines = buildSummary(sampleDataBetween(dataRange(resolved)), {
      ranges: { current: resolved.current, comparison: resolved.comparison },
      currentPhrase: "during Oct 3 - 9",
      comparisonPhrase: "Sep 26 - Oct 2",
    });
    for (const line of lines) {
      expect(screen.getByText(line)).toBeDefined();
    }
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
