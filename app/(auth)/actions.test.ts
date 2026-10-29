import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeStoredAccount, encodeStoredAccount } from "@/lib/hub/account";
import { ACCOUNT_COOKIE, DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/session";
import { NEW_ACCOUNT_COOKIE, ONBOARDING_DRAFT_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { decodeOnboardingDraft } from "@/lib/hub/onboarding";
import { verifyPassword } from "@/lib/hub/password";
import { RESET_COOKIE, decodeReset } from "@/lib/hub/reset";
import { decodeProfile, profileCookieName } from "@/lib/hub/profile";
import { MAX_ACCOUNTS, accountCookieName } from "@/lib/hub/accounts";

type Cookie = { value: string; options?: Record<string, unknown> };
const jar = new Map<string, Cookie>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => jar.set(name, { value, options }),
    delete: (name: string) => jar.delete(name),
    getAll: () => [...jar].map(([name, cookie]) => ({ name, value: cookie.value })),
  }),
}));

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`redirect ${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

const { cancelSignUp, createAccount, goBackToStepOne, requestPasswordReset, resetPassword, saveOnboarding, signIn, signOut } =
  await import("./actions");

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function redirectedTo(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
  throw new Error("expected a redirect");
}

const NEW_ACCOUNT = {
  firstName: "Jordan",
  lastName: "Lee",
  role: "Owner",
  company: "Harbourline Supply Co.",
  address1: "123 Example Road",
  address2: "",
  city: "Richmond",
  country: "CA",
  province: "BC",
  postalCode: "A1B 2C3",
  email: "jordan@example.com",
  phone: "604 555 0100",
  password: "my-password",
  confirmPassword: "my-password",
};

const ACCOUNT_DETAILS = {
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

beforeEach(() => jar.clear());

describe("signIn", () => {
  it("explains a failed sign-in and keeps the email that was typed", async () => {
    const state = await signIn({ email: "" }, form({ email: "jordan@example.com", password: "nope" }));
    expect(state).toEqual({
      email: "jordan@example.com",
      error: "We couldn't sign you in. Check your details and try again.",
    });
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("signs in the demo account and goes to the dashboard", async () => {
    const url = await redirectedTo(() =>
      signIn({ email: "" }, form({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password })),
    );
    expect(url).toBe("/");
    expect(jar.get(SESSION_COOKIE)?.value).toBe(DEMO_ACCOUNT.email);
    expect(jar.get(SESSION_COOKIE)?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("returns to the page the visitor was trying to open, but only inside the app", async () => {
    const creds = { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password };
    expect(await redirectedTo(() => signIn({ email: "" }, form({ ...creds, next: "/campaigns" })))).toBe("/campaigns");
    expect(await redirectedTo(() => signIn({ email: "" }, form({ ...creds, next: "https://example.com" })))).toBe("/");
  });

  it("keeps the session for 30 days only when Remember Me is ticked", async () => {
    const creds = { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password };
    await redirectedTo(() => signIn({ email: "" }, form(creds)));
    expect(jar.get(SESSION_COOKIE)?.options?.maxAge).toBeUndefined();
    await redirectedTo(() => signIn({ email: "" }, form({ ...creds, remember: "on" })));
    expect(jar.get(SESSION_COOKIE)?.options?.maxAge).toBe(60 * 60 * 24 * 30);
  });
});

describe("leftover sign-up details", () => {
  it("signing in clears an abandoned sign-up, so it cannot take over the account", async () => {
    jar.set(SIGNUP_COOKIE, { value: "someone else's step 1" });
    jar.set(ONBOARDING_DRAFT_COOKIE, { value: "someone else's step 2" });
    await redirectedTo(() => signIn({ email: "" }, form({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password })));
    expect(jar.has(SIGNUP_COOKIE)).toBe(false);
    expect(jar.has(ONBOARDING_DRAFT_COOKIE)).toBe(false);
  });

  it("signing out clears them too, so the next person on this computer does not see them", async () => {
    jar.set(SESSION_COOKIE, { value: "jordan@example.com" });
    jar.set(SIGNUP_COOKIE, { value: "step 1" });
    jar.set(ONBOARDING_DRAFT_COOKIE, { value: "step 2" });
    await redirectedTo(() => signOut());
    expect(jar.has(SIGNUP_COOKIE)).toBe(false);
    expect(jar.has(ONBOARDING_DRAFT_COOKIE)).toBe(false);
  });
});

describe("cancelSignUp", () => {
  it("throws away the unfinished sign-up and opens the login page", async () => {
    jar.set(SIGNUP_COOKIE, { value: "step 1" });
    jar.set(ONBOARDING_DRAFT_COOKIE, { value: "step 2" });
    expect(await redirectedTo(() => cancelSignUp())).toBe("/login");
    expect(jar.has(SIGNUP_COOKIE)).toBe(false);
    expect(jar.has(ONBOARDING_DRAFT_COOKIE)).toBe(false);
  });
});

describe("createAccount", () => {
  it("returns the problems and the typed values, but never the passwords", async () => {
    const state = await createAccount(
      { errors: {}, values: {} },
      form({ ...NEW_ACCOUNT, confirmPassword: "different" }),
    );
    expect(state.errors.confirmPassword).toBe("Passwords don't match");
    expect(state.values.email).toBe("jordan@example.com");
    expect(state.values).not.toHaveProperty("password");
    expect(state.values).not.toHaveProperty("confirmPassword");
    expect(jar.size).toBe(0);
  });

  it("holds step 1 and goes to step 2 without creating the account yet", async () => {
    const url = await redirectedTo(() => createAccount({ errors: {}, values: {} }, form(NEW_ACCOUNT)));
    expect(url).toBe("/onboarding");
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(jar.has(accountCookieName("jordan@example.com"))).toBe(false);
    const pending = decodeStoredAccount(jar.get(SIGNUP_COOKIE)?.value);
    expect(pending?.account.company).toBe("Harbourline Supply Co.");
    expect(jar.get(SIGNUP_COOKIE)?.value).not.toContain("my-password");
    expect(jar.get(SIGNUP_COOKIE)?.options).toMatchObject({ httpOnly: true, maxAge: 60 * 60 * 24 });
  });

  it("coming back from step 2, keeps the chosen password when both are left blank", async () => {
    await redirectedTo(() => createAccount({ errors: {}, values: {} }, form(NEW_ACCOUNT)));
    const url = await redirectedTo(() =>
      createAccount({ errors: {}, values: {} }, form({ ...NEW_ACCOUNT, city: "Vancouver", password: "", confirmPassword: "" })),
    );
    expect(url).toBe("/onboarding");
    const pending = decodeStoredAccount(jar.get(SIGNUP_COOKIE)?.value);
    expect(pending?.account.city).toBe("Vancouver");
    expect(verifyPassword("my-password", pending?.passwordHash ?? "")).toBe(true);
  });
});

function onboardingForm(overrides: Record<string, string> = {}) {
  const data = form({
    subIndustry: "Online shops",
    audience: "Commercial",
    website: "example.com",
    conversionTarget: "10",
    invites: "",
    ...overrides,
  });
  data.append("industry", "Wholesale");
  data.append("regionCountry", "CA");
  data.append("regionProvince", "BC");
  data.append("regionArea", "");
  data.append("goal", "traffic");
  return data;
}

async function finishSignUp() {
  await redirectedTo(() => createAccount({ errors: {}, values: {} }, form(NEW_ACCOUNT)));
  return redirectedTo(() => saveOnboarding({ errors: {}, values: null }, onboardingForm()));
}

describe("saveOnboarding", () => {
  it("sends visitors who have not done step 1 to step 1", async () => {
    expect(await redirectedTo(() => saveOnboarding({ errors: {}, values: null }, onboardingForm()))).toBe(
      "/create-account",
    );
  });

  it("returns the problems and what was typed, without creating the account", async () => {
    await redirectedTo(() => createAccount({ errors: {}, values: {} }, form(NEW_ACCOUNT)));
    const state = await saveOnboarding({ errors: {}, values: null }, onboardingForm({ website: "" }));
    expect(state.errors.website).toBe("Enter your website");
    expect(state.values?.industries).toEqual(["Wholesale"]);
    expect(jar.has(accountCookieName("jordan@example.com"))).toBe(false);
    expect(jar.has(profileCookieName("jordan@example.com"))).toBe(false);
  });

  it("finishing step 2 creates the account, signs in, saves the profile, and opens the dashboard", async () => {
    jar.set(ONBOARDING_DRAFT_COOKIE, { value: "old draft" });
    expect(await finishSignUp()).toBe("/");
    expect(decodeStoredAccount(jar.get(accountCookieName("jordan@example.com"))?.value)?.account.email).toBe("jordan@example.com");
    expect(jar.get(accountCookieName("jordan@example.com"))?.options).toMatchObject({ httpOnly: true, maxAge: 60 * 60 * 24 * 365 });
    expect(jar.get(SESSION_COOKIE)?.value).toBe("jordan@example.com");
    const profile = decodeProfile(jar.get(profileCookieName("jordan@example.com"))?.value);
    expect(profile?.email).toBe("jordan@example.com");
    expect(profile?.website).toBe("https://example.com");
    expect(jar.has(SIGNUP_COOKIE)).toBe(false);
    expect(jar.has(ONBOARDING_DRAFT_COOKIE)).toBe(false);
  });

  it("marks the account as new, so the dashboard shows its New account version", async () => {
    await finishSignUp();
    expect(jar.get(NEW_ACCOUNT_COOKIE)?.value).toBe("1");
    expect(jar.get(NEW_ACCOUNT_COOKIE)?.options?.maxAge).toBeUndefined();
  });

  it("signing in later shows the returning version of the dashboard", async () => {
    await finishSignUp();
    await redirectedTo(() => signIn({ email: "" }, form({ email: "jordan@example.com", password: "my-password" })));
    expect(jar.has(NEW_ACCOUNT_COOKIE)).toBe(false);
  });

  it("lets the new account sign in again later", async () => {
    await finishSignUp();
    jar.delete(SESSION_COOKIE);
    const url = await redirectedTo(() =>
      signIn({ email: "" }, form({ email: "jordan@example.com", password: "my-password" })),
    );
    expect(url).toBe("/");
  });

  it("still lets a signed-in account without a profile finish step 2", async () => {
    jar.set(SESSION_COOKIE, { value: "sam@example.com" });
    expect(await redirectedTo(() => saveOnboarding({ errors: {}, values: null }, onboardingForm()))).toBe("/");
    expect(decodeProfile(jar.get(profileCookieName("sam@example.com"))?.value)?.email).toBe("sam@example.com");
  });
});

describe("goBackToStepOne", () => {
  it("keeps what was typed on step 2 and opens step 1", async () => {
    const data = onboardingForm({ invites: "sam@example.com" });
    expect(await redirectedTo(() => goBackToStepOne(data))).toBe("/create-account");
    const draft = decodeOnboardingDraft(jar.get(ONBOARDING_DRAFT_COOKIE)?.value);
    expect(draft?.industries).toEqual(["Wholesale"]);
    expect(draft?.invites).toBe("sam@example.com");
    expect(jar.get(ONBOARDING_DRAFT_COOKIE)?.options).toMatchObject({ httpOnly: true });
  });

  it("turns an account that never finished step 2 back into a sign-up, so step 1 can be edited", async () => {
    // Accounts created before the account moved to the end of step 2 are signed in without a profile.
    jar.set(ACCOUNT_COOKIE, { value: encodeStoredAccount({ ...ACCOUNT_DETAILS }, "my-password") });
    jar.set(SESSION_COOKIE, { value: "jordan@example.com" });
    expect(await redirectedTo(() => goBackToStepOne(onboardingForm()))).toBe("/create-account");
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    const pending = decodeStoredAccount(jar.get(SIGNUP_COOKIE)?.value);
    expect(pending?.account.company).toBe("Harbourline Supply Co.");
    expect(verifyPassword("my-password", pending?.passwordHash ?? "")).toBe(true);
  });

  it("still goes back when the answers are too long to keep", async () => {
    expect(await redirectedTo(() => goBackToStepOne(onboardingForm({ invites: "x".repeat(5000) })))).toBe(
      "/create-account",
    );
    expect(jar.has(ONBOARDING_DRAFT_COOKIE)).toBe(false);
  });
});

describe("forgot password", () => {
  async function linkFor(email: string) {
    await finishSignUp();
    const state = await requestPasswordReset({ email: "" }, form({ email }));
    return state;
  }

  it("shows a reset link for the account saved in this browser", async () => {
    const state = await linkFor("Jordan@Example.com");
    expect(state.link).toMatch(/^\/reset-password\?token=[0-9a-f]{64}$/);
    expect(decodeReset(jar.get(RESET_COOKIE)?.value)?.email).toBe("jordan@example.com");
    expect(jar.get(RESET_COOKIE)?.options).toMatchObject({ httpOnly: true, maxAge: 15 * 60 });
  });

  it("says when no account with that email was created in this browser", async () => {
    const state = await linkFor("someone@example.com");
    expect(state.link).toBeUndefined();
    expect(state.error).toBe(
      "No account with that email was found in this browser. Accounts are saved only in the browser where they were created, once both sign-up steps are finished.",
    );
  });

  it("does not reset the shared demo account", async () => {
    const state = await requestPasswordReset({ email: "" }, form({ email: DEMO_ACCOUNT.email }));
    expect(state.error).toBe("The demo account's password can't be changed.");
  });

  it("checks the email address", async () => {
    const state = await requestPasswordReset({ email: "" }, form({ email: "not-an-email" }));
    expect(state.error).toBe("Enter an email address like name@example.com");
  });

  it("sets the new password from the link, then sends you to log in", async () => {
    const { link } = await linkFor("jordan@example.com");
    const token = new URL(`http://x${link}`).searchParams.get("token") ?? "";
    const url = await redirectedTo(() =>
      resetPassword({ errors: {} }, form({ token, password: "brand-new-pass", confirmPassword: "brand-new-pass" })),
    );
    expect(url).toBe("/login?reset=1");
    expect(jar.has(RESET_COOKIE)).toBe(false);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(verifyPassword("brand-new-pass", decodeStoredAccount(jar.get(accountCookieName("jordan@example.com"))?.value)?.passwordHash ?? "")).toBe(true);
  });

  it("checks the new password the same way as Create an Account", async () => {
    const { link } = await linkFor("jordan@example.com");
    const token = new URL(`http://x${link}`).searchParams.get("token") ?? "";
    const state = await resetPassword({ errors: {} }, form({ token, password: "brand-new-pass", confirmPassword: "other" }));
    expect(state.errors.confirmPassword).toBe("Passwords don't match");
  });

  it("refuses a wrong, used, or expired link", async () => {
    await linkFor("jordan@example.com");
    const state = await resetPassword({ errors: {} }, form({ token: "0".repeat(64), password: "brand-new-pass", confirmPassword: "brand-new-pass" }));
    expect(state.errors.form).toBe("This reset link has expired or was already used. Ask for a new one.");
    expect(verifyPassword("my-password", decodeStoredAccount(jar.get(accountCookieName("jordan@example.com"))?.value)?.passwordHash ?? "")).toBe(true);
  });
});

