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

  it("no longer labels any section as coming soon", () => {
    render(<Sidebar />);
    for (const link of within(nav()).getAllByRole("link")) {
      expect(link.textContent).not.toContain("Coming soon");
    }
  });

  it("is hidden when printing", () => {
    render(<Sidebar />);
    expect(nav().closest(".print\\:hidden")).not.toBeNull();
  });

  it("keeps the chosen dates in every link", () => {
    render(<Sidebar query="period=last-30-days" />);
    const hrefs = within(nav()).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/?period=last-30-days",
      "/analytics?period=last-30-days",
      "/competitors?period=last-30-days",
      "/ai-studio?period=last-30-days",
      "/reports?period=last-30-days",
    ]);
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
