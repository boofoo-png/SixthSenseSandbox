import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { hospitalityPostsBetween } from "@/lib/competitors/hospitality";
import { recurringThemes } from "@/lib/competitors/themes";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { DEMO_PROFILE } from "@/lib/hub/demo-profile";
import { encodeProfile, profileCookieName } from "@/lib/hub/profile";
import { availableCompetitors, trackedCompetitors } from "@/lib/hub/tracking";
import { dataRange, resolveDateRange, type SearchParams } from "@/lib/date-range";
import CompetitorsPage from "./page";
import CompetitorPage from "./[slug]/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/competitors",
  useRouter: () => ({ push: vi.fn() }),
  redirect: vi.fn(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("./actions", () => ({ saveTrackedCompetitors: vi.fn() }));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined) }),
}));

afterEach(() => {
  cleanup();
  cookieJar.clear();
});

// The test clock (vitest.setup.ts) is Fri 2026-10-09.
async function renderPage(params: SearchParams = {}) {
  cookieJar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
  return render(await CompetitorsPage({ params: Promise.resolve({}), searchParams: Promise.resolve(params) }));
}

async function renderCompetitor(slug: string) {
  cookieJar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
  return render(await CompetitorPage({ params: Promise.resolve({ slug }), searchParams: Promise.resolve({}) }));
}

const region = (name: string) => screen.getByRole("region", { name });

describe("Research Competitors (mid-fi)", () => {
  it("has the mid-fi heading and says the figures are sample data", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Review your competitors." })).toBeDefined();
    expect(screen.getByText("Review public messaging and recent campaign examples.")).toBeDefined();
    expect(screen.getByText(/not real figures for these companies/)).toBeDefined();
  });

  it("tracks the competitors added at sign-up, with posting frequency, engagement, and active ads", async () => {
    await renderPage();
    const table = within(region("Competitor tracking")).getByRole("table");
    const names = within(table).getAllByRole("rowheader").map((cell) => cell.textContent);
    expect(names).toEqual(["Pacific Room Supply", "Island Linens"]);
    expect(within(table).getByRole("columnheader", { name: "Posts" })).toBeDefined();
    expect(within(table).getByRole("columnheader", { name: "Engagement rate" })).toBeDefined();
    expect(within(table).getByRole("columnheader", { name: "Active ads" })).toBeDefined();
    expect(within(table).getByRole("link", { name: "Pacific Room Supply" }).getAttribute("href")).toBe("/competitors/pacific-room-supply");
  });

  it("lets you choose which competitors to track, starting with those from sign-up", async () => {
    await renderPage();
    const choose = region("Competitors you track");
    const box = (name: string) => within(choose).getByRole("checkbox", { name: new RegExp(`^${name}`) }) as HTMLInputElement;
    expect(box("Pacific Room Supply").checked).toBe(true);
    expect(box("Coastline Linen Co.").checked).toBe(false);
    expect(within(choose).getAllByText("Added at sign-up")).toHaveLength(2);
    expect(within(choose).getByRole("button", { name: "Save competitors" })).toBeDefined();
  });

  it("filters the choice by one of your audiences", async () => {
    await renderPage({ audience: "Institutional" });
    const choose = region("Competitors you track");
    expect(within(choose).getByRole("link", { name: "Institutional" }).getAttribute("aria-current")).toBe("page");
    const names = within(choose).getAllByRole("checkbox").map((box) => (box as HTMLInputElement).value);
    expect(names).toEqual(["pacific-room-supply", "island-linens", "coastline-linen-co", "granite-facility-goods"]);
    expect(within(choose).getByRole("link", { name: "All your audiences" }).getAttribute("href")).toBe("/competitors");
  });

  it("ignores an audience that is not one of yours", async () => {
    await renderPage({ audience: "Industrial" });
    expect(within(region("Competitors you track")).getAllByRole("checkbox")).toHaveLength(7);
  });

  it("confirms a saved choice", async () => {
    await renderPage({ saved: "1" });
    expect(screen.getByText("Your competitor list was saved.")).toBeDefined();
  });

  it("filters posts by findings, like the mid-fi chips", async () => {
    await renderPage({ finding: "most-liked" });
    const posts = region("Recent posts");
    expect(within(posts).getByRole("link", { name: "Most liked post" }).getAttribute("aria-current")).toBe("page");
    const cards = within(posts).getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(6);
    expect(within(cards[0]).getByText("Most liked post")).toBeDefined();
  });

  it("highlights recurring themes across the competitors you track", async () => {
    await renderPage();
    const resolved = resolveDateRange({}, "2026-10-09");
    const tracked = trackedCompetitors(DEMO_PROFILE, availableCompetitors(DEMO_PROFILE));
    const current = hospitalityPostsBetween(tracked, dataRange(resolved)).filter(
      (post) => post.date >= resolved.current.start && post.date <= resolved.current.end,
    );
    const expected = recurringThemes(current, tracked).map((theme) => theme.theme);
    const shown = within(region("Recurring themes")).queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(shown).toEqual(expected);
  });

  it("explains what to do when no competitors are tracked", async () => {
    cookieJar.set(profileCookieName(DEMO_ACCOUNT.email), encodeProfile({ ...DEMO_PROFILE, trackedCompetitors: [] }));
    await renderPage();
    expect(screen.getByText(/not tracking any competitors yet/)).toBeDefined();
    expect(screen.queryByRole("region", { name: "Competitor tracking" })).toBeNull();
  });
});

describe("one competitor's page", () => {
  it("shows a sign-up competitor's best and worst posts, hashtags, and ads, clearly as sample data", async () => {
    await renderCompetitor("pacific-room-supply");
    expect(screen.getByRole("heading", { level: 1, name: "Pacific Room Supply" })).toBeDefined();
    expect(screen.getByText(/not real figures for Pacific Room Supply/)).toBeDefined();
    expect(screen.getByRole("heading", { name: /Top posts/ })).toBeDefined();
  });

  it("works for the fictional sample suppliers too", async () => {
    await renderCompetitor("coastline-linen-co");
    expect(screen.getByRole("heading", { level: 1, name: "Coastline Linen Co." })).toBeDefined();
    expect(screen.getByText(/fictional business/)).toBeDefined();
  });

  it("is not found for a competitor you cannot track", async () => {
    await expect(renderCompetitor("someone-else")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
