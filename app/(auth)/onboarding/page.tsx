import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ONBOARDING_DRAFT_COOKIE } from "@/lib/hub/constants";
import { decodeOnboardingDraft } from "@/lib/hub/onboarding";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Tell us about your industry",
  description: "Step 2 of creating a Sixth Sense account.",
};

export default async function OnboardingPage() {
  const draft = decodeOnboardingDraft((await cookies()).get(ONBOARDING_DRAFT_COOKIE)?.value);
  return <OnboardingForm initialDraft={draft} showDevTools={process.env.NODE_ENV === "development"} />;
}
