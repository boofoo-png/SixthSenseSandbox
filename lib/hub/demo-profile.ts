import { DEMO_ACCOUNT } from "./constants";
import type { BusinessProfile } from "./onboarding";
import { decodeProfile, profileValueFor } from "./profile";

// The demo account has no sign-up answers, so it gets a fictional sample business.
export const DEMO_PROFILE: BusinessProfile = {
  email: DEMO_ACCOUNT.email,
  industries: ["Wholesale", "Hospitality"],
  subIndustry: "Hotel and accommodation supplies",
  regions: [{ country: "CA", province: "BC", area: "Lower Mainland" }],
  audiences: ["Commercial", "Institutional"],
  goals: ["competitors", "trends", "awareness"],
  website: "https://harbourline.example",
  socials: [{ platform: "Instagram", handle: "@harbourline.supply", verified: true }],
  competitors: [
    { name: "Pacific Room Supply", website: "https://pacificroom.example" },
    { name: "Island Linens", website: "https://islandlinens.example" },
  ],
  reportLinks: [],
  documents: [],
  invites: [],
};

/** The signed-in account's business profile: its saved answers, or the demo business. */
export function profileForSession(
  jar: { get(name: string): { value: string } | undefined },
  email: string,
): BusinessProfile | null {
  const saved = decodeProfile(profileValueFor(jar, email));
  if (saved && saved.email === email) return saved;
  return email === DEMO_ACCOUNT.email ? DEMO_PROFILE : null;
}
