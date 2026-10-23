import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { formatPercent } from "@/lib/analytics/summary";
import { pageDates, type SearchParams } from "@/lib/date-range";
import { buildExecutiveReport } from "@/lib/reports/executive";
import ReportsPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/reports", useRouter: () => ({ push: vi.fn() }) }));

afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
const TODAY = "2026-10-09";

async function renderPage(params: SearchParams = {}) {
  render(await ReportsPage({ searchParams: Promise.resolve(params) } as PageProps<"/reports">));
}

function expected(params: SearchParams) {
  const dates = pageDates(params, TODAY);
  return buildExecutiveReport(sampleDataBetween(dates.dataRange), {
    ranges: dates.ranges,
    currentPhrase: `during ${dates.currentLabel}`,
    comparisonPhrase: dates.comparisonLabel,
  });
}

function report() {
  return screen.getByRole("region", { name: "Executive overview" });
}

describe("Reports page", () => {
  it("replaces the coming soon page with the executive overview and date bar", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Reports" })).toBeDefined();
    expect(screen.queryByText("Coming soon")).toBeNull();
    expect(screen.getByRole("region", { name: "Date range" })).toBeDefined();
    expect(report()).toBeDefined();
  });

  it("states the period, the comparison, and when it was prepared", async () => {
    await renderPage({ period: "last-30-days", compare: "last-year" });
    expect(within(report()).getByText("Period: Sep 10 - Oct 9, 2026")).toBeDefined();
    expect(within(report()).getByText("Compared with: Sep 10 - Oct 9, 2025")).toBeDefined();
    expect(within(report()).getByText("Prepared on: Oct 9, 2026")).toBeDefined();
  });

  it("shows the headline tiles, what changed, the best platform, and the summary", async () => {
    await renderPage();
    const data = expected({});
    expect(within(report()).getByRole("region", { name: "Key metrics" })).toBeDefined();
    const changes = within(report()).getByRole("region", { name: "What changed" });
    for (const line of data.changes) {
      expect(within(changes).getByText(line)).toBeDefined();
    }
    const best = within(report()).getByRole("region", { name: "Best platform" });
    expect(
      within(best).getByText(
        `${PLATFORM_LABELS[data.bestPlatform!.platform]}: ${formatPercent(data.bestPlatform!.engagementRate, 1)} engagement rate`,
      ),
    ).toBeDefined();
    for (const line of data.summary) {
      expect(within(report()).getByText(line)).toBeDefined();
    }
  });

  it("has a print button and hides the controls when printing", async () => {
    await renderPage();
    expect(screen.getByRole("button", { name: "Print / Save as PDF" }).closest(".print\\:hidden")).not.toBeNull();
    expect(screen.getByRole("region", { name: "Date range" }).closest(".print\\:hidden")).not.toBeNull();
    expect(report().closest(".print\\:hidden")).toBeNull();
  });

  it("says it uses sample data", async () => {
    await renderPage();
    expect(within(report()).getByText(/Sample data/)).toBeDefined();
  });
});
