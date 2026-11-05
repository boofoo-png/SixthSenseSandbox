import type { BusinessProfile } from "./onboarding";

// Target Audience (docs/FUNCTIONALITY.md): trend search by category, filters, list or chart,
// a default audience, and suggested audiences. Audiences and figures come from the team's Figma
// Make "Marketing Intelligence Hub" and are sample data; suggestions are templates, not AI.

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

export type SuggestedAudience = AudienceSegment & { reason: string; fit: number };

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

const SUGGESTED_BASE: readonly (Omit<SuggestedAudience, "reason"> & { basis: "engagement" | "pricing" | "overlap" })[] = [
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
    basis: "engagement",
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
    basis: "pricing",
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
    basis: "overlap",
  },
];

/** The four filters, as in the Make. An empty value means "all". */
export const FILTERS = {
  industry: { label: "Industry", all: "All industries", options: ["Hospitality", "Wholesale", "Healthcare", "Real Estate"] },
  age: { label: "Age", all: "All ages", options: ["18–34", "25–44", "25–54", "35–54", "35–64"] },
  region: { label: "Region", all: "All regions", options: ["North America", "United Kingdom", "Europe"] },
  interest: {
    label: "Interest",
    all: "All interests",
    options: ["Sustainability", "Cost efficiency", "Guest experience", "Care quality", "Travel"],
  },
} as const;

export type FilterKey = keyof typeof FILTERS;
export const FILTER_KEYS = Object.keys(FILTERS) as FilterKey[];
export type AudienceFilters = { q: string } & Record<FilterKey, string>;

const MAX_QUERY = 80;

type Params = Record<string, string | string[] | undefined>;
const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/** The search and filters from the address; unknown values are dropped. */
export function parseAudienceFilters(params: Params): AudienceFilters {
  const filters = { q: single(params.q).trim().slice(0, MAX_QUERY) } as AudienceFilters;
  for (const key of FILTER_KEYS) {
    const value = single(params[key]);
    filters[key] = (FILTERS[key].options as readonly string[]).includes(value) ? value : "";
  }
  return filters;
}

export function isFiltered(filters: AudienceFilters): boolean {
  return filters.q !== "" || FILTER_KEYS.some((key) => filters[key] !== "");
}

/** True when the search text appears in the audience's name, category, detail, or keywords. */
export function matchesQuery(segment: AudienceSegment, query: string): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  return `${segment.name} ${segment.category} ${segment.detail} ${segment.keywords}`.toLowerCase().includes(text);
}

/** The listed audiences that match the search and every filter. */
export function filterSegments(filters: AudienceFilters): AudienceSegment[] {
  return AUDIENCE_SEGMENTS.filter(
    (segment) => matchesQuery(segment, filters.q) && FILTER_KEYS.every((key) => !filters[key] || segment[key] === filters[key]),
  );
}

/** "14.2K" for 14,200. */
export function formatPeople(count: number): string {
  if (count < 1000) return String(count);
  return `${Number((count / 1000).toFixed(1))}K`;
}

export function audienceStats(segments: readonly AudienceSegment[]): {
  reachable: number;
  fastest: { growth: number; interest: string } | null;
} {
  const reachable = segments.reduce((total, segment) => total + segment.size, 0);
  const top = segments.reduce<AudienceSegment | null>((best, segment) => (!best || segment.growth > best.growth ? segment : best), null);
  return { reachable, fastest: top ? { growth: top.growth, interest: top.interest } : null };
}

export type AudienceView = "list" | "chart";
export function parseView(value: string | string[] | undefined): AudienceView {
  return value === "chart" ? "chart" : "list";
}

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

/** Suggested audiences, explained by the competitors they come from (templates). */
export function suggestedAudiences(competitorNames: readonly string[]): SuggestedAudience[] {
  const [first, second, third] = competitorNames;
  const pair = first && second ? `${first} and ${second}` : first;
  return SUGGESTED_BASE.map(({ basis, ...suggestion }) => {
    let reason: string;
    if (basis === "engagement") reason = `Suggested from ${pair ?? "your industry's"} engagement patterns`;
    else if (basis === "pricing") reason = "Suggested from competitor pricing and procurement content";
    else reason = `Suggested from ${third ?? first ?? "your competitors'"} audience overlap`;
    return { ...suggestion, reason };
  });
}

/** A listed or suggested audience by slug. */
export function findAudience(slug: string | undefined): AudienceSegment | null {
  if (!slug) return null;
  return [...AUDIENCE_SEGMENTS, ...suggestedAudiences([])].find((segment) => segment.slug === slug) ?? null;
}

/** The saved default audience, or the one sign-up points to. */
export function defaultAudienceSlug(profile: BusinessProfile | null): string {
  const saved = profile?.defaultAudience;
  return saved && findAudience(saved) ? saved : onboardingAudienceSlug(profile);
}
