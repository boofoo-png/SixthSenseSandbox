import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { SAMPLE_COMPETITORS } from "@/lib/competitors/sample-data";
import type { SearchParams } from "@/lib/date-range";
import CompetitorsPage from "./page";
import CompetitorPage from "./[slug]/page";

vi.mock("next/navigation", () => ({
  usePathname: () => "/competitors",
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

afterEach(cleanup);

async function renderPage(params: SearchParams = {}) {
  return render(await CompetitorsPage({ searchParams: Promise.resolve(params) } as PageProps<"/competitors">));
}

async function renderCompetitor(slug: string, params: SearchParams = {}) {
  return render(
    await CompetitorPage({
      params: Promise.resolve({ slug }),
      searchParams: Promise.resolve(params),
    } as PageProps<"/competitors/[slug]">),
  );
}

describe("Competitors page", () => {
  it("renders the heading, the date bar, and a sample data notice", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Competitors" })).toBeDefined();
    expect(screen.getByText("Showing Oct 4 - 9 compared with Sep 27 - Oct 2.")).toBeDefined();
    expect(screen.getByText(/Sample data: these competitors are fictional businesses/)).toBeDefined();
  });

  it("compares competitors in a table", async () => {
    await renderPage();
    const table = screen.getByRole("table", { name: "Competitor comparison" });
    const headers = within(table).getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toEqual(["Competitor", "Posts", "Engagement rate", "Change", "Active ads"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(SAMPLE_COMPETITORS.length);
  });

  it("charts the calendar weeks in the chosen period", async () => {
    const { container } = await renderPage({ period: "last-30-days" });
    const figure = screen.getByRole("figure", { name: "Engagement rate by week" });
    expect(container.querySelectorAll("path[data-series]")).toHaveLength(SAMPLE_COMPETITORS.length);
    // Sep 10 - Oct 9 touches the calendar weeks starting Sep 6 through Oct 4.
    const table = within(figure).getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Competitor",
      "Week of Sep 6",
      "Week of Sep 13",
      "Week of Sep 20",
      "Week of Sep 27",
      "Week of Oct 4",
    ]);
  });

  it("links each competitor to its page, keeping the chosen dates", async () => {
    await renderPage({ period: "last-7-days" });
    const table = screen.getByRole("table", { name: "Competitor comparison" });
    for (const competitor of SAMPLE_COMPETITORS) {
      const link = within(table).getByRole("link", { name: competitor.name });
      expect(link.getAttribute("href")).toBe(`/competitors/${competitor.slug}?period=last-7-days`);
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

describe("Competitor page", () => {
  it("shows the competitor with the date bar and a link back that keeps the dates", async () => {
    await renderCompetitor("northwind-coffee", { period: "last-30-days" });
    expect(screen.getByRole("heading", { level: 1, name: "Northwind Coffee" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Date range" })).toBeDefined();
    expect(screen.getByRole("link", { name: "All competitors" }).getAttribute("href")).toBe(
      "/competitors?period=last-30-days",
    );
  });

  it("returns not found for an unknown competitor", async () => {
    await expect(renderCompetitor("nope")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
