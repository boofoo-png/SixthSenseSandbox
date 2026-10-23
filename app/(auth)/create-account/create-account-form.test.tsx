import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createAccount } from "../actions";
import { CreateAccountForm } from "./create-account-form";

vi.mock("../actions", () => ({ createAccount: vi.fn(), cancelSignUp: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(createAccount).mockReset();
});

describe("CreateAccountForm", () => {
  it("has the mid-fi sections and fields", () => {
    render(<CreateAccountForm />);
    expect(screen.getByText("Step 1 of 2")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1, name: "Create an Account" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Company Information" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Password" })).toBeDefined();
    for (const name of [
      "First name",
      "Last name",
      "Role at company",
      "Company name",
      "Address 1",
      "Address 2",
      "City",
      "Postal code",
      "Email",
      "Phone number",
      "Create a password",
      "Re-type password",
    ]) {
      // Required labels end with a visual " *".
      expect(screen.getByLabelText(new RegExp(`^${name}( \\*)?$`))).toBeDefined();
    }
  });

  it("says the email will be used for login, like the mid-fi", () => {
    render(<CreateAccountForm />);
    expect(screen.getByText("Will be used for login")).toBeDefined();
  });

  it("starts in Canada and lists provinces, then states for the United States", () => {
    render(<CreateAccountForm />);
    const country = screen.getByRole("combobox", { name: "Country" }) as HTMLSelectElement;
    expect(country.value).toBe("CA");
    expect(screen.getByRole("option", { name: "British Columbia" })).toBeDefined();
    fireEvent.change(country, { target: { value: "US" } });
    expect(screen.getByRole("combobox", { name: "State" })).toBeDefined();
    expect(screen.getByRole("option", { name: "Washington" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "British Columbia" })).toBeNull();
  });

  it("has Continue and Back buttons", () => {
    render(<CreateAccountForm />);
    expect(screen.getByRole("button", { name: "Continue" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe("/login");
  });

  it("comes back from step 2 filled in, and passwords can be left blank", () => {
    render(
      <CreateAccountForm
        initialValues={{ firstName: "Jordan", lastName: "Lee", company: "Harbourline Supply Co.", country: "US", province: "WA", city: "Seattle" }}
        keepingPassword
      />,
    );
    expect((screen.getByRole("textbox", { name: "First name" }) as HTMLInputElement).value).toBe("Jordan");
    expect((screen.getByRole("textbox", { name: "Last name" }) as HTMLInputElement).value).toBe("Lee");
    expect((screen.getByRole("textbox", { name: "City" }) as HTMLInputElement).value).toBe("Seattle");
    expect((screen.getByRole("combobox", { name: "Country" }) as HTMLSelectElement).value).toBe("US");
    expect((screen.getByRole("combobox", { name: "State" }) as HTMLSelectElement).value).toBe("WA");
    expect(screen.getByText("Leave blank to keep the password you chose")).toBeDefined();
    expect(screen.getByLabelText("Create a password").getAttribute("aria-required")).toBeNull();
  });

  it("offers Cancel sign-up instead of Back once step 1 was done, so leaving is never silent", () => {
    render(<CreateAccountForm keepingPassword initialValues={{ firstName: "Jordan" }} />);
    expect(screen.queryByRole("link", { name: "Back" })).toBeNull();
    const cancel = screen.getByRole("button", { name: "Cancel sign-up" });
    expect(cancel.getAttribute("type")).toBe("submit");
    expect(cancel.hasAttribute("formaction")).toBe(true);
    expect(cancel.closest("form")?.querySelector('button[type="submit"]')?.textContent).toContain("Continue");
  });

  it("offers a Fill with sample data button only when asked to (local development)", () => {
    render(<CreateAccountForm />);
    expect(screen.queryByRole("button", { name: /Fill with sample data/ })).toBeNull();
    cleanup();
    render(<CreateAccountForm showDevTools />);
    fireEvent.click(screen.getByRole("button", { name: /Fill with sample data/ }));
    const value = (name: string) => (screen.getByLabelText(new RegExp(`^${name}( \\*)?$`)) as HTMLInputElement).value;
    expect(value("First name")).toBe("Sample");
    expect(value("Company name")).not.toBe("");
    expect(value("Email")).toMatch(/^sample\+\d+@example\.com$/);
    expect((screen.getByRole("combobox", { name: "Province" }) as HTMLSelectElement).value).toBe("BC");
    expect(value("Create a password")).toBe(value("Re-type password"));
    expect(value("Create a password").length).toBeGreaterThanOrEqual(8);
  });

  it("shows each problem under its field and keeps what was typed", async () => {
    vi.mocked(createAccount).mockResolvedValue({
      errors: { confirmPassword: "Passwords don't match", phone: "Enter a phone number with at least 10 digits" },
      values: { firstName: "Jordan", lastName: "Lee", country: "CA", phone: "12345" },
    });
    render(<CreateAccountForm />);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Passwords don't match")).toBeDefined());
    expect(screen.getByRole("alert").textContent).toContain("Check the highlighted fields");
    expect(screen.getByRole("textbox", { name: "Phone number" }).getAttribute("aria-invalid")).toBe("true");
    expect((screen.getByRole("textbox", { name: "First name" }) as HTMLInputElement).value).toBe("Jordan");
    expect((screen.getByRole("textbox", { name: "Last name" }) as HTMLInputElement).value).toBe("Lee");
  });
});
