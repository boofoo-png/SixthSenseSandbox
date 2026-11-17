import { decodeCookieJson, encodeCookieJson, isRecord } from "./cookie-json";
import { areaLabel, areasFor, regionsFor, subdivisionsFor, type TargetRegion } from "./target-regions";
import { EMAIL_PATTERN, MAX_LINK, MAX_TEXT } from "./text";

// Second Create an Account page ("Tell us about your industry"), from the mid-fi and, since
// 2026-11-16, the team's Figma Make: one industry with its sub-industry, target regions in four
// levels (lib/hub/target-regions.ts), and one general audience, all as drop-down lists.
// In the prototype, social accounts, documents, and team invites are only recorded:
// nothing is connected, uploaded, or sent (see docs/DECISIONS.md).

/** The Make's industries, each with its sub-industries. */
export const SUB_INDUSTRIES_BY_INDUSTRY: Record<string, readonly string[]> = {
  "Agriculture and Forestry": ["Crop production", "Livestock and dairy", "Forestry and logging", "Agricultural technology", "Farm supplies and equipment"],
  "Arts, Entertainment and Media": ["Film and television", "Music and audio", "Publishing", "Performing arts", "Digital media and creators"],
  Automotive: ["Vehicle manufacturing", "Dealerships and sales", "Parts and accessories", "Repair and maintenance", "Mobility and electric vehicles"],
  "Beauty and Personal Care": ["Cosmetics", "Skincare", "Haircare and salons", "Spa and wellness", "Personal care products"],
  "Business and Professional Services": ["Consulting", "Accounting and bookkeeping", "Human resources and recruitment", "Marketing and advertising", "Facilities and office services"],
  Construction: ["Residential construction", "Commercial construction", "Civil infrastructure", "Specialty contractors", "Building materials"],
  Education: ["Early childhood education", "Primary and secondary education", "Higher education", "Professional training", "Education technology"],
  "Energy and Utilities": ["Renewable energy", "Oil and gas", "Electric utilities", "Water and waste services", "Energy efficiency"],
  "Finance and Insurance": ["Banking", "Insurance", "Investments and wealth management", "Financial technology", "Accounting and tax services"],
  "Food and Beverage": ["Restaurants and caf\u00e9s", "Food manufacturing", "Beverage production", "Catering and food service", "Specialty and packaged foods"],
  "Government and Public Sector": ["Municipal government", "Provincial or state government", "Federal government", "Public safety", "Public administration"],
  Healthcare: ["Hospitals and clinics", "Senior living and care", "Dental services", "Mental health services", "Medical devices and supplies", "Pharmaceuticals"],
  "Hospitality and Tourism": ["Hotels and accommodation", "Travel agencies and tour operators", "Events and venues", "Attractions and recreation", "Hospitality supplies"],
  Legal: ["Corporate law", "Family law", "Real estate law", "Litigation", "Legal technology and services"],
  Manufacturing: ["Consumer goods", "Industrial equipment", "Electronics", "Textiles and apparel", "Chemicals and materials"],
  "Nonprofit and Charities": ["Community services", "Health charities", "Education and research", "Environmental organizations", "Arts and culture organizations"],
  "Real Estate": ["Residential real estate", "Commercial real estate", "Property management", "Real estate development", "Real estate technology"],
  Retail: ["Brick-and-mortar retail", "E-commerce", "Fashion and apparel", "Home and garden", "Specialty retail"],
  "Sports and Fitness": ["Gyms and fitness studios", "Sports clubs and teams", "Sporting goods", "Outdoor recreation", "Health and performance coaching"],
  Technology: ["Software as a service", "Artificial intelligence", "Cybersecurity", "Cloud and infrastructure", "Hardware and electronics", "IT services and consulting"],
  Telecommunications: ["Wireless services", "Internet service providers", "Network infrastructure", "Unified communications", "Telecommunications equipment"],
  "Transportation and Logistics": ["Freight and shipping", "Warehousing and distribution", "Courier and delivery", "Public transportation", "Logistics technology"],
  Wholesale: ["Durable goods", "Non-durable goods", "Food and beverage distribution", "Hospitality and restaurant supplies", "Industrial and commercial supplies"],
};

export const INDUSTRIES: readonly string[] = Object.keys(SUB_INDUSTRIES_BY_INDUSTRY);

/** The sub-industries of an industry (none for one not on the list). */
export function subIndustriesFor(industry: string): readonly string[] {
  return SUB_INDUSTRIES_BY_INDUSTRY[industry] ?? [];
}

