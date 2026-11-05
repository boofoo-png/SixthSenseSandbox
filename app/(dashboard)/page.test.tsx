import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DEMO_ACCOUNT, NEW_ACCOUNT_COOKIE, SESSION_COOKIE } from "@/lib/hub/constants";
import DashboardPage from "./page";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));
vi.mock("./actions", () => ({ dismissWelcome: vi.fn() }));

afterEach(() => {
  cleanup();
  cookieJar.clear();
});

async function renderDashboard({ newAccount = false, period }: { newAccount?: boolean; period?: string } = {}) {
  cookieJar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
  if (newAccount) cookieJar.set(NEW_ACCOUNT_COOKIE, "1");
  render(await DashboardPage({ searchParams: Promise.resolve(period ? { period } : {}), params: Promise.resolve({}) }));
}

const card = (title: string) => screen.getByRole("heading", { level: 2, name: title }).closest("article") as HTMLElement;

describe("Dashboard: Marketing Overview (Figma Make)", () => {
  it("is titled Marketing Overview", async () => {
    await renderDashboard();
    expect(screen.getByRole("heading", { level: 1, name: "Marketing Overview" })).toBeDefined();
    expect(screen.getByText("Your workspace today")).toBeDefined();
  });

  it("has the Make's six cards in order", async () => {
    await renderDashboard();
    const titles = screen.getAllByRole("article").map((article) => within(article).getByRole("heading", { level: 2 }).textContent);
    expect(titles).toEqual([
      "Competitor Activities",
      "Market Interest",
      "Audience Growth",
      "Engagement",
      "Planning",
      "Cross-Channel Momentum",
    ]);
  });

  it("opens on 30 days, with the Make's figures", async () => {
    await renderDashboard();
    const period = screen.getByRole("navigation", { name: "Period" });
    expect(within(period).getByRole("link", { name: "30 days" }).getAttribute("aria-current")).toBe("page");
    expect(within(period).getByRole("link", { name: "7 days" }).getAttribute("aria-current")).toBeNull();
    expect(within(card("Market Interest")).getByRole("img", { name: "Market interest 81.5 percent" })).toBeDefined();
    expect(within(card("Audience Growth")).getByText("+100")).toBeDefined();
    expect(within(card("Engagement")).getByText("20%")).toBeDefined();
  });

  it("switches to 7 days through the date bar's period, so it carries to other pages", async () => {
    await renderDashboard();
    const period = screen.getByRole("navigation", { name: "Period" });
    expect(within(period).getByRole("link", { name: "7 days" }).getAttribute("href")).toBe("/?period=last-7-days");
    cleanup();
    await renderDashboard({ period: "last-7-days" });
    expect(screen.getByRole("link", { name: "7 days" }).getAttribute("aria-current")).toBe("page");
    expect(within(card("Audience Growth")).getByText("+26")).toBeDefined();
    expect(within(card("Audience Growth")).getByText("New audience members in the last 7 days")).toBeDefined();
  });

  it("lists the competitors added at sign-up first, in a table", async () => {
    await renderDashboard();
    const table = within(card("Competitor Activities")).getByRole("table");
    const headers = within(table).getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual(["Measure", "Pacific Room Supply", "Island Linens", "Coastline Linen Co."]);
    const rows = within(table).getAllByRole("row");
    expect(within(rows[1]).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["+2.5%", "+1.3%", "-0.5%"]);
    expect(within(rows[2]).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["10", "30", "23"]);
  });

  it("shows the next Tuesday as the next publishing window", async () => {
    await renderDashboard(); // the test clock is Friday, Oct 9, 2026
    const time = card("Planning").querySelector("time");
    expect(time?.getAttribute("dateTime")).toBe("2026-10-13");
    expect(time?.textContent).toBe("Oct 13");
  });

  it("shows Email as stable with no reach figure", async () => {
    await renderDashboard();
    const email = within(card("Cross-Channel Momentum")).getByText("Email").closest("li") as HTMLElement;
    expect(within(email).getByText("Stable")).toBeDefined();
    expect(email.textContent).toContain("no reach figure");
  });

  it("links each card to the page with more detail", async () => {
    await renderDashboard();
    expect(within(card("Competitor Activities")).getByRole("link", { name: "View details" }).getAttribute("href")).toBe("/competitors");
    expect(within(card("Audience Growth")).getByRole("link", { name: "Explore audience" }).getAttribute("href")).toBe("/explore");
    expect(within(card("Planning")).getByRole("link", { name: "Open calendar" }).getAttribute("href")).toBe("/ai-studio");
    expect(within(card("Cross-Channel Momentum")).getByRole("link", { name: "Open report" }).getAttribute("href")).toBe("/insights");
  });

  it("says the figures are samples", async () => {
    await renderDashboard();
    expect(screen.getByText(/Sample figures/)).toBeDefined();
  });

  it("welcomes a new account by name, once, right after sign-up", async () => {
    await renderDashboard({ newAccount: true });
    const dialog = screen.getByRole("dialog", { name: "Welcome to SixthSense, Demo" });
    expect(within(dialog).getByText("demo@sixthsense.app")).toBeDefined();
    expect(within(dialog).getByRole("button", { name: "Explore my dashboard" })).toBeDefined();
  });

  it("does not show the welcome when signing in again", async () => {
    await renderDashboard();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
