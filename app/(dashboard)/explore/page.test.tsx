import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AudiencePage, { metadata } from "./page";

afterEach(cleanup);

describe("Audience Trends page (Figma Make)", () => {
  it("has the Make's header and Ask Sense AI link", () => {
    render(<AudiencePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Follow the trends your audiences care about" })).toBeDefined();
    expect(screen.getByText("Audience research")).toBeDefined();
    expect(screen.getByRole("link", { name: "Ask Sense AI about this page" }).getAttribute("href")).toContain("/ask?q=");
    expect(metadata.title).toBe("Audience Trends");
  });

  it("shows the live trend tracker", () => {
    render(<AudiencePage />);
    expect(screen.getByText("Live audience trend tracker")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Whose interests do you want to explore?" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Momentum versus audience fit" })).toBeDefined();
  });
});
