import { describe, expect, it } from "vitest";
import { encodeStoredAccount, type Account } from "./account";
import { accountCookieName, settingsCookieName } from "./accounts";
import { DEMO_ACCOUNT } from "./constants";
import { encodeCookieJson } from "./cookie-json";
import { DEMO_COMPANY } from "./demo-profile";
import { hasSavedSettings, readSettingsForm, settingsFor } from "./settings";

const account: Account = {
  firstName: "Jane",
  lastName: "Doe",
  role: "Owner",
  company: "Doe Hospitality Supply",
  address1: "1 Main St",
  city: "Richmond",
  country: "CA",
  province: "BC",
  postalCode: "V6X 1A1",
  email: "jane@example.com",
  phone: "604-555-0100",
};

const jarOf = (values: Record<string, string>) => ({ get: (name: string) => (name in values ? { value: values[name] } : undefined) });

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  firstName: "Jane",
  lastName: "Doe",
  role: "Owner",
  phone: "604-555-0148",
  company: "Doe Supply",
  website: "doesupply.example",
  industry: "Wholesale",
  timeZone: "Pacific Time (PT)",
  "notify-competitor": "on",
};

describe("settingsFor", () => {
  it("starts from the account created in this browser", () => {
    const jar = jarOf({ [accountCookieName(account.email)]: encodeStoredAccount(account, "password123") });
    expect(settingsFor(jar, account.email)).toMatchObject({ firstName: "Jane", lastName: "Doe", role: "Owner", phone: "604-555-0100", company: "Doe Hospitality Supply" });
    expect(hasSavedSettings(jar, account.email)).toBe(false);
  });

  it("gives the demo account its sample business", () => {
    expect(settingsFor(jarOf({}), DEMO_ACCOUNT.email)).toMatchObject({ firstName: "Demo", lastName: "User", company: DEMO_COMPANY, industry: "Wholesale" });
  });

  it("uses saved settings, but only for the same email", () => {
    const saved = { ...settingsFor(jarOf({}), DEMO_ACCOUNT.email), company: "Renamed Co." };
    const jar = jarOf({ [settingsCookieName(DEMO_ACCOUNT.email)]: encodeCookieJson(saved) ?? "" });
    expect(settingsFor(jar, DEMO_ACCOUNT.email).company).toBe("Renamed Co.");
    expect(hasSavedSettings(jar, DEMO_ACCOUNT.email)).toBe(true);
    const wrong = jarOf({ [settingsCookieName(DEMO_ACCOUNT.email)]: encodeCookieJson({ ...saved, email: "x@y.z" }) ?? "" });
    expect(settingsFor(wrong, DEMO_ACCOUNT.email).company).toBe(DEMO_COMPANY);
  });
});

describe("readSettingsForm", () => {
  it("accepts a complete form, adds https to the website, and reads the switches", () => {
    const result = readSettingsForm(form(valid), "jane@example.com");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.settings.email).toBe("jane@example.com");
    expect(result.settings.website).toBe("https://doesupply.example");
    expect(result.settings.notifications).toEqual({ competitor: true, trends: false, reports: false, posts: false });
  });

  it("explains what to fix", () => {
    const result = readSettingsForm(form({ ...valid, firstName: " ", company: "", phone: "call me", website: "not a site", industry: "Space", timeZone: "Mars" }), "jane@example.com");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      firstName: "Enter your first name.",
      company: "Enter your company name.",
      phone: "Enter a phone number, like 604-555-0148.",
      website: "Enter a website address, like sixthsense.example.",
      industry: "Choose an industry.",
      timeZone: "Choose a time zone.",
    });
    expect(result.values.lastName).toBe("Doe");
  });

  it("allows an empty phone and website", () => {
    expect(readSettingsForm(form({ ...valid, phone: "", website: "" }), "jane@example.com").ok).toBe(true);
  });
});
