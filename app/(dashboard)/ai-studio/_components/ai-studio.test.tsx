import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { generateIdeas } from "@/lib/ai-studio/ideas";
import { SAMPLE_TRENDS } from "@/lib/competitors/sample-data";
import type { Platform } from "@/lib/analytics/types";
import { AiStudio } from "./ai-studio";
import { resetPlannedPostsForTests } from "./use-planned-posts";

const bestPlatforms: Platform[] = ["tiktok", "instagram", "facebook", "linkedin"];

beforeEach(() => {
  window.localStorage.clear();
  resetPlannedPostsForTests();
  Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
});

afterEach(cleanup);

function renderStudio() {
  render(<AiStudio trends={SAMPLE_TRENDS} bestPlatforms={bestPlatforms} ownTags={["#latteart"]} today="2026-10-09" />);
}

function currentStep() {
  return within(screen.getByRole("list", { name: "Steps" }))
    .getAllByRole("listitem")
    .find((item) => item.getAttribute("aria-current") === "step")?.textContent;
}

describe("AiStudio", () => {
  it("starts on the ideas step", () => {
    renderStudio();
    expect(currentStep()).toBe("1. Ideas");
    expect(screen.getAllByRole("article")).toHaveLength(3);
  });

  it("shows different ideas on request", () => {
    renderStudio();
    const before = screen.getAllByRole("article").map((card) => card.textContent);
    fireEvent.click(screen.getByRole("button", { name: "Show different ideas" }));
    const after = screen.getAllByRole("article").map((card) => card.textContent);
    expect(after).not.toEqual(before);
  });

  it("walks from an idea to captions to the calendar", () => {
    renderStudio();
    const first = generateIdeas({ trends: SAMPLE_TRENDS, bestPlatforms })[0];
    fireEvent.click(screen.getByRole("button", { name: `Use this idea: ${first.title}` }));
    expect(currentStep()).toBe("2. Caption");

    fireEvent.click(screen.getByRole("radio", { name: "Professional" }));
    fireEvent.click(screen.getByRole("radio", { name: "Use caption 3" }));
    const chosen = screen.getAllByRole("listitem").find((item) => item.textContent?.includes("Plan your visit today"));
    expect(chosen).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Next: schedule" }));
    expect(currentStep()).toBe("3. Schedule");

    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-10-14" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    expect(screen.getByRole("status").textContent).toContain("Added to your calendar");

    const month = screen.getByRole("region", { name: "Month view" });
    const day = within(month).getByRole("gridcell", { name: /October 14/ });
    expect(within(day).getByText(/Plan your visit today/)).toBeDefined();
  });

  it("starts over after adding a post", () => {
    renderStudio();
    const first = generateIdeas({ trends: SAMPLE_TRENDS, bestPlatforms })[0];
    fireEvent.click(screen.getByRole("button", { name: `Use this idea: ${first.title}` }));
    fireEvent.click(screen.getByRole("button", { name: "Next: schedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Plan another post" }));
    expect(currentStep()).toBe("1. Ideas");
  });

  it("moves keyboard focus to each new step so it is announced", () => {
    renderStudio();
    const first = generateIdeas({ trends: SAMPLE_TRENDS, bestPlatforms })[0];
    fireEvent.click(screen.getByRole("button", { name: `Use this idea: ${first.title}` }));
    expect(document.activeElement?.textContent).toBe("Step 2 of 3: Caption");
    fireEvent.click(screen.getByRole("button", { name: "Next: schedule" }));
    expect(document.activeElement?.textContent).toBe("Step 3 of 3: Schedule");
  });

  it("does not move focus when the page first loads", () => {
    renderStudio();
    expect(document.activeElement).toBe(document.body);
  });

  it("labels everything as suggestions from sample data", () => {
    renderStudio();
    expect(screen.getByText("Suggestions are generated from templates and sample data, not AI.")).toBeDefined();
  });
});