export const AUDIENCES = ["Residential", "Commercial", "Industrial", "Institutional"] as const;

export const GOALS = [
  { id: "traffic", label: "Drive website traffic" },
  { id: "engagement", label: "Boost engagement (likes, comments, shares)" },
  { id: "competitors", label: "Understand my competitors better" },
  { id: "leads", label: "Generate leads" },
  { id: "following", label: "Grow social following" },
  { id: "trends", label: "Find trending topics in my industry" },
  { id: "awareness", label: "Build brand awareness" },
  { id: "repeat", label: "Increase repeat customers" },
  { id: "roas", label: "Improve return on ad spend" },
  { id: "conversions", label: "Increase conversions by X%" },
  { id: "reviews", label: "Improve customer reviews and reputation" },
  { id: "new-market", label: "Enter a new region or audience" },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];

export const PLATFORMS = ["Instagram", "TikTok", "Facebook", "X (Twitter)", "LinkedIn", "YouTube", "Pinterest"] as const;

export const DOCUMENT_TYPES = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"] as const;
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export const MAX_CONVERSION_TARGET = 35;
export const MAX_ROWS = 5;
const MAX_INVITES = 10;
const MAX_DOCUMENTS = 10;

/** The form as typed: every value is a string (or list) so it can be shown again. */
export type OnboardingDraft = {
  industry: string;
  subIndustry: string;
  regions: TargetRegion[];
  /** One general audience (the Make's "Choose a category"). */
  audience: string;
  goals: string[];
  conversionTarget: string;
  website: string;
  /** `verified`: Connect was used on this row (simulated in the prototype). */
  socials: { platform: string; handle: string; verified?: boolean }[];
  analyticsConsent: boolean;
  competitors: { name: string; website: string }[];
  reportLinks: string[];
  /** File names only; files are not uploaded in the prototype. */
  documents: string[];
  invites: string;
  /** Link from Generate a link, if one was made. */
  inviteLink?: string;
};

/** The saved answers, tidied. */
export type BusinessProfile = {
  email: string;
  industries: string[];
  subIndustry?: string;
  regions: TargetRegion[];
  /** One general audience since 2026-11-16 (older profiles may have several). */
  audiences: string[];
  goals: GoalId[];
  conversionTarget?: number;
  website: string;
  socials: { platform: string; handle: string; verified: boolean }[];
  competitors: { name: string; website: string }[];
  reportLinks: string[];
  documents: string[];
  invites: string[];
  inviteLink?: string;
  /** Slugs of the competitors chosen on Research Competitors; unset means the default choice. */
  trackedCompetitors?: string[];
  /** Slug of the audience saved as the default on the Audience page; unset means the sign-up one. */
  defaultAudience?: string;
};

export type OnboardingErrors = Record<string, string>;

export type OnboardingResult = { ok: true; profile: BusinessProfile } | { ok: false; errors: OnboardingErrors };

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    industry: "",
    subIndustry: "",
    regions: [{ country: "Canada", area: "", region: "", subdivision: "" }],
    audience: "",
    goals: [],
    conversionTarget: "10",
    website: "",
    socials: [{ platform: "Instagram", handle: "" }],
    analyticsConsent: false,
    competitors: [{ name: "", website: "" }],
    reportLinks: [""],
    documents: [],
    invites: "",
  };
}

/** Read the submitted form. Repeated rows use repeated field names, kept in order. */
export function readOnboardingForm(form: FormData): OnboardingDraft {
  const all = (key: string) => form.getAll(key).map((value) => (typeof value === "string" ? value : ""));
  const one = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };
  const zip = <T>(keys: string[], build: (values: string[]) => T): T[] => {
    const columns = keys.map(all);
    return columns[0].map((_, index) => build(columns.map((column) => column[index] ?? "")));
  };

  return {
    industry: one("industry"),
    subIndustry: one("subIndustry"),
    regions: zip(["regionCountry", "regionArea", "regionRegion", "regionSubdivision"], ([country, area, region, subdivision]) => ({
      country,
      area,
      region,
      subdivision,
    })),
    audience: one("audience"),
    goals: all("goal"),
    conversionTarget: one("conversionTarget"),
    website: one("website"),
    socials: zip(["socialPlatform", "socialHandle", "socialVerified"], ([platform, handle, verified]) => ({
      platform,
      handle,
      verified: verified === "1",
    })),
    analyticsConsent: form.get("analyticsConsent") !== null,
    competitors: zip(["competitorName", "competitorWebsite"], ([name, website]) => ({ name, website })),
    reportLinks: all("reportLink"),
    documents: all("documentName"),
    invites: one("invites"),
    inviteLink: one("inviteLink"),
  };
}

