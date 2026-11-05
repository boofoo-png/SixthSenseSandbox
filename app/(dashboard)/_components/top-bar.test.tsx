import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { Workspace } from "@/lib/hub/workspace";
import { TopBar } from "./top-bar";

const workspace: Workspace = {
  name: "Jane Doe",
  firstName: "Jane",
  initials: "JD",
  company: "Doe Hospitality Supply",
  email: "jane@example.com",
  competitors: [],
};

afterEach(cleanup);

describe("TopBar", () => {
  it("sends Ask anything to /ask", () => {
    render(<TopBar workspace={workspace} />);
    const ask = screen.getByRole("searchbox", { name: "Ask anything" }) as HTMLInputElement;
    expect(ask.name).toBe("q");
    const form = ask.closest("form");
    expect(form?.getAttribute("action")).toBe("/ask");
    expect(form?.getAttribute("method")).toBe("get");
  });

  it("shows that there are no notifications yet", () => {
    render(<TopBar workspace={workspace} />);
    const bell = screen.getByRole("button", { name: "Notifications" });
    expect(bell.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(bell);
    expect(bell.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("No notifications yet.")).toBeDefined();
  });

  it("names the business, linking to the profile", () => {
    render(<TopBar workspace={workspace} />);
    const pill = screen.getByRole("link", { name: /Doe Hospitality Supply/ });
    expect(pill.getAttribute("href")).toBe("/profile");
  });

  it("is hidden when printing", () => {
    render(<TopBar workspace={workspace} />);
    expect(screen.getByRole("banner").className).toContain("print:hidden");
  });
});
