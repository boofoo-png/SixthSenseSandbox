import type { Metadata } from "next";
import { cookies } from "next/headers";
import { decodeStoredAccount } from "@/lib/hub/account";
import { findAccount } from "@/lib/hub/accounts";
import { ONBOARDING_DRAFT_COOKIE, SESSION_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { decodeOnboardingDraft } from "@/lib/hub/onboarding";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Tell us about your industry",
  description: "Step 2 of creating a Sixth Sense account.",
};

export default async function OnboardingPage() {
  const store = await cookies();
  const draft = decodeOnboardingDraft(store.get(ONBOARDING_DRAFT_COOKIE)?.value);
  // The company from step 1 (or the saved account), named in invite links.
  const sessionEmail = store.get(SESSION_COOKIE)?.value;
  const account = decodeStoredAccount(store.get(SIGNUP_COOKIE)?.value) ?? (sessionEmail ? findAccount(store, sessionEmail) : null);
  return (
    <OnboardingForm
      initialDraft={draft}
      showDevTools={process.env.NODE_ENV === "development"}
      company={account?.account.company}
    />
  );
}
