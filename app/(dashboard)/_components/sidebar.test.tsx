import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/analytics");
});

function nav() {
  return screen.getByRole("navigation", { name: "Main" });
}

describe("Sidebar", () => {
  it("links to every section", () => {
    render(<Sidebar />);
    const links = within(nav()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/analytics",
      "/competitors",
      "/ai-studio",
      "/reports",
    ]);
  });

  it("marks only the current page as active", () => {
    render(<Sidebar />);
    const active = within(nav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain("Analytics");
  });

  it("marks the overview as active on the root path", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<Sidebar />);
    const overview = within(nav()).getByRole("link", { name: "Overview" });
    expect(overview.getAttribute("aria-current")).toBe("page");
  });

  it("labels sections that are not built yet", () => {
    render(<Sidebar />);
    const competitors = within(nav()).getByRole("link", { name: /Competitors/ });
    expect(competitors.textContent).toContain("Coming soon");
    const analytics = within(nav()).getByRole("link", { name: "Analytics" });
    expect(analytics.textContent).not.toContain("Coming soon");
  });

  describe("mobile menu", () => {
    it("starts closed", () => {
      render(<Sidebar />);
      const button = screen.getByRole("button", { name: "Menu" });
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(nav().getAttribute("data-open")).toBe("false");
    });

    it("opens and closes with the menu button", () => {
      render(<Sidebar />);
      const button = screen.getByRole("button", { name: "Menu" });
      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(nav().getAttribute("data-open")).toBe("true");
      fireEvent.click(button);
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("closes when a link is chosen", () => {
      render(<Sidebar />);
      const button = screen.getByRole("button", { name: "Menu" });
      fireEvent.click(button);
      fireEvent.click(within(nav()).getByRole("link", { name: "Overview" }));
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });

    it("points the button at the navigation it controls", () => {
      render(<Sidebar />);
      const button = screen.getByRole("button", { name: "Menu" });
      expect(button.getAttribute("aria-controls")).toBe(nav().id);
    });
  });
});
