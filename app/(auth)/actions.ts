"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  encodeStored,
  encodeStoredAccount,
  validateNewAccount,
  type AccountErrors,
  type NewAccountField,
  type NewAccountFields,
} from "@/lib/hub/account";
import { NEW_ACCOUNT_COOKIE, ONBOARDING_DRAFT_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import {
  encodeOnboardingDraft,
  readOnboardingForm,
  validateOnboarding,
  type OnboardingDraft,
  type OnboardingErrors,
} from "@/lib/hub/onboarding";
import { PROFILE_COOKIE, encodeProfile } from "@/lib/hub/profile";
import { ONBOARDING_PATH } from "@/lib/hub/routing";
import {
  ACCOUNT_COOKIE,
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

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export type SignInState = { email: string; error?: string };

/** Log in with the demo account or the account created in this browser. */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = text(formData, "email");
  const store = await cookies();
  const user = checkCredentials(email, text(formData, "password"), decodeStoredAccount(store.get(ACCOUNT_COOKIE)?.value));
  if (!user) {
    return { email, error: "We couldn't sign you in. Check your details and try again." };
  }
  store.set(SESSION_COOKIE, user.email, cookieOptions(formData.get("remember") ? THIRTY_DAYS : undefined));
  store.delete(NEW_ACCOUNT_COOKIE);
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
    store.set(ACCOUNT_COOKIE, encodeStored(pending), cookieOptions(ONE_YEAR));
    store.set(SESSION_COOKIE, email, cookieOptions());
    store.delete(SIGNUP_COOKIE);
    // The dashboard shows its "New account" version until the next sign-in.
    store.set(NEW_ACCOUNT_COOKIE, "1", cookieOptions());
  }
  store.set(PROFILE_COOKIE, encodeProfile(result.profile), cookieOptions(ONE_YEAR));
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
    const account = decodeStoredAccount(store.get(ACCOUNT_COOKIE)?.value);
    if (email && account && account.account.email === email) {
      store.set(SIGNUP_COOKIE, encodeStored(account), cookieOptions(ONE_DAY));
      store.delete(SESSION_COOKIE);
    }
  }
  if (value) store.set(ONBOARDING_DRAFT_COOKIE, value, cookieOptions(ONE_DAY));
  else store.delete(ONBOARDING_DRAFT_COOKIE);
  redirect("/create-account");
}

/** End the session. The account stays so the person can sign in again. */
export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
