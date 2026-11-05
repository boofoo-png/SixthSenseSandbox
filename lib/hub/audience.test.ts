import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "./demo-profile";
import type { BusinessProfile } from "./onboarding";
import {
  AUDIENCE_SEGMENTS,
  FILTERS,
  audienceStats,
  defaultAudienceSlug,
  filterSegments,
  findAudience,
  formatPeople,
  isFiltered,
  matchesQuery,
  onboardingAudienceSlug,
  parseAudienceFilters,
  parseView,
  suggestedAudiences,
} from "./audience";

const profileWith = (changes: Partial<BusinessProfile>): BusinessProfile => ({ ...DEMO_PROFILE, ...changes });

describe("AUDIENCE_SEGMENTS", () => {
  it("has the Figma Make's six audiences with unique slugs", () => {
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

  it("only uses filter values that the filters offer", () => {
    for (const segment of AUDIENCE_SEGMENTS) {
      expect(FILTERS.industry.options).toContain(segment.industry);
      expect(FILTERS.age.options).toContain(segment.age);
      expect(FILTERS.region.options).toContain(segment.region);
      expect(FILTERS.interest.options).toContain(segment.interest);
    }
  });
});

describe("formatPeople", () => {
  it("shortens thousands like the Make", () => {
    expect(formatPeople(14_200)).toBe("14.2K");
    expect(formatPeople(18_000)).toBe("18K");
    expect(formatPeople(950)).toBe("950");
  });
});

describe("parseAudienceFilters", () => {
  it("keeps known values and drops anything else", () => {
    expect(
      parseAudienceFilters({ q: "  hotel ", industry: "Hospitality", age: "99+", region: ["Europe"], interest: "Travel" }),
    ).toEqual({ q: "hotel", industry: "Hospitality", age: "", region: "", interest: "Travel" });
  });

  it("caps the search at 80 characters", () => {
    expect(parseAudienceFilters({ q: "x".repeat(200) }).q).toHaveLength(80);
  });

  it("knows when anything is filtered", () => {
    expect(isFiltered(parseAudienceFilters({}))).toBe(false);
    expect(isFiltered(parseAudienceFilters({ q: "care" }))).toBe(true);
    expect(isFiltered(parseAudienceFilters({ age: "25–44" }))).toBe(true);
  });
});

describe("matchesQuery", () => {
  const procurement = AUDIENCE_SEGMENTS[0];
  it("matches the name, category, detail, and keywords, ignoring case", () => {
    expect(matchesQuery(procurement, "")).toBe(true);
    expect(matchesQuery(procurement, "PROCUREMENT")).toBe(true);
    expect(matchesQuery(procurement, "wholesale")).toBe(true);
    expect(matchesQuery(procurement, "slippers")).toBe(false);
  });
});

describe("filterSegments", () => {
  const names = (filters: Parameters<typeof filterSegments>[0]) => filterSegments(filters).map((segment) => segment.name);

  it("shows everything without filters", () => {
    expect(names(parseAudienceFilters({}))).toHaveLength(6);
  });

  it("combines the search with every filter", () => {
    expect(names(parseAudienceFilters({ interest: "Sustainability" }))).toEqual([
      "Conscious Travellers",
      "Eco-conscious Property Managers",
    ]);
    expect(names(parseAudienceFilters({ interest: "Sustainability", region: "North America" }))).toEqual([
      "Eco-conscious Property Managers",
    ]);
    expect(names(parseAudienceFilters({ q: "hotel", age: "18–34" }))).toEqual(["Boutique Hotel Guests"]);
  });

  it("can find nothing", () => {
    expect(names(parseAudienceFilters({ industry: "Healthcare", region: "Europe" }))).toEqual([]);
  });
});

describe("audienceStats", () => {
  it("adds up the people and finds the fastest-growing interest", () => {
    const stats = audienceStats(filterSegments(parseAudienceFilters({ interest: "Sustainability" })));
    expect(stats.reachable).toBe(18_600 + 9_700);
    expect(stats.fastest).toEqual({ growth: 24, interest: "Sustainability" });
  });

  it("has nothing to report for no audiences", () => {
    expect(audienceStats([])).toEqual({ reachable: 0, fastest: null });
  });
});

describe("parseView", () => {
  it("is a list unless the chart is asked for", () => {
    expect(parseView("chart")).toBe("chart");
    expect(parseView("list")).toBe("list");
    expect(parseView(undefined)).toBe("list");
    expect(parseView("table")).toBe("list");
  });
});

describe("default audience", () => {
  it("starts from the first audience chosen during sign-up", () => {
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Commercial"] }))).toBe("hospitality-procurement-teams");
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Institutional", "Commercial"] }))).toBe("senior-living-teams");
    expect(onboardingAudienceSlug(profileWith({ audiences: ["Residential"] }))).toBe("eco-conscious-property-managers");
    expect(onboardingAudienceSlug(null)).toBe("hospitality-procurement-teams");
  });

  it("uses the saved default when it is a known audience", () => {
    expect(defaultAudienceSlug(profileWith({ defaultAudience: "conscious-travellers" }))).toBe("conscious-travellers");
    expect(defaultAudienceSlug(profileWith({ defaultAudience: "sustainability-minded-hotel-buyers" }))).toBe(
      "sustainability-minded-hotel-buyers",
    );
    expect(defaultAudienceSlug(profileWith({ audiences: ["Institutional"], defaultAudience: "gone" }))).toBe(
      "senior-living-teams",
    );
  });
});

describe("suggestedAudiences", () => {
  it("suggests three audiences from the tracked competitors, labelled as suggestions", () => {
    const suggestions = suggestedAudiences(["Pacific Room Supply", "Island Linens", "Coastline Linen Co."]);
    expect(suggestions.map((suggestion) => suggestion.name)).toEqual([
      "Sustainability-minded Hotel Buyers",
      "Value-focused Independent Operators",
      "Care Facility Procurement Leads",
    ]);
    expect(suggestions[0].reason).toBe("Suggested from Pacific Room Supply and Island Linens engagement patterns");
    expect(suggestions[2].reason).toBe("Suggested from Coastline Linen Co. audience overlap");
    expect(suggestions.every((suggestion) => suggestion.category === "Suggested")).toBe(true);
  });

  it("still reads well with one competitor or none", () => {
    expect(suggestedAudiences(["Island Linens"])[0].reason).toBe("Suggested from Island Linens engagement patterns");
    expect(suggestedAudiences([])[0].reason).toBe("Suggested from your industry's engagement patterns");
  });

  it("can be found by slug, like the listed audiences", () => {
    expect(findAudience("care-facility-procurement-leads")?.name).toBe("Care Facility Procurement Leads");
    expect(findAudience("independent-hoteliers")?.name).toBe("Independent Hoteliers");
    expect(findAudience("nope")).toBeNull();
  });
});
