import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "./demo-profile";
import type { BusinessProfile } from "./onboarding";
import { AUDIENCE_SEGMENTS, defaultAudienceSlug, findAudience, onboardingAudienceSlug } from "./audience";

const profileWith = (changes: Partial<BusinessProfile>): BusinessProfile => ({ ...DEMO_PROFILE, ...changes });

describe("AUDIENCE_SEGMENTS", () => {
  it("has six audiences with unique slugs", () => {
    expect(AUDIENCE_SEGMENTS.map((segment) => segment.name)).toEqual([
      "Hospitality Procurement Teams",
      "Conscious Travellers",
      "Independent Hoteliers",
      "Senior Living Teams",
      "Eco-conscious Property Managers",
      "Boutique Hotel Guests",
    ]);
    const slugs = AUDIENCE_SEGMENTS.map((segment) => segment.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("findAudience", () => {
  it("finds a listed audience, or one the old page suggested, by slug", () => {
    expect(findAudience("independent-hoteliers")?.name).toBe("Independent Hoteliers");
    expect(findAudience("care-facility-procurement-leads")?.name).toBe("Care Facility Procurement Leads");
    expect(findAudience("nope")).toBeNull();
    expect(findAudience(undefined)).toBeNull();
  });
});

describe("default audience", () => {
  it("starts from the first audience chosen during sign-up", () => {
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Commercial"] }))).toBe("hospitality-procurement-teams");
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Institutional", "Commercial"] }))).toBe("senior-living-teams");
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Residential"] }))).toBe("eco-conscious-property-managers");
    expect(onboardingAudienceSlug(null)).toBe("hospitality-procurement-teams");
  });

  it("uses a default saved earlier when it is a known audience", () => {
    expect(defaultAudienceSlug(profileWith({ defaultAudience: "conscious-travellers" }))).toBe("conscious-travellers");
    expect(defaultAudienceSlug(profileWith({ defaultAudience: "sustainability-minded-hotel-buyers" }))).toBe(
      "sustainability-minded-hotel-buyers",
    );
    expect(defaultAudienceSlug(profileWith({ audiences: ["Institutional"], defaultAudience: "gone" }))).toBe("senior-living-teams");
  });
});
