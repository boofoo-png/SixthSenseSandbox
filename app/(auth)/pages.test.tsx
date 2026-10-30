import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthLayout from "./layout";
import LoginPage from "../(login)/login/page";
import ForgotPasswordPage from "./forgot-password/page";
import ResetPasswordPage from "./reset-password/page";
import { requestPasswordReset, resetPassword } from "./actions";
import CreateAccountPage from "./create-account/page";
import OnboardingPage from "./onboarding/page";
import { encodeStoredAccount } from "@/lib/hub/account";
import { ONBOARDING_DRAFT_COOKIE, SESSION_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { emptyOnboardingDraft, encodeOnboardingDraft } from "@/lib/hub/onboarding";
import { inviteLinkFor } from "@/lib/hub/invite";

vi.mock("./actions", () => ({
  signIn: vi.fn(),
  createAccount: vi.fn(),
  saveOnboarding: vi.fn(),
  goBackToStepOne: vi.fn(),
  cancelSignUp: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined) }),
}));

afterEach(() => {
  cleanup();
  cookieJar.clear();
});

async function renderLogin(next?: string) {
  const page = await LoginPage({ searchParams: Promise.resolve(next === undefined ? {} : { next }) } as PageProps<"/login">);
  const { container } = render(page);
  return (container.querySelector('input[name="next"]') as HTMLInputElement).value;
}

describe("sign-in pages", () => {
  it("show the product name and link it to the login page", () => {
    render(
      <AuthLayout>
        <p>Form</p>
      </AuthLayout>,
    );
    expect(screen.getByRole("link", { name: "Sixth Sense" }).getAttribute("href")).toBe("/login");
  });

  it("login returns to the page the visitor asked for, but only inside the app", async () => {
    expect(await renderLogin("/campaigns")).toBe("/campaigns");
    cleanup();
    expect(await renderLogin("https://example.com")).toBe("/");
    cleanup();
    expect(await renderLogin()).toBe("/");
  });

  it("forgot password asks for the email and has a way back to login", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: "Forgot your password?" })).toBeDefined();
    expect((screen.getByLabelText("Email address") as HTMLInputElement).type).toBe("email");
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to login" }).getAttribute("href")).toBe("/login");
  });

  it("forgot password shows the reset link on screen, since the prototype cannot email it", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ email: "jordan@example.com", link: "/reset-password?token=abc" });
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Reset your password" }).getAttribute("href")).toBe("/reset-password?token=abc"));
    expect(screen.getByText(/In a real app this link would be emailed to you/)).toBeDefined();
  });

  it("forgot password explains when there is no account to reset", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue({ email: "x@example.com", error: "No account with that email was created in this browser." });
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No account with that email"));
  });

  it("reset password takes the new password twice and keeps the link's token", async () => {
    const { container } = render(await ResetPasswordPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ token: "abc" }) }));
    expect(screen.getByRole("heading", { name: "Choose a new password" })).toBeDefined();
    expect((container.querySelector('input[name="token"]') as HTMLInputElement).value).toBe("abc");
    expect(screen.getByLabelText(/^New password/)).toBeDefined();
    expect(screen.getByLabelText(/^Re-type password/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Change password" })).toBeDefined();
  });

  it("reset password says when the link no longer works", async () => {
    vi.mocked(resetPassword).mockResolvedValue({ errors: { form: "This reset link has expired or was already used. Ask for a new one." } });
    render(await ResetPasswordPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ token: "abc" }) }));
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("expired or was already used"));
    expect(screen.getByRole("link", { name: "Ask for a new link" }).getAttribute("href")).toBe("/forgot-password");
  });

  it("login confirms a changed password", async () => {
    render(await LoginPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ reset: "1" }) }));
    expect(screen.getByText("Your password was changed. Log in with your new password.")).toBeDefined();
  });

});

describe("going back and forth between step 1 and step 2", () => {
  const account = {
    firstName: "Jordan",
    lastName: "Lee",
    role: "Owner",
    company: "Harbourline Supply Co.",
    address1: "123 Example Road",
    city: "Richmond",
    country: "CA" as const,
    province: "BC",
    postalCode: "A1B 2C3",
    email: "jordan@example.com",
    phone: "604 555 0100",
  };

  it("step 1 starts empty for a new visitor", async () => {
    render(await CreateAccountPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));
    expect((screen.getByRole("textbox", { name: "Company name" }) as HTMLInputElement).value).toBe("");
    expect(screen.getByText("At least 8 characters")).toBeDefined();
  });

  it("step 1 says who sent an invite link", async () => {
    const code = new URL(inviteLinkFor("http://localhost:3000", "Harbourline Supply Co.")).searchParams.get("invite") ?? "";
    render(await CreateAccountPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ invite: code }) }));
    expect(screen.getByText("You were invited to join Harbourline Supply Co. on Sixth Sense.")).toBeDefined();
  });

  it("step 1 is filled in with the details held from the first visit", async () => {
    cookieJar.set(SIGNUP_COOKIE, encodeStoredAccount(account, "my-password"));
    render(await CreateAccountPage({ params: Promise.resolve({}), searchParams: Promise.resolve({}) }));
    expect((screen.getByRole("textbox", { name: "Company name" }) as HTMLInputElement).value).toBe("Harbourline Supply Co.");
    expect(screen.getByText("Leave blank to keep the password you chose")).toBeDefined();
  });

  it("step 2 shows Back during sign-up and restores the answers kept when going back", async () => {
    cookieJar.set(SIGNUP_COOKIE, encodeStoredAccount(account, "my-password"));
    cookieJar.set(ONBOARDING_DRAFT_COOKIE, encodeOnboardingDraft({ ...emptyOnboardingDraft(), website: "example.com" }) ?? "");
    render(await OnboardingPage());
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
    expect((screen.getByRole("textbox", { name: "Website" }) as HTMLInputElement).value).toBe("example.com");
  });

  it("step 2 shows Back to a signed-in account that never finished it, too", async () => {
    cookieJar.set(SESSION_COOKIE, "sam@example.com");
    render(await OnboardingPage());
    expect(screen.getByRole("button", { name: "Back" })).toBeDefined();
  });
});
