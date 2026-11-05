import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import DashboardLayout from "./layout";

vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/reports"), useSearchParams: () => new URLSearchParams() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === SESSION_COOKIE ? { name, value: DEMO_ACCOUNT.email } : undefined),
  }),
}));
vi.mock("next/font/google", () => ({ Montserrat: () => ({ className: "font-montserrat" }) }));
vi.mock("@/app/(auth)/actions", () => ({ signOut: vi.fn() }));

afterEach(cleanup);

async function renderLayout() {
  render(
    await DashboardLayout({
      children: <p>Page content</p>,
    }),
  );
}

describe("Dashboard layout", () => {
  it("has the sidebar and the top bar around the page", async () => {
    await renderLayout();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeDefined();
    expect(screen.getByRole("banner")).toBeDefined();
    expect(screen.getByText("Page content")).toBeDefined();
  });

  it("shows the signed-in business in the top bar", async () => {
    await renderLayout();
    expect(screen.getByRole("link", { name: /Harbourline Supply Co\./ }).getAttribute("href")).toBe("/profile");
  });

  it("puts pages other than the dashboard on a light panel that prints plain white", async () => {
    await renderLayout();
    const panel = screen.getByText("Page content").closest(".bg-canvas");
    expect(panel?.className).toContain("print:bg-white");
    expect(panel?.className).toContain("font-sans");
  });

  it("puts the dashboard straight on the gradient", async () => {
    vi.mocked(usePathname).mockReturnValue("/");
    await renderLayout();
    expect(screen.getByText("Page content").closest(".bg-canvas")).toBeNull();
    expect(screen.getByText("Page content").closest(".shell-gradient")).not.toBeNull();
  });
});
