import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { CompetitorPerformance } from "./competitor-performance";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

afterEach(cleanup);

const findings = () => screen.getByRole("group", { name: "Filter by findings" });
const card = (title: string) => screen.getByRole("button", { name: new RegExp(title) });
const comparison = () => screen.getByRole("region", { name: "Competitor comparison" });
const nextMove = () => screen.getByRole("region", { name: "Your next move" });

describe("Competitor performance (Figma Make)", () => {
  it("shows three campaign cards with the first selected", () => {
    render(<CompetitorPerformance />);
    expect(screen.getAllByRole("button", { name: /Select / })).toHaveLength(3);
    expect(card("Product launch announcement").getAttribute("aria-pressed")).toBe("true");
    expect(within(card("Product launch announcement")).getByText("Selected")).toBeDefined();
    expect(within(comparison()).getByText("Coastline Linen Co. · Last 30 days")).toBeDefined();
    expect(within(comparison()).getByText("1.8 pts gap")).toBeDefined();
    expect(within(comparison()).getByText("4 Reels")).toBeDefined();
    expect(within(comparison()).getByText("12 Reels")).toBeDefined();
  });

  it("dims the campaigns that do not match a finding", () => {
    render(<CompetitorPerformance />);
    fireEvent.click(within(findings()).getByRole("button", { name: "Common reused layouts" }));
    expect(within(findings()).getByRole("button", { name: "Common reused layouts" }).getAttribute("aria-pressed")).toBe("true");
    expect(card("Seasonal offer campaign").className).not.toContain("opacity");
    expect(card("Product launch announcement").className).toContain("opacity-46");
    expect(within(card("Product launch announcement")).getByText("Not in this finding")).toBeDefined();
  });

  it("compares and plans for the selected campaign", () => {
    render(<CompetitorPerformance />);
    fireEvent.click(card("Community spotlight"));
    expect(within(comparison()).getByText("Evergreen Amenities · Last 30 days")).toBeDefined();
    expect(within(comparison()).getByText("1.6 pts gap")).toBeDefined();
    expect(within(comparison()).getByText("5 stories")).toBeDefined();
    expect(within(comparison()).getByText("2.4% avg engagement")).toBeDefined();
    expect(within(nextMove()).getByText("Review each story after 7 days")).toBeDefined();
    expect(within(nextMove()).getByText(/trails Evergreen Amenities at 4%/)).toBeDefined();
  });

  it("explains the calculation and creates content from the insight", () => {
    render(<CompetitorPerformance />);
    expect(within(comparison()).getByText(/engagements ÷ reach × 100; averages are unweighted\. A test opportunity, not a guarantee\./)).toBeDefined();
    expect(within(nextMove()).getByRole("link", { name: "Create from this insight" }).getAttribute("href")).toBe("/content");
  });
});
