import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { AppBar } from "./app-bar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/app/(auth)/actions", () => ({ signOut: vi.fn() }));

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/competitors");
});

function menuButton() {
  return screen.getByRole("button", { name: "Menu" });
}

function openDrawer() {
  fireEvent.click(menuButton());
  return screen.getByRole("navigation", { name: "Main" });
}

describe("AppBar", () => {
  it("has the mid-fi icons: menu and search on the left, notifications, profile, and settings on the right", () => {
    render(<AppBar />);
    const bar = screen.getByRole("banner");
    const controls = Array.from(bar.querySelectorAll("a[aria-label], button[aria-label]")).map((element) =>
      element.getAttribute("aria-label"),
    );
    expect(controls).toEqual(["Menu", "Search", "Notifications", "Profile", "Settings"]);
    expect(screen.getByRole("link", { name: "Search" }).getAttribute("href")).toBe("/ask");
  });

  it("shows that there are no notifications yet", () => {
    render(<AppBar />);
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(bell);
    expect(bell.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("No notifications yet.")).toBeDefined();
  });

  it("has profile and settings buttons like the mid-fi", () => {
    render(<AppBar />);
    expect(screen.getByRole("link", { name: "Profile" }).getAttribute("href")).toBe("/profile");
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
  });

  it("is hidden when printing", () => {
    render(<AppBar />);
    expect(menuButton().closest(".print\\:hidden")).not.toBeNull();
  });

  describe("navigation drawer", () => {
    it("starts closed", () => {
      render(<AppBar />);
      expect(menuButton().getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    });

    it("opens with the menu button and lists every area", () => {
      render(<AppBar />);
      const nav = openDrawer();
      expect(menuButton().getAttribute("aria-expanded")).toBe("true");
      expect(menuButton().getAttribute("aria-controls")).toBe(nav.closest("[id]")?.id);
      const hrefs = within(nav).getAllByRole("link").map((link) => link.getAttribute("href"));
      expect(hrefs).toEqual([
        "/",
        "/insights",
        "/findings",
        "/competitors",
        "/explore",
        "/ai-management",
        "/content",
        "/campaigns",
      ]);
    });

    it("marks only the current area as active", () => {
      render(<AppBar />);
      const active = within(openDrawer())
        .getAllByRole("link")
        .filter((link) => link.getAttribute("aria-current") === "page");
      expect(active).toHaveLength(1);
      expect(active[0].textContent).toContain("Research Competitors");
    });

    it("labels areas that are not built yet", () => {
      render(<AppBar />);
      const nav = openDrawer();
      expect(within(nav).getByRole("link", { name: /Campaigns/ }).textContent).toContain("Coming soon");
      expect(within(nav).getByRole("link", { name: /Research Competitors/ }).textContent).not.toContain(
        "Coming soon",
      );
    });

    it("moves focus into the drawer when it opens", () => {
      render(<AppBar />);
      openDrawer();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close menu" }));
    });

    it("closes with the close button and returns focus to the menu button", () => {
      render(<AppBar />);
      openDrawer();
      fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
      expect(document.activeElement).toBe(menuButton());
    });

    it("closes with the Escape key", () => {
      render(<AppBar />);
      openDrawer();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    });

    it("closes when the dimmed background is clicked", () => {
      render(<AppBar />);
      openDrawer();
      fireEvent.click(screen.getByTestId("drawer-scrim"));
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    });

    it("closes when a link is chosen", () => {
      render(<AppBar />);
      fireEvent.click(within(openDrawer()).getByRole("link", { name: "Dashboard" }));
      expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    });

    it("has a Sign out button that submits the sign-out form", () => {
      render(<AppBar />);
      openDrawer();
      const button = screen.getByRole("button", { name: "Sign out" });
      expect(button.getAttribute("type")).toBe("submit");
      expect(button.closest("form")).not.toBeNull();
    });

    it("keeps the chosen dates in every link", () => {
      render(<AppBar query="period=last-30-days" />);
      const hrefs = within(openDrawer())
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"));
      expect(hrefs[0]).toBe("/?period=last-30-days");
      expect(hrefs[3]).toBe("/competitors?period=last-30-days");
    });
  });
});
