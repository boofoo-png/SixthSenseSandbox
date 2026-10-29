"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  checkPasswordPair,
  encodeStored,
  encodeStoredAccount,
  validateNewAccount,
  type AccountErrors,
  type NewAccountField,
  type NewAccountFields,
  type StoredAccount,
} from "@/lib/hub/account";
import { NEW_ACCOUNT_COOKIE, ONBOARDING_DRAFT_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import {
  encodeOnboardingDraft,
  readOnboardingForm,
  validateOnboarding,
  type OnboardingDraft,
  type BusinessProfile,
  type OnboardingErrors,
} from "@/lib/hub/onboarding";
import { accountCookieName, accountsToEvict, findAccount } from "@/lib/hub/accounts";
import { hashPassword } from "@/lib/hub/password";
import { PROFILE_COOKIE, decodeProfile, encodeProfile, profileCookieName } from "@/lib/hub/profile";
import { RESET_COOKIE, RESET_LIFETIME_MS, checkResetToken, createReset, decodeReset, encodeReset } from "@/lib/hub/reset";
import { ONBOARDING_PATH } from "@/lib/hub/routing";
import { EMAIL_PATTERN } from "@/lib/hub/text";
import {
  ACCOUNT_COOKIE,
  DEMO_ACCOUNT,
  SESSION_COOKIE,
  checkCredentials,
  decodeStoredAccount,
  safeNextPath,
} from "@/lib/hub/session";

// Prototype sign-in (see docs/DECISIONS.md, 2026-10-22): cookies only, no database.

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const ONE_DAY = 60 * 60 * 24;
const ONE_YEAR = 60 * 60 * 24 * 365;

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** Save an account in its own cookie; an older single shared cookie for the same email goes away. */
function saveAccount(store: CookieStore, stored: StoredAccount) {
  const email = stored.account.email;
  store.set(accountCookieName(email), encodeStored({ ...stored, savedAt: stored.savedAt ?? Date.now() }), cookieOptions(ONE_YEAR));
  if (decodeStoredAccount(store.get(ACCOUNT_COOKIE)?.value)?.account.email === email) store.delete(ACCOUNT_COOKIE);
}

/** Save a business profile in its account's own cookie. */
function saveProfile(store: CookieStore, profile: BusinessProfile) {
  store.set(profileCookieName(profile.email), encodeProfile(profile), cookieOptions(ONE_YEAR));
  if (decodeProfile(store.get(PROFILE_COOKIE)?.value)?.email === profile.email) store.delete(PROFILE_COOKIE);
}

/** Keep the browser's cookies within limits by dropping the oldest saved accounts (see lib/hub/accounts.ts). */
function dropOldAccounts(store: CookieStore, keepEmail: string) {
  for (const email of accountsToEvict(store.getAll(), keepEmail)) {
    store.delete(accountCookieName(email));
    store.delete(profileCookieName(email));
  }
}

/**
 * Forget an unfinished sign-up held in this browser. Called on sign-in and sign-out so one
 * person's step 1 details cannot take over another account or be seen by the next visitor.
 */
function clearSignUp(store: Awaited<ReturnType<typeof cookies>>) {
  store.delete(SIGNUP_COOKIE);
  store.delete(ONBOARDING_DRAFT_COOKIE);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type SignInState = { email: string; error?: string };

/** Log in with the demo account or the account created in this browser. */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = text(formData, "email");
  const store = await cookies();
  const user = checkCredentials(email, text(formData, "password"), findAccount(store, email));
  if (!user) {
    return { email, error: "We couldn't sign you in. Check your details and try again." };
  }
  store.set(SESSION_COOKIE, user.email, cookieOptions(formData.get("remember") ? THIRTY_DAYS : undefined));
  store.delete(NEW_ACCOUNT_COOKIE);
  clearSignUp(store);
  redirect(safeNextPath(text(formData, "next")));
}

export type CreateAccountState = {
  errors: AccountErrors;
  /** The typed values to show again, without the passwords. */
  values: Partial<Record<NewAccountField, string>>;
};

const ACCOUNT_FIELDS: readonly NewAccountField[] = [
  "firstName",
  "lastName",
  "role",
  "company",
  "address1",
  "address2",
  "city",
  "country",
  "province",
  "postalCode",
  "email",
  "phone",
  "password",
  "confirmPassword",
];

/**
 * Step 1 of Create an Account. The details are held (password hashed) in the sign-up cookie and
 * step 2 opens; the account itself is created when step 2 is finished. Coming back from step 2,
 * blank passwords keep the one already chosen.
 */
export async function createAccount(
  _previous: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  const store = await cookies();
  const pending = decodeStoredAccount(store.get(SIGNUP_COOKIE)?.value);
  const fields = Object.fromEntries(ACCOUNT_FIELDS.map((key) => [key, text(formData, key)])) as NewAccountFields;
  const result = validateNewAccount(fields, { passwordOptional: pending !== null });
  if (!result.ok) {
    const values = Object.fromEntries(
      ACCOUNT_FIELDS.filter((key) => key !== "password" && key !== "confirmPassword").map((key) => [key, fields[key]]),
    );
    return { errors: result.errors, values };
  }
  const value =
    result.password === null && pending
      ? encodeStored({ account: result.account, passwordHash: pending.passwordHash })
      : encodeStoredAccount(result.account, result.password ?? "");
  store.set(SIGNUP_COOKIE, value, cookieOptions(ONE_DAY));
  redirect(ONBOARDING_PATH);
}

export type OnboardingState = {
  errors: OnboardingErrors;
  /** What was typed, to show again; null before the first submit. */
  values: OnboardingDraft | null;
};

/**
 * Step 2 of Create an Account ("Tell us about your industry"). For a new sign-up this creates the
 * account, signs in, and saves the business profile; a signed-in account without a profile just
 * saves the profile. Then the dashboard opens.
 */
export async function saveOnboarding(_previous: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const store = await cookies();
  const pending = decodeStoredAccount(store.get(SIGNUP_COOKIE)?.value);
  const email = pending?.account.email ?? store.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/create-account");
  const draft = readOnboardingForm(formData);
  const result = validateOnboarding(draft, email);
  if (!result.ok) {
    return { errors: result.errors, values: draft };
  }
  if (pending) {
    saveAccount(store, { ...pending, savedAt: Date.now() });
    store.set(SESSION_COOKIE, email, cookieOptions());
    store.delete(SIGNUP_COOKIE);
    // The dashboard shows its "New account" version until the next sign-in.
    store.set(NEW_ACCOUNT_COOKIE, "1", cookieOptions());
  }
  saveProfile(store, result.profile);
  dropOldAccounts(store, email);
  store.delete(ONBOARDING_DRAFT_COOKIE);
  redirect("/");
}

/** Back on step 2: keep what was typed there (when it fits in a cookie) and open step 1. */
export async function goBackToStepOne(formData: FormData): Promise<void> {
  const value = encodeOnboardingDraft(readOnboardingForm(formData));
  const store = await cookies();
  if (!store.get(SIGNUP_COOKIE)?.value) {
    // An account that was signed in before finishing step 2 becomes a sign-up again, so step 1
    // can be edited; finishing step 2 signs it back in.
    const email = store.get(SESSION_COOKIE)?.value;
    const account = email ? findAccount(store, email) : null;
    if (account) {
      store.set(SIGNUP_COOKIE, encodeStored(account), cookieOptions(ONE_DAY));
      store.delete(SESSION_COOKIE);
    }
  }
  if (value) store.set(ONBOARDING_DRAFT_COOKIE, value, cookieOptions(ONE_DAY));
  else store.delete(ONBOARDING_DRAFT_COOKIE);
  redirect("/create-account");
}

export type ResetRequestState = { email: string; error?: string; link?: string };

/**
 * Forgot Password: for the account saved in this browser, make a reset link. A real app would
 * email it; the prototype shows it on screen (docs/FUNCTIONALITY.md, docs/DECISIONS.md).
 */
export async function requestPasswordReset(_previous: ResetRequestState, formData: FormData): Promise<ResetRequestState> {
  const email = text(formData, "email").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { email, error: "Enter an email address like name@example.com" };
  if (email === DEMO_ACCOUNT.email) return { email, error: "The demo account's password can't be changed." };
  const store = await cookies();
  if (!findAccount(store, email)) {
    return {
      email,
      error:
        "No account with that email was found in this browser. Accounts are saved only in the browser where they were created, once both sign-up steps are finished.",
    };
  }
  const { token, stored } = createReset(email, Date.now());
  store.set(RESET_COOKIE, encodeReset(stored), cookieOptions(RESET_LIFETIME_MS / 1000));
  return { email, link: `/reset-password?token=${token}` };
}

export type ResetPasswordState = { errors: Partial<Record<"password" | "confirmPassword" | "form", string>> };

/** Set a new password from a reset link, then send the person to log in with it. */
export async function resetPassword(_previous: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const store = await cookies();
  const email = checkResetToken(decodeReset(store.get(RESET_COOKIE)?.value), text(formData, "token"), Date.now());
  const saved = email ? findAccount(store, email) : null;
  if (!saved) {
    return { errors: { form: "This reset link has expired or was already used. Ask for a new one." } };
  }
  const password = text(formData, "password");
  const errors = checkPasswordPair(password, text(formData, "confirmPassword"));
  if (Object.keys(errors).length > 0) return { errors };
  saveAccount(store, { ...saved, passwordHash: hashPassword(password) });
  store.delete(RESET_COOKIE);
  store.delete(SESSION_COOKIE);
  redirect("/login?reset=1");
}

/** End the session. The account stays so the person can sign in again. */
export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  clearSignUp(store);
  redirect("/login");
}

/** Throw away an unfinished sign-up (step 1 details and step 2 answers) and open the login page. */
export async function cancelSignUp(): Promise<void> {
  clearSignUp(await cookies());
  redirect("/login");
}
