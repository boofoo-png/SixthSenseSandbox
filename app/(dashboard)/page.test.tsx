import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { NEW_ACCOUNT_COOKIE } from "@/lib/hub/constants";
import DashboardPage from "./page";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined) }),
}));

afterEach(() => {
  cleanup();
  cookieJar.clear();
});

async function renderDashboard({ newAccount = false } = {}) {
  if (newAccount) cookieJar.set(NEW_ACCOUNT_COOKIE, "1");
  render(await DashboardPage());
}

const tiles = () => screen.getAllByRole("article");
const tileNames = () => tiles().map((tile) => within(tile).getByRole("heading").textContent);

describe("Dashboard (mid-fi)", () => {
  it("asks what you would like to do, with an Ask anything box", async () => {
    await renderDashboard();
    expect(screen.getByRole("heading", { level: 1, name: "What would you like to do?" })).toBeDefined();
    const ask = screen.getByRole("searchbox", { name: "Ask anything" }) as HTMLInputElement;
    expect(ask.name).toBe("q");
    expect(ask.closest("form")?.getAttribute("action")).toBe("/ask");
  });

  it("shows a new account the four places to start (mid-fi 'New account')", async () => {
    await renderDashboard({ newAccount: true });
    expect(screen.queryByText("Welcome Back!")).toBeNull();
    expect(tileNames()).toEqual([
      "Research Competitors",
      "Explore Audience and Trend",
      "AI Management",
      "Content Creation",
    ]);
  });

  it("welcomes a returning account back, with Insight Report and Revisit Findings on top (mid-fi 'Have account before')", async () => {
    await renderDashboard();
    expect(screen.getByText("Welcome Back!")).toBeDefined();
    expect(tileNames()).toEqual([
      "Insight Report",
      "Revisit Findings",
      "Research Competitors",
      "Explore Audience and Trend",
      "AI Management",
      "Content Creation",
    ]);
  });

  it("links each tile's Select button to its area", async () => {
    await renderDashboard();
    const hrefs = tiles().map((tile) => within(tile).getByRole("link", { name: /^Select/ }).getAttribute("href"));
    expect(hrefs).toEqual(["/insights", "/findings", "/competitors", "/explore", "/ai-management", "/content"]);
  });

  it("names each Select button after its tile for screen readers", async () => {
    await renderDashboard();
    expect(screen.getByRole("link", { name: "Select Research Competitors" })).toBeDefined();
  });

  it("opens a short description with the arrow next to each title", async () => {
    await renderDashboard({ newAccount: true });
    const tile = tiles()[0];
    const toggle = within(tile).getByRole("button", { name: "More about Research Competitors" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(within(tile).getByText(/public messaging/)).toBeDefined();
  });
});
