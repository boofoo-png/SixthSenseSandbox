import { describe, expect, it } from "vitest";
import { SAMPLE_SUPPLIERS } from "@/lib/competitors/hospitality";
import { DEMO_ACCOUNT } from "./constants";
import { DEMO_PROFILE, profileForSession } from "./demo-profile";
import { emptyOnboardingDraft, validateOnboarding, type BusinessProfile } from "./onboarding";
import { encodeProfile, profileCookieName } from "./profile";
import { availableCompetitors, competitorsForAudience, selectedAudience, trackedCompetitors } from "./tracking";

function profile(overrides: Partial<BusinessProfile> = {}): BusinessProfile {
  const result = validateOnboarding(
    {
      ...emptyOnboardingDraft(),
      industries: ["Wholesale"],
      regions: [{ country: "CA", province: "BC", area: "" }],
      audiences: ["Institutional"],
      goals: ["competitors"],
      website: "example.com",
      competitors: [
        { name: "Pacific Room Supply", website: "pacificroom.example" },
        { name: "Island Linens", website: "" },
      ],
    },
    "jordan@example.com",
  );
  if (!result.ok) throw new Error("expected a profile");
  return { ...result.profile, ...overrides };
}

describe("availableCompetitors", () => {
  it("lists the competitors added at sign-up first, then the sample suppliers", () => {
    const list = availableCompetitors(profile());
    expect(list.slice(0, 2).map((c) => [c.name, c.source])).toEqual([
      ["Pacific Room Supply", "sign-up"],
      ["Island Linens", "sign-up"],
    ]);
    expect(list.slice(2).map((c) => c.slug)).toEqual(SAMPLE_SUPPLIERS.map((c) => c.slug));
  });

  it("keeps slugs unique when names collide", () => {
    const list = availableCompetitors(profile({ competitors: [{ name: "Island Linens", website: "" }, { name: "Island  Linens!", website: "" }] }));
    const slugs = list.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("still lists the sample suppliers without a profile", () => {
    expect(availableCompetitors(null)).toHaveLength(SAMPLE_SUPPLIERS.length);
  });
});

describe("competitorsForAudience", () => {
  it("keeps sign-up competitors and the sample suppliers that sell to that audience", () => {
    const list = competitorsForAudience(availableCompetitors(profile()), "Industrial");
    expect(list.map((c) => c.name)).toEqual(["Pacific Room Supply", "Island Linens", "Granite Facility Goods"]);
  });

  it("keeps everyone when no audience is chosen", () => {
    expect(competitorsForAudience(availableCompetitors(profile()), null)).toHaveLength(2 + SAMPLE_SUPPLIERS.length);
  });
});

describe("trackedCompetitors", () => {
  it("starts with the competitors added at sign-up", () => {
    const p = profile();
    expect(trackedCompetitors(p, availableCompetitors(p)).map((c) => c.name)).toEqual(["Pacific Room Supply", "Island Linens"]);
  });

  it("without sign-up competitors, starts with sample suppliers for the chosen audiences", () => {
    const p = profile({ competitors: [] });
    expect(trackedCompetitors(p, availableCompetitors(p)).map((c) => c.name)).toEqual(["Coastline Linen Co.", "Granite Facility Goods"]);
  });

  it("follows a saved choice, ignoring competitors that no longer exist", () => {
    const p = profile({ trackedCompetitors: ["evergreen-amenities", "gone", "pacific-room-supply"] });
    expect(trackedCompetitors(p, availableCompetitors(p)).map((c) => c.slug)).toEqual(["pacific-room-supply", "evergreen-amenities"]);
  });

  it("respects a saved choice of tracking nobody", () => {
    const p = profile({ trackedCompetitors: [] });
    expect(trackedCompetitors(p, availableCompetitors(p))).toEqual([]);
  });
});

describe("selectedAudience", () => {
  it("accepts one of the account's audiences, and nothing else", () => {
    const p = profile({ audiences: ["Commercial", "Institutional"] });
    expect(selectedAudience("Institutional", p)).toBe("Institutional");
    expect(selectedAudience("Industrial", p)).toBeNull();
    expect(selectedAudience(undefined, p)).toBeNull();
  });
});

describe("profileForSession", () => {
  const jar = (entries: Record<string, string>) => ({ get: (name: string) => (name in entries ? { value: entries[name] } : undefined) });

  it("reads the signed-in account's saved profile", () => {
    expect(profileForSession(jar({ [profileCookieName("jordan@example.com")]: encodeProfile(profile()) }), "jordan@example.com")?.email).toBe(
      "jordan@example.com",
    );
  });

  it("gives the demo account a sample business with competitors", () => {
    expect(profileForSession(jar({}), DEMO_ACCOUNT.email)).toEqual(DEMO_PROFILE);
    expect(DEMO_PROFILE.competitors.length).toBeGreaterThan(0);
  });

  it("does not hand one account another account's profile", () => {
    expect(profileForSession(jar({ ss_profile: encodeProfile(profile()) }), "sam@example.com")).toBeNull();
  });
});
