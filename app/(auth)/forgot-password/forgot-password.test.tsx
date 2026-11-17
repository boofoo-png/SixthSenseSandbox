import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ForgotPasswordPage from "./page";

vi.mock("../actions", () => ({ requestPasswordReset: vi.fn() }));

afterEach(cleanup);

describe("Forgot Password (Figma Make wording)", () => {
  it("is account recovery, asking for the email connected to the account", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Account recovery")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Forgot your password?" })).toBeDefined();
    expect(screen.getByText(/Enter the email address connected to your account/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to login" }).getAttribute("href")).toBe("/login");
  });
});
