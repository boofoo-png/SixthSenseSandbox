import { describe, expect, it } from "vitest";
import {
  AUDIENCES,
  GOALS,
  INDUSTRIES,
  PLATFORMS,
  decodeOnboardingDraft,
  emptyOnboardingDraft,
  encodeOnboardingDraft,
  readOnboardingForm,
  subIndustriesFor,
  validateOnboarding,
  type OnboardingDraft,
} from "./onboarding";

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    ...emptyOnboardingDraft(),
    industry: "Wholesale",
    subIndustry: "Hospitality and restaurant supplies",
    regions: [{ country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" }],
    audience: "Commercial",
    goals: ["traffic", "conversions"],
    conversionTarget: "10",
    website: "HarbourlineSupply.ca",
    socials: [{ platform: "Instagram", handle: "@harbourline.supply" }],
    analyticsConsent: true,
    ...overrides,
  };
}

function errorsOf(value: OnboardingDraft) {
  const result = validateOnboarding(value, "jordan@example.com");
  if (result.ok) throw new Error("expected errors");
  return result.errors;
}

describe("the Figma Make choices", () => {
  it("offers the four general audiences", () => {
    expect([...AUDIENCES]).toEqual(["Residential", "Commercial", "Industrial", "Institutional"]);
  });

  it("offers the twelve goals, including the conversion target", () => {
    expect(GOALS).toHaveLength(12);
    expect(GOALS.find((goal) => goal.id === "conversions")?.label).toBe("Increase conversions by X%");
  });

  it("has the Make's 23 industries, each with its own sub-industries", () => {
    expect(INDUSTRIES).toHaveLength(23);
    expect(INDUSTRIES).toEqual(expect.arrayContaining(["Wholesale", "Retail", "Hospitality and Tourism", "Food and Beverage"]));
    expect(subIndustriesFor("Hospitality and Tourism")).toContain("Hospitality supplies");
    expect(subIndustriesFor("Wholesale")).toContain("Hospitality and restaurant supplies");
    expect(subIndustriesFor("Space Mining")).toEqual([]);
  });

  it("offers Pinterest among the platforms", () => {
    expect(PLATFORMS).toContain("Pinterest");
  });
});

