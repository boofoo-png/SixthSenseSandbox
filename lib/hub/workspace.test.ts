import { describe, expect, it } from "vitest";
import { encodeStoredAccount, type Account } from "./account";
import { accountCookieName, settingsCookieName } from "./accounts";
import { encodeCookieJson } from "./cookie-json";
import { settingsFor } from "./settings";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "./constants";
import { DEMO_COMPANY } from "./demo-profile";
import { BUSINESS_COOKIE } from "./businesses";
import { initialsOf, workspaceFor } from "./workspace";

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

function jarOf(values: Record<string, string>) {
  return { get: (name: string) => (name in values ? { value: values[name] } : undefined) };
}

describe("initialsOf", () => {
  it("takes the first letter of the first and last names", () => {
    expect(initialsOf("John Doe")).toBe("JD");
    expect(initialsOf("  mary  ann  smith ")).toBe("MS");
    expect(initialsOf("Cher")).toBe("C");
    expect(initialsOf("")).toBe("?");
  });
});

describe("workspaceFor", () => {
  it("gives the demo account Sixth Sense, the team's own business", () => {
    expect(workspaceFor(jarOf({ [SESSION_COOKIE]: DEMO_ACCOUNT.email }))).toEqual({
      name: DEMO_ACCOUNT.name,
      firstName: "Demo",
      initials: "DU",
      company: DEMO_COMPANY,
      email: DEMO_ACCOUNT.email,
      competitors: ["Pacific Room Supply", "Island Linens"],
      businesses: [{ id: "sixth-sense", name: DEMO_COMPANY }],
      business: { id: "sixth-sense", name: DEMO_COMPANY },
    });
  });

  it("works on the business chosen in the company menu, and ignores an unknown choice", () => {
    const pick = (choice: string) => workspaceFor(jarOf({ [SESSION_COOKIE]: DEMO_ACCOUNT.email, [BUSINESS_COOKIE]: choice }));
    expect(pick("sixth-sense")).toMatchObject({ company: "Sixth Sense", business: { id: "sixth-sense" } });
    // The clients' businesses are set aside for now (2026-11-06), so an old choice falls back.
    expect(pick("hotel-depot").business.id).toBe("sixth-sense");
    expect(pick("someone-else").business.id).toBe("sixth-sense");
  });

  it("gives an account made in this browser just its own company", () => {
    const jar = jarOf({ [SESSION_COOKIE]: account.email, [accountCookieName(account.email)]: encodeStoredAccount(account, "password123") });
    expect(workspaceFor(jar).businesses).toEqual([{ id: "own", name: "Doe Hospitality Supply" }]);
  });

  it("uses the name and company from the account created in this browser", () => {
    const jar = jarOf({
      [SESSION_COOKIE]: account.email,
      [accountCookieName(account.email)]: encodeStoredAccount(account, "password123"),
    });
    expect(workspaceFor(jar)).toMatchObject({
      name: "Jane Doe",
      firstName: "Jane",
      initials: "JD",
      company: "Doe Hospitality Supply",
      email: "jane@example.com",
      competitors: [],
    });
  });

  it("falls back to the email when the account details are missing", () => {
    expect(workspaceFor(jarOf({ [SESSION_COOKIE]: "sam@example.com" }))).toMatchObject({
      name: "sam",
      company: "Your business",
      email: "sam@example.com",
    });
  });

  it("uses the name and company saved on the Settings page", () => {
    const saved = { ...settingsFor(jarOf({ [SESSION_COOKIE]: DEMO_ACCOUNT.email }), DEMO_ACCOUNT.email), firstName: "Dana", lastName: "Lee", company: "Lee Linens" };
    const jar = jarOf({ [SESSION_COOKIE]: DEMO_ACCOUNT.email, [settingsCookieName(DEMO_ACCOUNT.email)]: encodeCookieJson(saved) ?? "" });
    expect(workspaceFor(jar)).toMatchObject({ name: "Dana Lee", initials: "DL", company: "Lee Linens" });
  });

  it("has a placeholder when nobody is signed in", () => {
    expect(workspaceFor(jarOf({}))).toMatchObject({ name: "Guest", company: "Your business", email: "" });
  });
});
