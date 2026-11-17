import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CompetitorsPage, { metadata } from "./page";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

afterEach(cleanup);

describe("Competitors page (Figma Make)", () => {
  it("has the Make's heading and says the data is a sample", () => {
    render(<CompetitorsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Competitor performance" })).toBeDefined();
    expect(screen.getByText("Competitive intelligence")).toBeDefined();
    expect(screen.getByText(/Sample data/)).toBeDefined();
    expect(metadata.title).toBe("Competitor performance");
  });

  it("shows the findings filter, comparison, and next move", () => {
    render(<CompetitorsPage />);
    expect(screen.getByRole("group", { name: "Filter by findings" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Competitor comparison" })).toBeDefined();
    expect(screen.getByRole("region", { name: "Your next move" })).toBeDefined();
  });
});
