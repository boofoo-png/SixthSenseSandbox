import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { usePathname } from "next/navigation";
import type { Workspace } from "@/lib/hub/workspace";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("@/app/(auth)/actions", () => ({ signOut: vi.fn() }));

const workspace: Workspace = {
  name: "Jane Doe",
  firstName: "Jane",
  initials: "JD",
  company: "Doe Hospitality Supply",
  email: "jane@example.com",
  competitors: [],
};

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue("/competitors");
});

const nav = () => screen.getByRole("navigation", { name: "Main" });

describe("Sidebar", () => {
  it("lists every area of the app", () => {
    render(<Sidebar workspace={workspace} />);
    expect(within(nav()).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
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
    render(<Sidebar workspace={workspace} />);
    const active = within(nav())
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(active).toHaveLength(1);
    expect(active[0].textContent).toContain("Research Competitors");
  });

  it("labels areas that are not built yet", () => {
    render(<Sidebar workspace={workspace} />);
    expect(within(nav()).getByRole("link", { name: /Campaigns/ }).textContent).toContain("Soon");
    expect(within(nav()).getByRole("link", { name: /Research Competitors/ }).textContent).not.toContain("Soon");
  });

  it("keeps the chosen dates in every link", () => {
    render(<Sidebar workspace={workspace} query="period=last-30-days" />);
    const hrefs = within(nav()).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs[0]).toBe("/?period=last-30-days");
    expect(hrefs[3]).toBe("/competitors?period=last-30-days");
  });

  it("links the logo to the dashboard", () => {
    render(<Sidebar workspace={workspace} />);
    expect(screen.getByRole("link", { name: /Sixth Sense dashboard/ }).getAttribute("href")).toBe("/");
  });

  it("shows who is signed in, with settings and sign out", () => {
    render(<Sidebar workspace={workspace} />);
    expect(screen.getByText("Jane Doe")).toBeDefined();
    expect(screen.getByText("Doe Hospitality Supply")).toBeDefined();
    expect(screen.getByText("JD")).toBeDefined();
    expect(screen.getByRole("link", { name: "Settings" }).getAttribute("href")).toBe("/settings");
    const signOut = screen.getByRole("button", { name: "Sign out" });
    expect(signOut.getAttribute("type")).toBe("submit");
    expect(signOut.closest("form")).not.toBeNull();
  });

  it("is hidden when printing", () => {
    render(<Sidebar workspace={workspace} />);
    expect(nav().closest(".print\\:hidden")).not.toBeNull();
  });

  describe("Sense AI", () => {
    function openSense() {
      fireEvent.click(screen.getByRole("button", { name: /Sense AI/ }));
      return screen.getByRole("dialog", { name: "Sense AI" });
    }

    it("opens a drawer with suggested questions, focused on its close button", () => {
      render(<Sidebar workspace={workspace} />);
      const drawer = openSense();
      expect(within(drawer).getByRole("button", { name: /What is gaining momentum this week/ })).toBeDefined();
      expect(document.activeElement).toBe(within(drawer).getByRole("button", { name: "Close Sense AI" }));
    });

    it("answers a suggested question with a labelled sample", () => {
      render(<Sidebar workspace={workspace} />);
      const drawer = openSense();
      fireEvent.click(within(drawer).getByRole("button", { name: /How are competitors reaching hotels/ }));
      const answer = within(drawer).getByRole("status");
      expect(answer.textContent).toContain("You asked: How are competitors reaching hotels?");
      expect(answer.textContent).toContain("A sample answer");
      expect(within(answer).getByRole("link", { name: /Create from this insight/ }).getAttribute("href")).toBe("/content");
    });

    it("answers a typed question only once it is asked", () => {
      render(<Sidebar workspace={workspace} />);
      const drawer = openSense();
      const input = within(drawer).getByRole("textbox", { name: "Ask a question about your market" });
      fireEvent.click(within(drawer).getByRole("button", { name: "Ask" }));
      expect(within(drawer).queryByRole("status")).toBeNull();
      fireEvent.change(input, { target: { value: "Who buys guest slippers?" } });
      fireEvent.click(within(drawer).getByRole("button", { name: "Ask" }));
      expect(within(drawer).getByRole("status").textContent).toContain("Who buys guest slippers?");
    });

    it("closes with the close button, Escape, or the dimmed background", () => {
      render(<Sidebar workspace={workspace} />);
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
