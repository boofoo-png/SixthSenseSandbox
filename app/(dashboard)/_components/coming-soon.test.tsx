import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ComingSoon, comingSoonItem } from "./coming-soon";
import FindingsPage from "../findings/page";
import ProfilePage from "../profile/page";
import SettingsPage from "../settings/page";

afterEach(cleanup);

describe("comingSoonItem", () => {
  it("finds an unbuilt page by its address", () => {
    const item = comingSoonItem("/findings");
    expect(item.label).toBe("Revisit Findings");
    expect(item.planned.length).toBeGreaterThan(0);
  });

  it("refuses pages that are already built or do not exist", () => {
    expect(() => comingSoonItem("/competitors")).toThrow();
    expect(() => comingSoonItem("/nowhere")).toThrow();
  });
});

describe("ComingSoon", () => {
  it("shows the page name, what it is for, and what is planned", () => {
    const item = comingSoonItem("/findings");
    render(<ComingSoon item={item} />);
    expect(screen.getByRole("heading", { level: 1, name: "Revisit Findings" })).toBeDefined();
    expect(screen.getByText("Coming soon")).toBeDefined();
    expect(screen.getByText(item.summary)).toBeDefined();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual([...item.planned]);
  });

  it("links to a feature that already works, when there is one", () => {
    const item = { ...comingSoonItem("/findings"), availableNow: { href: "/ai-studio", label: "AI Studio", description: "Plan posts." } };
    render(<ComingSoon item={item} />);
    expect(screen.getByRole("link", { name: /AI Studio/ }).getAttribute("href")).toBe("/ai-studio");
  });

  it("links back to the dashboard", () => {
    render(<ComingSoon item={comingSoonItem("/findings")} />);
    expect(screen.getByRole("link", { name: "Back to dashboard" }).getAttribute("href")).toBe("/");
  });
});

describe("placeholder pages", () => {
  const pages = [
    ["Revisit Findings", FindingsPage],
    ["Profile", ProfilePage],
    ["Settings", SettingsPage],
  ] as const;

  it.each(pages)("%s shows its Coming soon page", (label, Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: label })).toBeDefined();
  });
});

describe("Settings", () => {
  it("has Sign out, which moved here from the sidebar as in the Figma Make", () => {
    render(<SettingsPage />);
    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.closest("form")).not.toBeNull();
  });
});
