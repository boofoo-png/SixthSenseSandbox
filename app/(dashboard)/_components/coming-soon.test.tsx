import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ComingSoon } from "./coming-soon";
import AiStudioPage from "../ai-studio/page";
import ReportsPage from "../reports/page";

afterEach(cleanup);

describe("ComingSoon", () => {
  it("shows the title, a coming soon notice, and the planned features", () => {
    render(<ComingSoon title="Reports" features={["Scheduled PDF reports", "Executive overview"]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Reports" })).toBeDefined();
    expect(screen.getByText("Coming soon")).toBeDefined();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Scheduled PDF reports",
      "Executive overview",
    ]);
  });

  it("links back to the overview", () => {
    render(<ComingSoon title="Reports" features={["x"]} />);
    expect(screen.getByRole("link", { name: "Back to overview" }).getAttribute("href")).toBe("/");
  });
});

describe("placeholder pages", () => {
  it.each([
    ["AI Studio", AiStudioPage],
    ["Reports", ReportsPage],
  ])("%s page renders a coming soon page with planned features", (title, Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeDefined();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });
});