/** Encode step 2 answers for the draft cookie; null when they are too big to keep. */
export function encodeOnboardingDraft(draft: OnboardingDraft): string | null {
  return encodeCookieJson(draft);
}

const isStringList = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === "string");
const isRowList = (items: unknown, keys: string[]) =>
  Array.isArray(items) && items.every((item) => isRecord(item) && keys.every((key) => typeof item[key] === "string"));

function isOnboardingDraft(value: unknown): value is OnboardingDraft {
  if (!isRecord(value)) return false;
  const d = value as Partial<OnboardingDraft>;
  return (
    typeof d.industry === "string" &&
    typeof d.subIndustry === "string" &&
    isRowList(d.regions, ["country", "area", "region", "subdivision"]) &&
    typeof d.audience === "string" &&
    isStringList(d.goals) &&
    typeof d.conversionTarget === "string" &&
    typeof d.website === "string" &&
    isRowList(d.socials, ["platform", "handle"]) &&
    typeof d.analyticsConsent === "boolean" &&
    isRowList(d.competitors, ["name", "website"]) &&
    isStringList(d.reportLinks) &&
    isStringList(d.documents) &&
    typeof d.invites === "string" &&
    (d.inviteLink === undefined || typeof d.inviteLink === "string")
  );
}

/** Read the draft cookie; null when it is missing or not a draft. */
export function decodeOnboardingDraft(value: string | undefined): OnboardingDraft | null {
  return decodeCookieJson(value, isOnboardingDraft);
}

const clip = (value: string) => value.trim().slice(0, MAX_TEXT);
const LINK_TOO_LONG = `Use a link of ${MAX_LINK} characters or fewer`;
const HANDLE = /^@?[A-Za-z0-9._]{1,30}$/;

/** True for a social handle like "@yourbrand" (letters, numbers, dots, underscores). */
export function isValidHandle(handle: string): boolean {
  return HANDLE.test(handle.trim());
}

/** "Example.com/shop" -> "https://example.com/shop"; null when it is not a website. */
export function normalizeWebsite(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.protocol}//${url.host}${path}${url.search}`;
  } catch {
    return null;
  }
}

