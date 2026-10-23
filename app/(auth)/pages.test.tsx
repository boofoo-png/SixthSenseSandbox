import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AuthLayout from "./layout";
import LoginPage from "./login/page";
import ForgotPasswordPage from "./forgot-password/page";
import CreateAccountPage from "./create-account/page";
import OnboardingPage from "./onboarding/page";
import { encodeStoredAccount } from "@/lib/hub/account";
import { ONBOARDING_DRAFT_COOKIE, SESSION_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { emptyOnboardingDraft, encodeOnboardingDraft } from "@/lib/hub/onboarding";

vi.mock("./actions", () => ({
  signIn: vi.fn(),
  createAccount: vi.fn(),
  saveOnboarding: vi.fn(),
  goBackToStepOne: vi.fn(),
  signOut: vi.fn(),
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

  it("forgot password explains that reset is not available yet", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("heading", { name: "Forgot your password?" })).toBeDefined();
    expect(screen.getByText(/isn't available in this prototype/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Back to login" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Create a new account" }).getAttribute("href")).toBe("/create-account");
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
    render(await CreateAccountPage());
    expect((screen.getByRole("textbox", { name: "Company name" }) as HTMLInputElement).value).toBe("");
    expect(screen.getByText("At least 8 characters")).toBeDefined();
  });

  it("step 1 is filled in with the details held from the first visit", async () => {
    cookieJar.set(SIGNUP_COOKIE, encodeStoredAccount(account, "my-password"));
    render(await CreateAccountPage());
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
