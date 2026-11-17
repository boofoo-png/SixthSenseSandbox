import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import ReportsPage from "./page";

vi.mock("next/navigation", () => ({ usePathname: () => "/insights", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (name === "ss_session" ? { value: "demo@sixthsense.app" } : undefined) }) }));

afterEach(cleanup);

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
async function renderPage(params: Record<string, string> = {}) {
  render(await ReportsPage({ searchParams: Promise.resolve(params) } as PageProps<"/insights">));
}

describe("Reports (design file: Insights / Reports, sample ad data)", () => {
  it("has the design's heading and says the ad data is a sample", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Insights / Reports" })).toBeDefined();
    expect(screen.getByText(/Sample data for Sixth Sense: .*no ad accounts connected/)).toBeDefined();
  });

  it("shows the six KPI cards compared with last week, with details by platform", async () => {
    await renderPage();
    const cards = within(screen.getByRole("region", { name: "Key numbers" })).getAllByRole("article");
    expect(cards.map((card) => within(card).getByRole("heading").textContent)).toEqual(["Total Spend", "Revenue", "ROAS", "Impressions", "Conversions", "Clicks"]);
    expect(within(cards[2]).getByText(/×$/)).toBeDefined();
    expect(within(cards[0]).getByText("compared to last week")).toBeDefined();
    fireEvent.click(within(cards[0]).getByRole("button", { name: "Show Total Spend by platform" }));
    expect(within(cards[0]).getByText("Google")).toBeDefined();
    expect(within(cards[0]).getByText("Meta")).toBeDefined();
  });

  it("switches between 7 and 30 days", async () => {
    await renderPage();
    const period = screen.getByRole("navigation", { name: "Report period" });
    expect(within(period).getByRole("link", { name: "7 days" }).getAttribute("aria-current")).toBe("page");
    expect(within(period).getByRole("link", { name: "30 days" }).getAttribute("href")).toBe("/insights?period=last-30-days");
    cleanup();
    await renderPage({ period: "last-30-days" });
    expect(screen.getAllByText("compared to last 30 days").length).toBe(6);
    expect(screen.getByText("30 Days")).toBeDefined();
  });

  it("summarizes with a top performer, underperformer, and suggestion, and opens the full insight", async () => {
    await renderPage();
    const panel = screen.getByRole("region", { name: "AI Insights Summary" });
    expect(within(panel).getByText(/Reallocate 10% of spend/)).toBeDefined();
    expect(within(panel).getByText(/Peak Revenue/)).toBeDefined();
    const first = within(panel).getAllByText(/strongest ROAS|recorded your best day/)[0].textContent;
    fireEvent.click(within(panel).getByRole("button", { name: "Refresh the AI summary" }));
    expect(within(panel).getAllByText(/strongest ROAS|recorded your best day/)[0].textContent).not.toBe(first);
    fireEvent.click(within(panel).getByRole("button", { name: "View Full Insight" }));
    const full = within(panel).getByLabelText("Full insight");
    expect(within(full).getByText("What went well")).toBeDefined();
    expect(within(full).getByText("Revenue summary")).toBeDefined();
  });

  it("pins the top countries on the Make's world map", async () => {
    await renderPage();
    const panel = screen.getByRole("region", { name: "Performance By Country" });
    const map = within(panel).getByRole("list", { name: "Countries on the map, by revenue" });
    const pins = within(map).getAllByRole("listitem");
    expect(pins.map((pin) => pin.textContent?.replace(/\$[\d,]+$/, ""))).toEqual(["1. Canada", "2. United States", "3. United Kingdom", "4. Australia", "5. Germany"]);
    expect((pins[0] as HTMLElement).style.left).toBe("20%");
    expect(panel.querySelector('img[src="/reports/world-map.png"]')).not.toBeNull();
  });

  it("filters the map by metric and number of countries", async () => {
    await renderPage();
    const panel = screen.getByRole("region", { name: "Performance By Country" });
    const pins = () => within(within(panel).getByRole("list", { name: /^Countries on the map/ })).getAllByRole("listitem");
    const topRevenue = within(panel).getByText("Top Performing").nextSibling?.textContent;
    expect(topRevenue).toMatch(/^\$[\d,]+Canada$/);

    fireEvent.change(within(panel).getByRole("combobox", { name: "Metric" }), { target: { value: "conversions" } });
    expect(within(panel).getByRole("list", { name: "Countries on the map, by conversions" })).toBeDefined();
    expect(pins()[0].textContent).toMatch(/^1\. Canada[\d,]+$/);
    expect(within(panel).getByText("Top Performing").nextSibling?.textContent).toMatch(/^[\d,]+ conversionsCanada$/);
    expect(within(panel).getByText("Conversion Growth")).toBeDefined();

    fireEvent.change(within(panel).getByRole("combobox", { name: "Countries" }), { target: { value: "3" } });
    expect(pins()).toHaveLength(3);
  });

  it("shows the chosen campaign's results and a performance score", async () => {
    await renderPage();
    const panel = screen.getByRole("region", { name: "Top Campaigns" });
    const bars = within(panel).getAllByRole("button");
    expect(bars).toHaveLength(6);
    fireEvent.click(bars[1]);
    expect(bars[1].getAttribute("aria-pressed")).toBe("true");
    expect(within(panel).getByRole("img", { name: /Performance score \d+ percent/ })).toBeDefined();
    expect(within(panel).getByText(/You earned \$[\d,]+ this week/)).toBeDefined();
  });

  it("exports as a spreadsheet or PDF", async () => {
    const createObjectURL = vi.fn(() => "blob:report");
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const print = vi.fn();
    Object.assign(window, { print });
    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Export Report" }));
    fireEvent.click(screen.getByRole("button", { name: "Spreadsheet (CSV)" }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(screen.getByText(/^Downloaded sixth-sense-ads-/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Export Report" }));
    fireEvent.click(screen.getByRole("button", { name: "PDF (print or save as PDF)" }));
    expect(print).toHaveBeenCalledOnce();
  });
});
