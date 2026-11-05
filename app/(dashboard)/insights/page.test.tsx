import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { comparePeriods } from "@/lib/analytics/kpis";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { buildSummary } from "@/lib/analytics/summary";
import { SCHEDULE_KEY } from "@/lib/reports/insights";
import { dataRange, pageDates, resolveDateRange, type SearchParams } from "@/lib/date-range";
import { resetScheduleForTests } from "./_components/export-panel";
import ReportsPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/insights", useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  window.localStorage.clear();
  resetScheduleForTests();
});
afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
const TODAY = "2026-10-09";

async function renderPage(params: SearchParams = {}) {
  render(await ReportsPage({ searchParams: Promise.resolve(params) } as PageProps<"/insights">));
}

function expectedFor(params: SearchParams) {
  const resolved = resolveDateRange(params, TODAY);
  const ranges = { current: resolved.current, comparison: resolved.comparison };
  return { ranges, rows: sampleDataBetween(dataRange(resolved)) };
}

const stat = (label: string) => screen.getByText(label).closest("article") as HTMLElement;

describe("Reports (Figma Make, with the app's sample data)", () => {
  it("has the Make's heading and says the numbers are samples", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Make every result easy to understand" })).toBeDefined();
    expect(screen.getByText(/these numbers show how reporting will work/)).toBeDefined();
  });

  it("shows clicks, impressions, followers, and engagement, compared with the last period", async () => {
    await renderPage({ period: "last-30-days" });
    const { rows, ranges } = expectedFor({ period: "last-30-days" });
    const { current } = comparePeriods(rows, ranges);
    expect(within(stat("Total clicks")).getByText(current.clicks >= 1000 ? `${Number((current.clicks / 1000).toFixed(1))}K` : String(current.clicks))).toBeDefined();
    for (const label of ["Total clicks", "Impressions", "Followers", "Engagement"]) {
      expect(within(stat(label)).getByText(/from last period|No earlier data/)).toBeDefined();
    }
  });

  it("charts clicks by week for longer ranges and by day for short ones", async () => {
    await renderPage({ period: "last-30-days" });
    const chart = screen.getByRole("figure");
    expect(within(chart).getAllByRole("listitem")[0].textContent).toMatch(/W1: \d+ clicks/);
    cleanup();
    await renderPage({ period: "last-7-days" });
    expect(within(screen.getByRole("figure")).getAllByRole("listitem")).toHaveLength(7);
  });

  it("writes the summary from the numbers, labelled as templates", async () => {
    await renderPage();
    const dates = pageDates({}, TODAY);
    const first = buildSummary(sampleDataBetween(dates.dataRange), {
      ranges: dates.ranges,
      currentPhrase: `during ${dates.currentLabel}`,
      comparisonPhrase: dates.comparisonLabel,
    })[0];
    const panel = screen.getByRole("region", { name: /^Marketing performance/ });
    expect(within(panel).getByText(first)).toBeDefined();
    expect(within(panel).getByText(/not live AI/)).toBeDefined();
  });

  it("exports a PDF through the printable report, keeping the dates", async () => {
    await renderPage({ period: "last-30-days" });
    const panel = screen.getByRole("region", { name: "Share this report" });
    expect(within(panel).getByRole("link", { name: /PDF report/ }).getAttribute("href")).toBe("/reports?period=last-30-days");
    expect(within(panel).getByRole("button", { name: /Presentation/ }).hasAttribute("disabled")).toBe(true);
  });

  it("downloads the numbers as CSV", async () => {
    const createObjectURL = vi.fn(() => "blob:report");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: /CSV data/ }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(screen.getByText(/^Downloaded sixth-sense-report-/)).toBeDefined();
  });

  it("schedules a monthly export in the browser", async () => {
    await renderPage();
    const button = screen.getByRole("button", { name: "Schedule monthly export" });
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Monthly export scheduled" }).getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(window.localStorage.getItem(SCHEDULE_KEY) ?? "{}").since).toBe(TODAY);
  });

  it("offers last month's report once a new month has started since scheduling", async () => {
    window.localStorage.setItem(SCHEDULE_KEY, JSON.stringify({ version: 1, since: "2026-09-12", lastReady: null }));
    await renderPage();
    expect(screen.getByText("Your monthly report for September 2026 is ready.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Download September 2026 as CSV" })).toBeDefined();
  });
});
