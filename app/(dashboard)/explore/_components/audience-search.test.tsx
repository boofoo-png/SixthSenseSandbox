import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AudienceSearch } from "./audience-search";

afterEach(cleanup);

const input = () => screen.getByRole("searchbox", { name: "Search audience categories" });

describe("AudienceSearch", () => {
  it("suggests matching audiences while typing", () => {
    render(<AudienceSearch initial="" baseQuery="interest=Care+quality" />);
    fireEvent.focus(input());
    fireEvent.change(input(), { target: { value: "care" } });
    const box = screen.getByText(/Suggested audiences for/).parentElement as HTMLElement;
    const link = within(box).getByRole("link", { name: /Senior Living Teams/ });
    expect(link.getAttribute("href")).toBe("/explore?interest=Care+quality&q=Senior+Living+Teams&audience=senior-living-teams");
  });

  it("says when nothing matches", () => {
    render(<AudienceSearch initial="" baseQuery="" />);
    fireEvent.change(input(), { target: { value: "slippers" } });
    expect(screen.getByText(/No exact audience yet/)).toBeDefined();
  });

  it("hides the suggestions with Escape", () => {
    render(<AudienceSearch initial="" baseQuery="" />);
    fireEvent.change(input(), { target: { value: "hotel" } });
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(screen.queryByText(/Suggested audiences for/)).toBeNull();
  });
});
