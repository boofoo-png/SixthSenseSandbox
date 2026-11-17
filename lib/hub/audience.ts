import type { BusinessProfile } from "./onboarding";

// The default audience that Content Creation and Campaigns write for: one saved earlier on the old
// Audience page, or the one the sign-up audience type points to. The Audience page itself became
// the Audience Trends tracker on 2026-11-16 (lib/hub/audience-trends.ts); its old search,
// filters, and suggestions were removed. Audiences are sample data.

export type AudienceSegment = {
  slug: string;
  name: string;
  /** People in the audience. */
  size: number;
  /** Growth in interest, percent. */
  growth: number;
  category: string;
  industry: string;
  age: string;
  region: string;
  interest: string;
  detail: string;
  keywords: string;
  /** How well the audience fits the business, percent. */
  match: number;
};

export const AUDIENCE_SEGMENTS: readonly AudienceSegment[] = [
  {
    slug: "hospitality-procurement-teams",
    name: "Hospitality Procurement Teams",
    size: 14_200,
    growth: 21,
    category: "Hospitality",
    industry: "Wholesale",
    age: "25–54",
    region: "North America",
    interest: "Cost efficiency",
    detail: "Commercial buyers · 25–54 · North America",
    keywords: "hotel wholesale procurement supplies commercial buyers",
    match: 86,
  },
  {
    slug: "conscious-travellers",
    name: "Conscious Travellers",
    size: 18_600,
    growth: 24,
    category: "Travel",
    industry: "Hospitality",
    age: "25–44",
    region: "United Kingdom",
    interest: "Sustainability",
    detail: "Eco-minded · 25–44 · United Kingdom",
    keywords: "travel sustainability eco friendly hotel guests",
    match: 71,
  },
  {
    slug: "independent-hoteliers",
    name: "Independent Hoteliers",
    size: 8_200,
    growth: 17,
    category: "Hospitality",
    industry: "Hospitality",
    age: "35–54",
    region: "Europe",
    interest: "Guest experience",
    detail: "Hospitality buyers · 35–54 · Europe",
    keywords: "independent boutique hotel owners guest experience",
    match: 82,
  },
  {
    slug: "senior-living-teams",
    name: "Senior Living Teams",
    size: 5_900,
    growth: 11,
    category: "Care",
    industry: "Healthcare",
    age: "35–64",
    region: "North America",
    interest: "Care quality",
    detail: "Care operators · 35–64 · North America",
    keywords: "senior living care homes healthcare operators",
    match: 79,
  },
  {
    slug: "eco-conscious-property-managers",
    name: "Eco-conscious Property Managers",
    size: 9_700,
    growth: 19,
    category: "Property",
    industry: "Real Estate",
    age: "25–44",
    region: "North America",
    interest: "Sustainability",
    detail: "Property operators · 25–44 · North America",
    keywords: "property facilities sustainable building managers",
    match: 74,
  },
  {
    slug: "boutique-hotel-guests",
    name: "Boutique Hotel Guests",
    size: 21_400,
    growth: 15,
    category: "Travel",
    industry: "Hospitality",
    age: "18–34",
    region: "North America",
    interest: "Travel",
    detail: "Experience-led guests · 18–34 · North America",
    keywords: "boutique hotel guests travel experience social",
    match: 63,
  },
];

/** Audiences the old page suggested; a default saved back then can still name one. */
const SUGGESTED_BASE: readonly (AudienceSegment & { fit: number })[] = [
  {
    slug: "sustainability-minded-hotel-buyers",
    name: "Sustainability-minded Hotel Buyers",
    size: 6_400,
    growth: 26,
    category: "Suggested",
    industry: "Hospitality",
    age: "25–54",
    region: "North America",
    interest: "Sustainability",
    detail: "Hotel buyers · 25–54 · North America",
    keywords: "sustainable hotel buyers eco amenities procurement",
    match: 93,
    fit: 93,
  },
  {
    slug: "value-focused-independent-operators",
    name: "Value-focused Independent Operators",
    size: 7_100,
    growth: 18,
    category: "Suggested",
    industry: "Hospitality",
    age: "35–54",
    region: "North America",
    interest: "Cost efficiency",
    detail: "Independent operators · 35–54 · North America",
    keywords: "independent operators value pricing bulk orders",
    match: 88,
    fit: 88,
  },
  {
    slug: "care-facility-procurement-leads",
    name: "Care Facility Procurement Leads",
    size: 4_300,
    growth: 14,
    category: "Suggested",
    industry: "Healthcare",
    age: "35–64",
    region: "North America",
    interest: "Care quality",
    detail: "Care procurement · 35–64 · North America",
    keywords: "care facility procurement senior living supplies",
    match: 84,
    fit: 84,
  },
];

/** The four filters, as in the Make. An empty value means "all". */
/** Sign-up audience types mapped to the closest listed audience. */
const FROM_ONBOARDING: Record<string, string> = {
  Commercial: "hospitality-procurement-teams",
  Industrial: "hospitality-procurement-teams",
  Institutional: "senior-living-teams",
  Residential: "eco-conscious-property-managers",
};

/** The audience the first sign-up audience type points to (procurement teams without one). */
export function onboardingAudienceSlug(profile: BusinessProfile | null): string {
  const first = profile?.audiences.find((audience) => audience in FROM_ONBOARDING);
  return first ? FROM_ONBOARDING[first] : AUDIENCE_SEGMENTS[0].slug;
}

/** A listed or suggested audience by slug. */
export function findAudience(slug: string | undefined): AudienceSegment | null {
  if (!slug) return null;
  return [...AUDIENCE_SEGMENTS, ...SUGGESTED_BASE].find((segment) => segment.slug === slug) ?? null;
}

/** The saved default audience, or the one sign-up points to. */
export function defaultAudienceSlug(profile: BusinessProfile | null): string {
  const saved = profile?.defaultAudience;
  return saved && findAudience(saved) ? saved : onboardingAudienceSlug(profile);
}
