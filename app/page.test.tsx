import { describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import Home from "./page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("Home page", () => {
  it("redirects to the analytics dashboard", () => {
    Home();
    expect(redirect).toHaveBeenCalledWith("/analytics");
  });
});
