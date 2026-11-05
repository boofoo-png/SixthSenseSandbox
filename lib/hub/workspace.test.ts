import { describe, expect, it } from "vitest";
import { encodeStoredAccount, type Account } from "./account";
import { accountCookieName } from "./accounts";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "./constants";
import { DEMO_COMPANY } from "./demo-profile";
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
  it("names the demo account's fictional business", () => {
    expect(workspaceFor(jarOf({ [SESSION_COOKIE]: DEMO_ACCOUNT.email }))).toEqual({
      name: DEMO_ACCOUNT.name,
      firstName: "Demo",
      initials: "DU",
      company: DEMO_COMPANY,
      email: DEMO_ACCOUNT.email,
      competitors: ["Pacific Room Supply", "Island Linens"],
    });
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

  it("has a placeholder when nobody is signed in", () => {
    expect(workspaceFor(jarOf({}))).toMatchObject({ name: "Guest", company: "Your business", email: "" });
  });
});