/** Check the second Create an Account page and return the business profile, or a message per problem. */
export function validateOnboarding(draft: OnboardingDraft, email: string): OnboardingResult {
  const errors: OnboardingErrors = {};

  const industry = INDUSTRIES.includes(draft.industry) ? draft.industry : null;
  if (!industry) errors.industry = "Choose an industry";
  const subIndustry = industry && subIndustriesFor(industry).includes(draft.subIndustry) ? draft.subIndustry : null;
  if (industry && !subIndustry) errors.subIndustry = "Choose a sub-industry";

  const regions: TargetRegion[] = [];
  if (draft.regions.length > MAX_ROWS) errors.regions = `Add up to ${MAX_ROWS} regions`;
  draft.regions.slice(0, MAX_ROWS).forEach((row, index) => {
    if (index > 0 && !row.area) return;
    const field = (name: string) => `regions.${index}.${name}`;
    if (areasFor(row.country).length === 0) errors[field("country")] = "Choose a country";
    else if (!areasFor(row.country).includes(row.area)) errors[field("area")] = areaLabel(row.country);
    else if (!regionsFor(row.country, row.area).includes(row.region)) errors[field("region")] = "Choose a region";
    else if (!subdivisionsFor(row.area, row.region).includes(row.subdivision)) errors[field("subdivision")] = "Choose a subdivision";
    else regions.push({ country: row.country, area: row.area, region: row.region, subdivision: row.subdivision });
  });

  const audience = (AUDIENCES as readonly string[]).includes(draft.audience) ? draft.audience : null;
  if (!audience) errors.audience = "Choose an audience";

  const goals = GOALS.map((goal) => goal.id).filter((id) => draft.goals.includes(id));
  if (goals.length === 0) errors.goals = "Choose at least one goal";
  let conversionTarget: number | undefined;
  if (goals.includes("conversions")) {
    const target = Number(draft.conversionTarget);
    if (!Number.isInteger(target) || target < 1 || target > MAX_CONVERSION_TARGET) {
      errors.conversionTarget = `Choose a target between 1% and ${MAX_CONVERSION_TARGET}%`;
    } else {
      conversionTarget = target;
    }
  }

  const website = normalizeWebsite(draft.website);
  if (!draft.website.trim()) errors.website = "Enter your website";
  else if (draft.website.trim().length > MAX_LINK) errors.website = LINK_TOO_LONG;
  else if (!website) errors.website = "Enter a website like example.com";

  const socials: BusinessProfile["socials"] = [];
  if (draft.socials.length > MAX_ROWS) errors.socials = `Add up to ${MAX_ROWS} accounts`;
  draft.socials.slice(0, MAX_ROWS).forEach((row, index) => {
    const handle = row.handle.trim();
    if (!handle) return;
    if (!(PLATFORMS as readonly string[]).includes(row.platform)) {
      errors[`socials.${index}.platform`] = "Choose a platform";
    } else if (!HANDLE.test(handle)) {
      errors[`socials.${index}.handle`] = "Enter a handle like @yourbrand";
    } else {
      socials.push({ platform: row.platform, handle: handle.startsWith("@") ? handle : `@${handle}`, verified: row.verified === true });
    }
  });
  if (socials.length > 0 && !draft.analyticsConsent) {
    errors.analyticsConsent = "Tick the box to let Sixth Sense read your analytics, or remove the accounts";
  }

  const competitors: BusinessProfile["competitors"] = [];
  if (draft.competitors.length > MAX_ROWS) errors.competitors = `Add up to ${MAX_ROWS} competitors`;
  draft.competitors.slice(0, MAX_ROWS).forEach((row, index) => {
    const name = clip(row.name);
    if (!name && !row.website.trim()) return;
    if (!name) errors[`competitors.${index}.name`] = "Enter the competitor's name";
    let site = "";
    if (row.website.trim().length > MAX_LINK) {
      errors[`competitors.${index}.website`] = LINK_TOO_LONG;
    } else if (row.website.trim()) {
      const normalized = normalizeWebsite(row.website);
      if (!normalized) errors[`competitors.${index}.website`] = "Enter a website like example.com";
      else site = normalized;
    }
    if (name) competitors.push({ name, website: site });
  });

  const reportLinks: string[] = [];
  draft.reportLinks.slice(0, 3).forEach((link, index) => {
    const text = link.trim();
    if (!text) return;
    if (text.length > MAX_LINK) {
      errors[`reportLinks.${index}`] = LINK_TOO_LONG;
    } else if (!/^https?:\/\//i.test(text) || !normalizeWebsite(text)) {
      errors[`reportLinks.${index}`] = "Enter a link that starts with https://";
    } else {
      reportLinks.push(text);
    }
  });

  const documents = draft.documents.map(clip).filter(Boolean);
  if (documents.length > MAX_DOCUMENTS) errors.documents = `Add up to ${MAX_DOCUMENTS} files`;
  else if (documents.some((name) => !(DOCUMENT_TYPES as readonly string[]).includes(name.split(".").pop()?.toLowerCase() ?? ""))) {
    errors.documents = "Only PDF, PNG, JPG, DOCX, or XLSX files";
  }

  const invites = draft.invites
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const badInvite = invites.find((value) => value.length > MAX_TEXT || !EMAIL_PATTERN.test(value));
  if (badInvite) errors.invites = `Check this email address: ${badInvite}`;
  else if (invites.length > MAX_INVITES) errors.invites = `Invite up to ${MAX_INVITES} people`;

  if (Object.keys(errors).length > 0 || !website || !industry || !subIndustry || !audience) {
    return { ok: false, errors };
  }

  const inviteLink = draft.inviteLink?.trim() ?? "";
  const keepInviteLink = /^https?:\/\/\S+\/create-account\?invite=[\w-]+$/.test(inviteLink) && inviteLink.length <= MAX_LINK + 100;

  const profile: BusinessProfile = {
    email,
    industries: [industry],
    subIndustry,
    regions,
    audiences: [audience],
    goals,
    ...(conversionTarget !== undefined ? { conversionTarget } : {}),
    website,
    socials,
    competitors,
    reportLinks,
    documents,
    invites: [...new Set(invites)],
    ...(keepInviteLink ? { inviteLink } : {}),
  };
  // Browsers silently drop cookies over about 4 KB, which would send the person back to this
  // page forever; say so instead of saving something that cannot be kept.
  if (encodeCookieJson(profile) === null) {
    return { ok: false, errors: { form: "These answers are too long to save. Shorten some links or remove a few rows." } };
  }
  return { ok: true, profile };
}
