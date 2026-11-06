import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Workspace } from "@/lib/hub/workspace";
import { chooseBusiness } from "../actions";
import { TopBar } from "./top-bar";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../actions", () => ({ chooseBusiness: vi.fn(async () => {}) }));

const workspace: Workspace = {
  name: "Jane Doe",
  firstName: "Jane",
  initials: "JD",
  company: "Doe Hospitality Supply",
  email: "jane@example.com",
  competitors: [],
  businesses: [
    { id: "hotel-depot", name: "Doe Hospitality Supply" },
    { id: "hospitality-emporium", name: "Hospitality Emporium" },
  ],
  business: { id: "hotel-depot", name: "Doe Hospitality Supply" },
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

  it("opens a company menu to switch business or open Profile and settings", async () => {
    render(<TopBar workspace={workspace} />);
    const button = screen.getByRole("button", { name: /Doe Hospitality Supply/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(screen.getByRole("link", { name: "Profile and settings" }).getAttribute("href")).toBe("/settings");
    fireEvent.click(screen.getByRole("button", { name: "Hospitality Emporium" }));
    await waitFor(() => expect(chooseBusiness).toHaveBeenCalledWith("hospitality-emporium"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows no switcher when there is only one business", () => {
    render(<TopBar workspace={{ ...workspace, businesses: [workspace.business] }} />);
    fireEvent.click(screen.getByRole("button", { name: /Doe Hospitality Supply/ }));
    expect(screen.queryByText("Switch business")).toBeNull();
  });

  it("is hidden when printing", () => {
    render(<TopBar workspace={workspace} />);
    expect(screen.getByRole("banner").className).toContain("print:hidden");
  });
});