describe("validateOnboarding", () => {
  it("accepts a complete answer and tidies it into a business profile", () => {
    const result = validateOnboarding(
      draft({
        competitors: [{ name: "Coastal Linen Co.", website: "coastal-linen.example" }],
        reportLinks: ["https://example.com/q3-report"],
        documents: ["Q3 ad results.xlsx"],
        invites: "sam@example.com, ana@example.com",
      }),
      "jordan@example.com",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile).toMatchObject({
      email: "jordan@example.com",
      industries: ["Wholesale"],
      subIndustry: "Hospitality and restaurant supplies",
      regions: [{ country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" }],
      audiences: ["Commercial"],
      goals: ["traffic", "conversions"],
      conversionTarget: 10,
      website: "https://harbourlinesupply.ca",
      socials: [{ platform: "Instagram", handle: "@harbourline.supply" }],
      competitors: [{ name: "Coastal Linen Co.", website: "https://coastal-linen.example" }],
      reportLinks: ["https://example.com/q3-report"],
      documents: ["Q3 ad results.xlsx"],
      invites: ["sam@example.com", "ana@example.com"],
    });
  });

  it("requires an industry, a region, an audience, a goal, and the website", () => {
    const errors = errorsOf({ ...emptyOnboardingDraft() });
    expect(errors).toMatchObject({
      industry: "Choose an industry",
      "regions.0.area": "Choose a province or territory",
      audience: "Choose an audience",
      goals: "Choose at least one goal",
      website: "Enter your website",
    });
  });

  it("only asks for a conversion target when that goal is chosen", () => {
    expect(validateOnboarding(draft({ goals: ["traffic"], conversionTarget: "" }), "a@b.co").ok).toBe(true);
    expect(errorsOf(draft({ conversionTarget: "50" })).conversionTarget).toBe("Choose a target between 1% and 35%");
  });

  it("needs a sub-industry from the chosen industry", () => {
    expect(errorsOf(draft({ subIndustry: "" })).subIndustry).toBe("Choose a sub-industry");
    expect(errorsOf(draft({ subIndustry: "Hospitality supplies" })).subIndustry).toBe("Choose a sub-industry");
  });

  it("checks each level of a region against the one above it, row by row", () => {
    const bc = { country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" };
    const errors = errorsOf(
      draft({
        regions: [bc, { country: "United States", area: "British Columbia", region: "", subdivision: "" }, { ...bc, region: "Fraser Valley" }],
      }),
    );
    expect(errors["regions.1.area"]).toBe("Choose a state");
    expect(errors["regions.2.subdivision"]).toBe("Choose a subdivision");
    expect(errorsOf(draft({ regions: [{ ...bc, country: "Atlantis" }] }))["regions.0.country"]).toBe("Choose a country");
    expect(errorsOf(draft({ regions: [{ ...bc, region: "Nowhere" }] }))["regions.0.region"]).toBe("Choose a region");
  });

  it("skips empty extra rows", () => {
    const result = validateOnboarding(
      draft({
        regions: [
          { country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Any area in Lower Mainland" },
          { country: "Canada", area: "", region: "", subdivision: "" },
        ],
        socials: [{ platform: "Instagram", handle: "" }],
        analyticsConsent: false,
        competitors: [{ name: "", website: "" }],
        reportLinks: [""],
      }),
      "a@b.co",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.regions).toHaveLength(1);
    expect(result.profile.socials).toEqual([]);
    expect(result.profile.competitors).toEqual([]);
    expect(result.profile.reportLinks).toEqual([]);
  });

  it("needs permission to read analytics before saving social accounts", () => {
    expect(errorsOf(draft({ analyticsConsent: false })).analyticsConsent).toBe(
      "Tick the box to let Sixth Sense read your analytics, or remove the accounts",
    );
  });

  it("checks handles, websites, links, and invite emails", () => {
    const errors = errorsOf(
      draft({
        website: "not a website",
        socials: [{ platform: "Instagram", handle: "has spaces!" }],
        competitors: [{ name: "", website: "rival.example" }],
        reportLinks: ["ftp://files"],
        invites: "sam@example.com, nope",
      }),
    );
    expect(errors).toMatchObject({
      website: "Enter a website like example.com",
      "socials.0.handle": "Enter a handle like @yourbrand",
      "competitors.0.name": "Enter the competitor's name",
      "reportLinks.0": "Enter a link that starts with https://",
      invites: "Check this email address: nope",
    });
  });

  it("limits links to 200 characters", () => {
    const long = `https://example.com/${"x".repeat(200)}`;
    const errors = errorsOf(draft({ website: long, reportLinks: [long], competitors: [{ name: "Rival", website: long }] }));
    expect(errors).toMatchObject({
      website: "Use a link of 200 characters or fewer",
      "reportLinks.0": "Use a link of 200 characters or fewer",
      "competitors.0.website": "Use a link of 200 characters or fewer",
    });
  });

  it("says so, instead of saving, when all the answers together are too big to keep", () => {
    const link = `https://example.com/${"x".repeat(170)}`;
    const errors = errorsOf(
      draft({
        competitors: Array.from({ length: 5 }, (_, i) => ({ name: `Rival ${i} ${"y".repeat(80)}`, website: link })),
        reportLinks: [link, link, link],
        invites: Array.from({ length: 10 }, (_, i) => `person.with.a.long.address.${i}@example-company.com`).join(", "),
        documents: Array.from({ length: 10 }, (_, i) => `${"z".repeat(90)}${i}.pdf`),
      }),
    );
    expect(errors.form).toBe("These answers are too long to save. Shorten some links or remove a few rows.");
  });

  it("keeps the one general audience chosen", () => {
    const result = validateOnboarding(draft({ audience: "Institutional" }), "a@b.co");
    expect(result.ok && result.profile.audiences).toEqual(["Institutional"]);
  });

  it("keeps whether each social account was verified with Connect", () => {
    const result = validateOnboarding(
      draft({
        socials: [
          { platform: "Instagram", handle: "@harbourline", verified: true },
          { platform: "TikTok", handle: "@harbourline.tt", verified: false },
        ],
      }),
      "a@b.co",
    );
    expect(result.ok && result.profile.socials).toEqual([
      { platform: "Instagram", handle: "@harbourline", verified: true },
      { platform: "TikTok", handle: "@harbourline.tt", verified: false },
    ]);
  });

  it("keeps a generated invite link", () => {
    const result = validateOnboarding(draft({ inviteLink: "http://localhost:3000/create-account?invite=abc" }), "a@b.co");
    expect(result.ok && result.profile.inviteLink).toBe("http://localhost:3000/create-account?invite=abc");
  });

  it("rejects choices that are not on the lists", () => {
    const errors = errorsOf(draft({ industry: "Space Mining", audience: "Everyone", goals: ["world-peace"] }));
    expect(errors).toMatchObject({
      industry: "Choose an industry",
      audience: "Choose an audience",
      goals: "Choose at least one goal",
    });
  });
});

describe("draft cookie", () => {
  it("round-trips what was typed on step 2", () => {
    const value = draft({ invites: "sam@example.com" });
    expect(decodeOnboardingDraft(encodeOnboardingDraft(value) ?? undefined)).toEqual(value);
  });

  it("ignores missing or corrupted values", () => {
    expect(decodeOnboardingDraft(undefined)).toBeNull();
    expect(decodeOnboardingDraft("garbage")).toBeNull();
    expect(decodeOnboardingDraft(Buffer.from(JSON.stringify({ industry: 5 })).toString("base64url"))).toBeNull();
  });

  it("gives up rather than writing a cookie that is too big", () => {
    expect(encodeOnboardingDraft(draft({ invites: "x".repeat(5000) }))).toBeNull();
  });
});

describe("readOnboardingForm", () => {
  it("reads repeated rows in order", () => {
    const form = new FormData();
    form.set("industry", "Retail");
    form.set("subIndustry", "E-commerce");
    for (const [country, area, region, subdivision] of [
      ["Canada", "British Columbia", "Lower Mainland", "Richmond"],
      ["Japan", "Kanto", "All of Kanto", "Any area in All of Kanto"],
    ]) {
      form.append("regionCountry", country);
      form.append("regionArea", area);
      form.append("regionRegion", region);
      form.append("regionSubdivision", subdivision);
    }
    form.set("audience", "Industrial");
    form.append("goal", "traffic");
    form.set("conversionTarget", "10");
    form.set("website", "example.com");
    form.append("socialPlatform", "TikTok");
    form.append("socialHandle", "@brand");
    form.append("socialVerified", "1");
    form.set("analyticsConsent", "on");
    form.append("competitorName", "Rival");
    form.append("competitorWebsite", "rival.example");
    form.append("reportLink", "https://example.com/r");
    form.append("documentName", "report.pdf");
    form.set("invites", "a@b.co");

    expect(readOnboardingForm(form)).toEqual({
      industry: "Retail",
      subIndustry: "E-commerce",
      regions: [
        { country: "Canada", area: "British Columbia", region: "Lower Mainland", subdivision: "Richmond" },
        { country: "Japan", area: "Kanto", region: "All of Kanto", subdivision: "Any area in All of Kanto" },
      ],
      audience: "Industrial",
      goals: ["traffic"],
      conversionTarget: "10",
      website: "example.com",
      socials: [{ platform: "TikTok", handle: "@brand", verified: true }],
      analyticsConsent: true,
      competitors: [{ name: "Rival", website: "rival.example" }],
      reportLinks: ["https://example.com/r"],
      documents: ["report.pdf"],
      invites: "a@b.co",
      inviteLink: "",
    });
  });
});
