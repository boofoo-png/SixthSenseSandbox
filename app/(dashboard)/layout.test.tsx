import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DashboardLayout from "./layout";

vi.mock("next/navigation", () => ({ usePathname: () => "/reports", useSearchParams: () => new URLSearchParams() }));

afterEach(cleanup);

describe("Dashboard layout", () => {
  it("prints on a plain white background instead of the grey page colour", () => {
    render(
      <DashboardLayout>
        <p>Report content</p>
      </DashboardLayout>,
    );
    const shell = screen.getByText("Report content").closest(".bg-zinc-50");
    expect(shell?.className).toContain("print:bg-white");
  });
});
