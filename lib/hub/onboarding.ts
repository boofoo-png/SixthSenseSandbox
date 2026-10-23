import { COUNTRIES, REGIONS, isCountryCode, type CountryCode } from "./regions";

// Second Create an Account page from the mid-fi ("Tell us about your industry", "ACCOUNT POP UP X3").
// In the prototype, social accounts, documents, and team invites are only recorded:
// nothing is connected, uploaded, or sent (see docs/DECISIONS.md).

export const INDUSTRIES = [
  "Food and Beverage",
  "Hospitality",
  "Retail",
  "Wholesale",
  "Manufacturing",
  "Technology",
  "Healthcare",
  "Professional Services",
] as const;

export const SUB_INDUSTRIES = [
  "Durable goods",
  "Non-durable goods",
  "Online shops",
  "Hotel and accommodation supplies",
  "Restaurant and food service supplies",
  "Other",
] as const;

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

export const PLATFORMS = ["Instagram", "TikTok", "Facebook", "X (Twitter)", "LinkedIn", "YouTube"] as const;

export const DOCUMENT_TYPES = ["pdf", "png", "jpg", "jpeg", "docx", "xlsx"] as const;
export const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
export const MAX_CONVERSION_TARGET = 35;
export const MAX_ROWS = 5;
const MAX_TEXT = 100;
const MAX_INVITES = 10;
const MAX_DOCUMENTS = 10;

/** The form as typed: every value is a string (or list) so it can be shown again. */
export type OnboardingDraft = {
  industries: string[];
  subIndustry: string;
  regions: { country: string; province: string; area: string }[];
  audience: string;
  goals: string[];
  conversionTarget: string;
  website: string;
  socials: { platform: string; handle: string }[];
  analyticsConsent: boolean;
  competitors: { name: string; website: string }[];
  reportLinks: string[];
  /** File names only; files are not uploaded in the prototype. */
  documents: string[];
  invites: string;
};

/** The saved answers, tidied. */
export type BusinessProfile = {
  email: string;
  industries: string[];
  subIndustry?: string;
  regions: { country: CountryCode; province: string; area: string }[];
  audience: string;
  goals: GoalId[];
  conversionTarget?: number;
  website: string;
  socials: { platform: string; handle: string }[];
  competitors: { name: string; website: string }[];
  reportLinks: string[];
  documents: string[];
  invites: string[];
};

export type OnboardingErrors = Record<string, string>;

export type OnboardingResult = { ok: true; profile: BusinessProfile } | { ok: false; errors: OnboardingErrors };

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    industries: [],
    subIndustry: "",
    regions: [{ country: "CA", province: "", area: "" }],
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
    industries: all("industry"),
    subIndustry: one("subIndustry"),
    regions: zip(["regionCountry", "regionProvince", "regionArea"], ([country, province, area]) => ({ country, province, area })),
    audience: one("audience"),
    goals: all("goal"),
    conversionTarget: one("conversionTarget"),
    website: one("website"),
    socials: zip(["socialPlatform", "socialHandle"], ([platform, handle]) => ({ platform, handle })),
    analyticsConsent: form.get("analyticsConsent") !== null,
    competitors: zip(["competitorName", "competitorWebsite"], ([name, website]) => ({ name, website })),
    reportLinks: all("reportLink"),
    documents: all("documentName"),
    invites: one("invites"),
  };
}

/** Largest cookie value we write; browsers allow about 4096 bytes per cookie. */
const MAX_COOKIE_VALUE = 3800;

/** Encode step 2 answers for the draft cookie; null when they are too big to keep. */
export function encodeOnboardingDraft(draft: OnboardingDraft): string | null {
  const value = Buffer.from(JSON.stringify(draft)).toString("base64url");
  return value.length <= MAX_COOKIE_VALUE ? value : null;
}

/** Read the draft cookie; null when it is missing or not a draft. */
export function decodeOnboardingDraft(value: string | undefined): OnboardingDraft | null {
  if (!value) return null;
  try {
    const d = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<OnboardingDraft>;
    const strings = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === "string");
    const rows = (items: unknown, keys: string[]) =>
      Array.isArray(items) &&
      items.every((item) => item && typeof item === "object" && keys.every((key) => typeof (item as Record<string, unknown>)[key] === "string"));
    const ok =
      strings(d.industries) &&
      typeof d.subIndustry === "string" &&
      rows(d.regions, ["country", "province", "area"]) &&
      typeof d.audience === "string" &&
      strings(d.goals) &&
      typeof d.conversionTarget === "string" &&
      typeof d.website === "string" &&
      rows(d.socials, ["platform", "handle"]) &&
      typeof d.analyticsConsent === "boolean" &&
      rows(d.competitors, ["name", "website"]) &&
      strings(d.reportLinks) &&
      strings(d.documents) &&
      typeof d.invites === "string";
    return ok ? (d as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

const clip = (value: string) => value.trim().slice(0, MAX_TEXT);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDLE = /^@?[A-Za-z0-9._]{1,30}$/;

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

  const industries = [...new Set(draft.industries)].filter((value) => (INDUSTRIES as readonly string[]).includes(value));
  if (industries.length === 0) errors.industries = "Choose at least one industry";
  const subIndustry = (SUB_INDUSTRIES as readonly string[]).includes(draft.subIndustry) ? draft.subIndustry : undefined;

  const regions: BusinessProfile["regions"] = [];
  if (draft.regions.length > MAX_ROWS) errors.regions = `Add up to ${MAX_ROWS} regions`;
  draft.regions.slice(0, MAX_ROWS).forEach((row, index) => {
    const area = clip(row.area);
    if (index > 0 && !row.province && !area) return;
    if (!isCountryCode(row.country)) {
      errors[`regions.${index}.country`] = "Choose a country";
      return;
    }
    const label = COUNTRIES.find((country) => country.code === row.country)?.regionLabel.toLowerCase() ?? "province";
    if (!REGIONS[row.country].some((region) => region.code === row.province)) {
      errors[`regions.${index}.province`] = `Choose a ${label}`;
      return;
    }
    regions.push({ country: row.country, province: row.province, area });
  });

  const audience = (AUDIENCES as readonly string[]).includes(draft.audience) ? draft.audience : "";
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
      socials.push({ platform: row.platform, handle: handle.startsWith("@") ? handle : `@${handle}` });
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
    if (row.website.trim()) {
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
    if (!/^https?:\/\//i.test(text) || !normalizeWebsite(text)) {
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
  const badInvite = invites.find((value) => !EMAIL.test(value));
  if (badInvite) errors.invites = `Check this email address: ${badInvite}`;
  else if (invites.length > MAX_INVITES) errors.invites = `Invite up to ${MAX_INVITES} people`;

  if (Object.keys(errors).length > 0 || !website) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    profile: {
      email,
      industries,
      ...(subIndustry ? { subIndustry } : {}),
      regions,
      audience,
      goals,
      ...(conversionTarget !== undefined ? { conversionTarget } : {}),
      website,
      socials,
      competitors,
      reportLinks,
      documents,
      invites: [...new Set(invites)],
    },
  };
}
