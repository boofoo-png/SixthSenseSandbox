import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connection } from "next/server";
import { cleanup, render, screen, within } from "@testing-library/react";
import { bestTimes, formatSlot } from "@/lib/ai-studio/best-time";
import AiStudioPage from "./page";
import { resetPlannedPostsForTests } from "./_components/use-planned-posts";

vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));

beforeEach(() => {
  window.localStorage.clear();
  resetPlannedPostsForTests();
});

afterEach(cleanup);

async function renderPage() {
  render(await AiStudioPage());
}

describe("AI Studio page", () => {
  it("renders on each visit so today's date is never frozen at build time", async () => {
    await renderPage();
    expect(connection).toHaveBeenCalled();
  });

  it("replaces the coming soon page with the planning flow and calendar", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "AI Studio" })).toBeDefined();
    expect(screen.queryByText("Coming soon")).toBeNull();
    expect(screen.getByRole("list", { name: "Steps" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Content calendar" })).toBeDefined();
  });

  it("shows the best times to post for every platform", async () => {
    await renderPage();
    const card = screen.getByRole("region", { name: "Best times to post" });
    for (const name of ["Instagram", "Facebook", "TikTok", "LinkedIn"]) {
      expect(within(card).getByText(name)).toBeDefined();
    }
    expect(within(card).getByText(formatSlot(bestTimes("instagram")[0]))).toBeDefined();
  });

  it("says the suggestions and timings come from sample data", async () => {
    await renderPage();
    expect(screen.getByText(/Showing sample data/)).toBeDefined();
  });
});
