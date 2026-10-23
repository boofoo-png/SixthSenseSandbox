import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AskPage from "./page";

afterEach(cleanup);

async function renderAsk(q?: string) {
  render(await AskPage({ searchParams: Promise.resolve(q === undefined ? {} : { q }) } as PageProps<"/ask">));
}

describe("Ask anything page", () => {
  it("keeps the question in the box and repeats it", async () => {
    await renderAsk("What do senior living buyers care about?");
    expect(screen.getByRole("heading", { level: 1, name: "Ask anything" })).toBeDefined();
    expect((screen.getByRole("searchbox", { name: "Ask anything" }) as HTMLInputElement).value).toBe(
      "What do senior living buyers care about?",
    );
    expect(screen.getByText("What do senior living buyers care about?", { selector: "q" })).toBeDefined();
  });

  it("says honestly that answers are coming, and what is planned", async () => {
    await renderAsk("trends");
    expect(screen.getByText(/Answers aren't available yet/)).toBeDefined();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("suggests questions when nothing was asked", async () => {
    await renderAsk();
    expect(screen.getByRole("link", { name: "What's trending in hotel amenities?" }).getAttribute("href")).toBe(
      `/ask?q=${encodeURIComponent("What's trending in hotel amenities?")}`,
    );
  });
});
