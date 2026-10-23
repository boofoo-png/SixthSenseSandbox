import { describe, expect, it } from "vitest";
import { encodeStoredAccount, validateNewAccount } from "./account";
import { DEMO_ACCOUNT, checkCredentials, decodeStoredAccount, safeNextPath } from "./session";

function storedAccount() {
  const result = validateNewAccount({
    firstName: "Jordan",
    lastName: "Lee",
    role: "Owner",
    company: "Harbourline Supply Co.",
    address1: "123 Example Road",
    address2: "",
    city: "Richmond",
    country: "CA",
    province: "BC",
    postalCode: "A1B 2C3",
    email: "jordan@example.com",
    phone: "604 555 0100",
    password: "my-password",
    confirmPassword: "my-password",
  });
  if (!result.ok) throw new Error("expected a valid account");
  return decodeStoredAccount(encodeStoredAccount(result.account, "my-password"));
}

describe("checkCredentials", () => {
  it("signs in the demo account shown on the login page", () => {
    expect(checkCredentials(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password, null)).toEqual({
      email: DEMO_ACCOUNT.email,
      name: DEMO_ACCOUNT.name,
    });
  });

  it("signs in the account created in this browser, ignoring email case and spaces", () => {
    expect(checkCredentials(" Jordan@Example.com ", "my-password", storedAccount())).toEqual({
      email: "jordan@example.com",
      name: "Jordan Lee",
    });
  });

  it("rejects a wrong password, an unknown email, or empty fields", () => {
    const stored = storedAccount();
    expect(checkCredentials("jordan@example.com", "wrong-password", stored)).toBeNull();
    expect(checkCredentials("someone@example.com", "my-password", stored)).toBeNull();
    expect(checkCredentials(DEMO_ACCOUNT.email, "wrong-password", stored)).toBeNull();
    expect(checkCredentials("", "", stored)).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("keeps a page inside the app", () => {
    expect(safeNextPath("/campaigns")).toBe("/campaigns");
    expect(safeNextPath("/competitors?period=last-30-days")).toBe("/competitors?period=last-30-days");
  });

  it("falls back to the dashboard for missing, outside, or auth-page addresses", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("https://example.com")).toBe("/");
    expect(safeNextPath("//example.com")).toBe("/");
    expect(safeNextPath("/\\example.com")).toBe("/");
    expect(safeNextPath("/login")).toBe("/");
    expect(safeNextPath("/\t/example.com")).toBe("/");
    expect(safeNextPath("/\n/example.com")).toBe("/");
    expect(safeNextPath("/\r/example.com")).toBe("/");
    expect(safeNextPath("/%2F/example.com")).toBe("/%2F/example.com");
  });
});
