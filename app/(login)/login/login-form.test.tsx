import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DEMO_ACCOUNT } from "@/lib/hub/session";
import { signIn } from "@/app/(auth)/actions";
import { LoginForm } from "./login-form";

vi.mock("@/app/(auth)/actions", () => ({ signIn: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(signIn).mockReset();
});

describe("LoginForm", () => {
  it("has the fields, Log In button, and links from the Log In frame", () => {
    render(<LoginForm next="/" />);
    expect(screen.getByRole("heading", { name: "Let's start" })).toBeDefined();
    expect((screen.getByLabelText("Email address") as HTMLInputElement).type).toBe("email");
    expect((screen.getByLabelText("Password") as HTMLInputElement).type).toBe("password");
    expect(screen.getByRole("checkbox", { name: "Remember me" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Log In" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Forgot Your Password" }).getAttribute("href")).toBe("/forgot-password");
    expect(screen.getByRole("link", { name: "Create Account" }).getAttribute("href")).toBe("/create-account");
  });

  it("shows the field names as placeholders, with labels for screen readers", () => {
    render(<LoginForm next="/" />);
    expect(screen.getByPlaceholderText("Email")).toBe(screen.getByLabelText("Email address"));
    expect(screen.getByPlaceholderText("Password")).toBe(screen.getByLabelText("Password"));
  });

  it("can show the password while typing", () => {
    render(<LoginForm next="/" />);
    const password = screen.getByLabelText("Password") as HTMLInputElement;
    const toggle = screen.getByRole("button", { name: "Show password" });
    fireEvent.click(toggle);
    expect(password.type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the demo account so anyone can try the prototype", () => {
    render(<LoginForm next="/" />);
    expect(screen.getByText(DEMO_ACCOUNT.email)).toBeDefined();
    expect(screen.getByText(DEMO_ACCOUNT.password)).toBeDefined();
  });

  it("remembers which page to open after signing in", () => {
    const { container } = render(<LoginForm next="/campaigns" />);
    const next = container.querySelector('input[name="next"]') as HTMLInputElement;
    expect(next.type).toBe("hidden");
    expect(next.value).toBe("/campaigns");
  });

  it("shows the error and keeps the email after a failed sign-in", async () => {
    vi.mocked(signIn).mockResolvedValue({
      email: "jordan@example.com",
      error: "We couldn't sign you in. Check your details and try again.",
    });
    render(<LoginForm next="/" />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "jordan@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain("We couldn't sign you in. Check your details and try again."),
    );
    expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("jordan@example.com");
  });
});
