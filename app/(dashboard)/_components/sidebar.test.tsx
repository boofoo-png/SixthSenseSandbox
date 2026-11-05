import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/competitors");
});

const nav = () => screen.getByRole("navigation", { name: "Main" });

describe("Sidebar", () => {
  it("has the Figma Make's seven destinations, linked to this app's pages", () => {
    render(<Sidebar />);
    const links = within(nav()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Overview", "/"],
      ["Audience", "/explore"],
      ["Competitors", "/competitors"],
      ["Content Creation", "/content"],
      ["Campaigns", "/campaigns"],
      ["AI Management", "/ai-management"],
      ["Reports", "/insights"],
    ]);
  });

  it("marks only the current area as active", () => {
    render(<Sidebar />);
    const active = within(nav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toBe("Competitors");
  });

  it("keeps the chosen dates in every link", () => {
    render(<Sidebar query="period=last-30-days" />);
    const hrefs = within(nav()).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs[0]).toBe("/?period=last-30-days");
    expect(hrefs[2]).toBe("/competitors?period=last-30-days");
  });

  it("links the logo to the dashboard", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /Sixth Sense dashboard/ }).getAttribute("href")).toBe("/");
  });

  it("has only Settings and Help at the bottom, like the Make", () => {
    render(<Sidebar />);
    const sidebar = nav().closest("aside") as HTMLElement;
    const outsideNav = Array.from(sidebar.querySelectorAll("a, button")).filter((el) => !nav().contains(el));
    expect(outsideNav.map((el) => el.getAttribute("aria-label") ?? el.getAttribute("href"))).toEqual(["/", "Settings", "Help and Sense AI"]);
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    expect(screen.queryByText("Workspace")).toBeNull();
  });

  it("is hidden when printing", () => {
    render(<Sidebar />);
    expect(nav().closest(".print\\:hidden")).not.toBeNull();
  });

  describe("Sense AI", () => {
    function openSense() {
      fireEvent.click(screen.getByRole("button", { name: "Help and Sense AI" }));
      return screen.getByRole("dialog", { name: "Sense AI" });
    }

    it("opens a drawer with suggested questions, focused on its close button", () => {
      render(<Sidebar />);
      const drawer = openSense();
      expect(within(drawer).getByRole("button", { name: /What is gaining momentum this week/ })).toBeDefined();
      expect(document.activeElement).toBe(within(drawer).getByRole("button", { name: "Close Sense AI" }));
    });

    it("answers a suggested question with a labelled sample", () => {
      render(<Sidebar />);
      const drawer = openSense();
      fireEvent.click(within(drawer).getByRole("button", { name: /How are competitors reaching hotels/ }));
      const answer = within(drawer).getByRole("status");
      expect(answer.textContent).toContain("You asked: How are competitors reaching hotels?");
      expect(answer.textContent).toContain("A sample answer");
      expect(within(answer).getByRole("link", { name: /Create from this insight/ }).getAttribute("href")).toBe("/content");
    });

    it("answers a typed question only once it is asked", () => {
      render(<Sidebar />);
      const drawer = openSense();
      const input = within(drawer).getByRole("textbox", { name: "Ask a question about your market" });
      fireEvent.click(within(drawer).getByRole("button", { name: "Ask" }));
      expect(within(drawer).queryByRole("status")).toBeNull();
      fireEvent.change(input, { target: { value: "Who buys guest slippers?" } });
      fireEvent.click(within(drawer).getByRole("button", { name: "Ask" }));
      expect(within(drawer).getByRole("status").textContent).toContain("Who buys guest slippers?");
    });

    it("closes with the close button, Escape, or the dimmed background", () => {
      render(<Sidebar />);
      openSense();
      fireEvent.click(screen.getByRole("button", { name: "Close Sense AI" }));
      expect(screen.queryByRole("dialog")).toBeNull();
      openSense();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog")).toBeNull();
      openSense();
      fireEvent.click(screen.getByTestId("sense-scrim"));
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
