import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { KpiTile } from "./kpi-tile";

afterEach(cleanup);

describe("KpiTile", () => {
  it("shows the label and value", () => {
    render(<KpiTile label="Impressions" value="48,200" change={0.12} />);
    expect(screen.getByText("Impressions")).toBeDefined();
    expect(screen.getByText("48,200")).toBeDefined();
  });

  it("shows an increase with a plus sign", () => {
    render(<KpiTile label="Impressions" value="1" change={0.124} />);
    expect(screen.getByText("+12% vs last week")).toBeDefined();
  });

  it("shows a decrease with a minus sign", () => {
    render(<KpiTile label="Impressions" value="1" change={-0.08} />);
    expect(screen.getByText("-8% vs last week")).toBeDefined();
  });

  it("shows no change when the change rounds to 0%", () => {
    render(<KpiTile label="Impressions" value="1" change={0.004} />);
    expect(screen.getByText("No change vs last week")).toBeDefined();
  });

  it("explains when there is nothing to compare", () => {
    render(<KpiTile label="Impressions" value="1" change={null} />);
    expect(screen.getByText("No data from last week")).toBeDefined();
  });
});