describe("several accounts in one browser", () => {
  async function signUp(email: string, password: string) {
    await redirectedTo(() =>
      createAccount({ errors: {}, values: {} }, form({ ...NEW_ACCOUNT, email, password, confirmPassword: password })),
    );
    await redirectedTo(() => saveOnboarding({ errors: {}, values: null }, onboardingForm()));
    await redirectedTo(() => signOut());
  }

  it("remembers every account, so each can log in and keeps its own answers", async () => {
    await signUp("first@example.com", "first-password");
    await signUp("second@example.com", "second-password");
    for (const [email, password] of [["first@example.com", "first-password"], ["second@example.com", "second-password"]]) {
      expect(await redirectedTo(() => signIn({ email: "" }, form({ email, password })))).toBe("/");
      expect(decodeProfile(jar.get(profileCookieName(email))?.value)?.email).toBe(email);
    }
  });

  it("lets an older account reset its password", async () => {
    await signUp("first@example.com", "first-password");
    await signUp("second@example.com", "second-password");
    const { link } = await requestPasswordReset({ email: "" }, form({ email: "first@example.com" }));
    expect(link).toMatch(/^\/reset-password\?token=/);
  });

  it("still logs in an account saved the old way, in the single shared cookie", async () => {
    jar.set(ACCOUNT_COOKIE, { value: encodeStoredAccount({ ...ACCOUNT_DETAILS }, "my-password") });
    expect(await redirectedTo(() => signIn({ email: "" }, form({ email: "jordan@example.com", password: "my-password" })))).toBe("/");
  });

  it(`keeps at most ${MAX_ACCOUNTS} accounts, dropping the oldest and its answers`, async () => {
    for (let i = 0; i <= MAX_ACCOUNTS; i += 1) {
      vi.setSystemTime(new Date(2026, 9, 29, 12, i));
      await signUp(`p${i}@example.com`, "same-password");
    }
    vi.setSystemTime(new Date(2026, 9, 9, 12));
    expect(jar.has(accountCookieName("p0@example.com"))).toBe(false);
    expect(jar.has(profileCookieName("p0@example.com"))).toBe(false);
    expect(jar.has(accountCookieName(`p${MAX_ACCOUNTS}@example.com`))).toBe(true);
    expect([...jar.keys()].filter((name) => name.startsWith("ss_account_"))).toHaveLength(MAX_ACCOUNTS);
  });
});

describe("signOut", () => {
  it("ends the session but keeps the account so it can sign in again", async () => {
    await finishSignUp();
    expect(await redirectedTo(() => signOut())).toBe("/login");
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(jar.has(accountCookieName("jordan@example.com"))).toBe(true);
  });
});
