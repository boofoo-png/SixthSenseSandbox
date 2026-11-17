import { DEMO_ACCOUNT } from "./constants";
import type { BusinessProfile } from "./onboarding";
import { decodeProfile, profileValueFor } from "./profile";

// The demo account has no sign-up answers, so it gets a sample profile for Sixth Sense, the team's
// own business (2026-11-06; the clients' Hotel Depot and Hospitality Emporium are set aside for now).

/** The demo account's business (see lib/hub/businesses.ts). */
export const DEMO_COMPANY = "Sixth Sense";

export const DEMO_PROFILE: BusinessProfile = {
  email: DEMO_ACCOUNT.email,
  industries: ["Wholesale"],
  subIndustry: "Hospitality and restaurant supplies",
  regions: [{ country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" }],
  audiences: ["Commercial"],
  goals: ["competitors", "trends", "awareness"],
  website: "https://sixthsense.example",
  socials: [{ platform: "Instagram", handle: "@sixthsenseapp", verified: true }],
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
