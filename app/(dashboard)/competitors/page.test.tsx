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

const region = (name: string) => screen.getByRole("region", { name });

describe("Research Competitors (Figma Make)", () => {
  it("has the Make's heading and says the figures are sample data", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "See what your market is responding to" })).toBeDefined();
    expect(screen.getByText(/not real figures for these companies/)).toBeDefined();
  });

  it("sums up attention, active ads, and new campaigns", async () => {
    await renderPage();
    const stat = (label: string) => screen.getByText(label).closest("article") as HTMLElement;
    expect(within(stat("Share of attention")).getByText(/leads the 2 you track/)).toBeDefined();
    expect(within(stat("Active competitor ads")).getByText("Across Meta, Google, and TikTok")).toBeDefined();
    expect(within(stat("New campaigns")).getByText(/^Started /)).toBeDefined();
  });

  it("starts with the competitors added at sign-up, tracked and on top", async () => {
    await renderPage();
    const watchlist = region("Track the competitors your audience is likely to compare");
    expect(within(watchlist).getByText("2 tracked")).toBeDefined();
    const items = within(watchlist).getAllByRole("listitem");
    expect(items.slice(0, 2).map((item) => within(item).getByRole("button").getAttribute("aria-label"))).toEqual([
      expect.stringMatching(/^Stop tracking (Pacific Room Supply|Island Linens)$/),
      expect.stringMatching(/^Stop tracking (Pacific Room Supply|Island Linens)$/),
    ]);
    expect(within(watchlist).getAllByText("Added during sign-up")).toHaveLength(2);
    expect(within(watchlist).getAllByText(/% audience match$/)).toHaveLength(7);
  });

  it("tracks or stops tracking one competitor with its button", async () => {
    await renderPage({ audience: "Institutional" });
    const watchlist = region("Track the competitors your audience is likely to compare");
    const form = (name: string) => within(watchlist).getByRole("button", { name }).closest("form") as HTMLFormElement;
    const track = new FormData(form("Track Coastline Linen Co."));
    expect(track.getAll("shown")).toEqual(["coastline-linen-co"]);
    expect(track.getAll("track")).toEqual(["coastline-linen-co"]);
    expect(track.get("query")).toBe("audience=Institutional");
    const stop = new FormData(form("Stop tracking Island Linens"));
    expect(stop.getAll("shown")).toEqual(["island-linens"]);
    expect(stop.getAll("track")).toEqual([]);
  });

  it("filters the choice by one of your audiences", async () => {
    await renderPage({ audience: "Institutional" });
    const watchlist = region("Track the competitors your audience is likely to compare");
    expect(within(watchlist).getByRole("link", { name: "Institutional" }).getAttribute("aria-current")).toBe("page");
    expect(within(watchlist).getAllByRole("listitem")).toHaveLength(4);
    expect(within(watchlist).getByRole("link", { name: "All your audiences" }).getAttribute("href")).toBe("/competitors");
  });

  it("ignores an audience that is not one of yours", async () => {
    await renderPage({ audience: "Industrial" });
    expect(within(region("Track the competitors your audience is likely to compare")).getAllByRole("listitem")).toHaveLength(7);
  });

  it("confirms a saved choice", async () => {
    await renderPage({ saved: "1" });
    expect(screen.getByRole("status").textContent).toBe("Your competitor list was saved.");
  });

  it("shows one tracked competitor's posting, engagement, ads, best and worst posts, and hashtags", async () => {
    await renderPage();
    const panel = region("Pacific Room Supply performance");
    expect(within(panel).getByText("Posting frequency")).toBeDefined();
    expect(within(panel).getByText("Average engagement")).toBeDefined();
    expect(within(panel).getByText("Active ads")).toBeDefined();
    expect(within(panel).getByText("Best-performing post")).toBeDefined();
    expect(within(panel).getByText("Most-used hashtags")).toBeDefined();
  });

  it("switches the competitor with the picker, keeping it in the address", async () => {
    await renderPage();
    const picker = screen.getByRole("navigation", { name: "Tracked competitors" });
    expect(within(picker).getByRole("link", { name: /Island Linens/ }).getAttribute("href")).toBe("/competitors?competitor=island-linens");
    cleanup();
    await renderPage({ competitor: "island-linens" });
    expect(region("Island Linens performance")).toBeDefined();
    expect(region("Island Linens channel activity")).toBeDefined();
  });

  it("falls back to the first tracked competitor for an unknown one", async () => {
    await renderPage({ competitor: "granite-facility-goods" });
    expect(region("Pacific Room Supply performance")).toBeDefined();
  });

  it("highlights recurring themes across the competitors you track", async () => {
    await renderPage();
    const resolved = resolveDateRange({}, "2026-10-09");
    const tracked = trackedCompetitors(DEMO_PROFILE, availableCompetitors(DEMO_PROFILE));
    const current = hospitalityPostsBetween(tracked, dataRange(resolved)).filter(
      (post) => post.date >= resolved.current.start && post.date <= resolved.current.end,
    );
    const expected = recurringThemes(current, tracked).map((theme) => theme.theme).slice(0, 3);
    const panel = region("Recurring themes across competitor campaigns");
    const shown = within(panel).queryAllByRole("listitem").map((item) => item.querySelector("strong")?.textContent);
    expect(shown).toEqual(expected);
  });

  it("explains what to do when no competitors are tracked", async () => {
    cookieJar.set(profileCookieName(DEMO_ACCOUNT.email), encodeProfile({ ...DEMO_PROFILE, trackedCompetitors: [] }));
    await renderPage();
    expect(screen.getByText(/not tracking any competitors yet/)).toBeDefined();
    expect(screen.queryByRole("navigation", { name: "Tracked competitors" })).toBeNull();
  });
});

