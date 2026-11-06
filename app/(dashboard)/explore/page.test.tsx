import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { encodeCookieJson } from "@/lib/hub/cookie-json";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { DEMO_PROFILE } from "@/lib/hub/demo-profile";
import { profileCookieName } from "@/lib/hub/profile";
import AudiencePage from "./page";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));
vi.mock("./actions", () => ({ saveDefaultAudience: vi.fn() }));

afterEach(() => {
  cleanup();
  cookieJar.clear();
});

async function renderPage(params: Record<string, string> = {}, defaultAudience?: string) {
  cookieJar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
  if (defaultAudience) {
    cookieJar.set(profileCookieName(DEMO_ACCOUNT.email), encodeCookieJson({ ...DEMO_PROFILE, defaultAudience }) ?? "");
  }
  render(await AudiencePage({ searchParams: Promise.resolve(params), params: Promise.resolve({}) }));
}

const results = () => screen.getByRole("region", { name: "Audience and interest results" });
const resultNames = () =>
  within(results())
    .queryAllByRole("link")
    .filter((link) => link.getAttribute("href")?.includes("audience="))
    .map((link) => within(link).getAllByText(/./)[0].textContent);
const activePanel = () => document.querySelector('[aria-labelledby="active-title"]') as HTMLElement;

describe("Audience page (Figma Make)", () => {
  it("has the Make's heading", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Find the people most likely to care" })).toBeDefined();
  });

  it("lists all six audiences without filters", async () => {
    await renderPage();
    expect(resultNames()).toEqual([
      "Hospitality Procurement Teams",
      "Conscious Travellers",
      "Independent Hoteliers",
      "Senior Living Teams",
      "Eco-conscious Property Managers",
      "Boutique Hotel Guests",
    ]);
  });

  it("filters by industry, age, region, and interest, keeping the choices in the form", async () => {
    await renderPage({ interest: "Sustainability", region: "North America" });
    expect(resultNames()).toEqual(["Eco-conscious Property Managers"]);
    expect((screen.getByRole("combobox", { name: "Interest" }) as HTMLSelectElement).value).toBe("Sustainability");
    expect((screen.getByRole("combobox", { name: "Region" }) as HTMLSelectElement).value).toBe("North America");
    expect(screen.getByRole("searchbox", { name: "Search audience categories" }).closest("form")?.getAttribute("action")).toBe("/explore");
  });

  it("shows an empty state with Clear filters when nothing matches", async () => {
    await renderPage({ industry: "Healthcare", region: "Europe", view: "chart" });
    expect(within(results()).getByText("No audiences match these filters")).toBeDefined();
    const clear = within(results()).getByRole("link", { name: "Clear filters" });
    expect(clear.getAttribute("href")).toBe("/explore?view=chart");
  });

  it("adds up the reachable audience for the matching results", async () => {
    await renderPage({ interest: "Sustainability" });
    const stat = screen.getByText("Reachable audience").closest("article") as HTMLElement;
    expect(within(stat).getByText("28.3K")).toBeDefined();
  });

  it("switches between a list and a chart, remembered in the address", async () => {
    await renderPage({ interest: "Travel" });
    const toggle = screen.getByRole("navigation", { name: "Show results as" });
    expect(within(toggle).getByRole("link", { name: "List" }).getAttribute("aria-current")).toBe("page");
    expect(within(toggle).getByRole("link", { name: "Chart" }).getAttribute("href")).toBe("/explore?interest=Travel&view=chart");
    cleanup();
    await renderPage({ interest: "Travel", view: "chart" });
    expect(screen.getByRole("link", { name: "Chart" }).getAttribute("aria-current")).toBe("page");
    expect(within(results()).getByText("growth in interest", { exact: false })).toBeDefined();
  });

  it("starts from the audience chosen at sign-up and says so", async () => {
    await renderPage(); // the demo business sells to Commercial first
    expect(screen.getByText("Starting from your onboarding audience")).toBeDefined();
    expect(screen.getByText(/Hospitality Procurement Teams as the default audience for Sixth Sense\./)).toBeDefined();
    expect(within(activePanel()).getByRole("heading", { name: "Hospitality Procurement Teams" })).toBeDefined();
    expect(within(activePanel()).getByRole("status").textContent).toContain("Your default audience");
  });

  it("selects another audience and offers to save it as the default", async () => {
    await renderPage({ audience: "senior-living-teams", age: "35–64" });
    expect(within(activePanel()).getByRole("heading", { name: "Senior Living Teams" })).toBeDefined();
    const button = within(activePanel()).getByRole("button", { name: "Set as default audience" });
    const form = button.closest("form") as HTMLFormElement;
    expect((form.elements.namedItem("audience") as HTMLInputElement).value).toBe("senior-living-teams");
    expect((form.elements.namedItem("query") as HTMLInputElement).value).toBe("age=35%E2%80%9364&audience=senior-living-teams");
  });

  it("uses the saved default and confirms a save", async () => {
    await renderPage({ saved: "1" }, "conscious-travellers");
    expect(screen.getByText("Your default audience", { selector: "strong" })).toBeDefined();
    expect(within(activePanel()).getByRole("heading", { name: "Conscious Travellers" })).toBeDefined();
    expect(within(activePanel()).getByRole("status").textContent).toContain("Saved as default audience");
  });

  it("suggests audiences from the tracked competitors, labelled as templates", async () => {
    await renderPage();
    const panel = screen.getByRole("region", { name: "Suggestions from direct competitor analytics" });
    expect(within(panel).getByText("Updated from 2 competitors")).toBeDefined();
    expect(within(panel).getByText("Suggested from Pacific Room Supply and Island Linens engagement patterns")).toBeDefined();
    expect(within(panel).getByText(/not live AI/)).toBeDefined();
    const use = within(panel).getByRole("link", { name: "Use audience: Care Facility Procurement Leads" });
    expect(use.getAttribute("href")).toBe("/explore?audience=care-facility-procurement-leads");
  });
});
