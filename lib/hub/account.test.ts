import { describe, expect, it } from "vitest";
import {
  decodeStoredAccount,
  encodeStored,
  encodeStoredAccount,
  validateNewAccount,
  type NewAccountFields,
} from "./account";
import { verifyPassword } from "./password";

function fields(overrides: Partial<NewAccountFields> = {}): NewAccountFields {
  return {
    firstName: "Jordan",
    lastName: "Lee",
    role: "Marketing manager",
    company: "Harbourline Supply Co.",
    address1: "123 Example Road",
    address2: "",
    city: "Richmond",
    country: "CA",
    province: "BC",
    postalCode: "a1b 2c3",
    email: "  Jordan@Example.com ",
    phone: "(604) 555-0100",
    password: "longenough",
    confirmPassword: "longenough",
    ...overrides,
  };
}

function validAccount() {
  const result = validateNewAccount(fields());
  if (!result.ok) throw new Error("expected a valid account");
  return result.account;
}

describe("validateNewAccount", () => {
  it("accepts a complete form and tidies the values", () => {
    const result = validateNewAccount(fields());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.email).toBe("jordan@example.com");
    expect(result.account.postalCode).toBe("A1B 2C3");
    expect(result.account.address2).toBeUndefined();
    expect(result.password).toBe("longenough");
  });

  it("requires every field except Address 2", () => {
    const empty = Object.fromEntries(Object.keys(fields()).map((key) => [key, ""])) as unknown as NewAccountFields;
    const result = validateNewAccount(empty);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(
      [
        "address1",
        "city",
        "company",
        "confirmPassword",
        "country",
        "email",
        "firstName",
        "lastName",
        "password",
        "phone",
        "postalCode",
        "province",
        "role",
      ].sort(),
    );
  });

  it("says when the passwords don't match, like the mid-fi", () => {
    const result = validateNewAccount(fields({ confirmPassword: "different1" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.confirmPassword).toBe("Passwords don't match");
  });

  it("asks for a password of at least 8 characters", () => {
    const result = validateNewAccount(fields({ password: "short", confirmPassword: "short" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.password).toBe("Use at least 8 characters");
  });

  it("checks the email address and phone number", () => {
    const result = validateNewAccount(fields({ email: "not-an-email", phone: "12345" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toBe("Enter an email address like name@example.com");
    expect(result.errors.phone).toBe("Enter a phone number with at least 10 digits");
  });

  it("checks the postal code for the chosen country", () => {
    const canada = validateNewAccount(fields({ postalCode: "90210" }));
    expect(canada.ok).toBe(false);
    if (!canada.ok) expect(canada.errors.postalCode).toBe("Enter a postal code like A1B 2C3");

    const us = validateNewAccount(fields({ country: "US", province: "WA", postalCode: "98101" }));
    expect(us.ok).toBe(true);
  });

  it("only accepts a province or state from the chosen country", () => {
    const result = validateNewAccount(fields({ country: "US", province: "BC", postalCode: "98101" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.province).toBe("Choose a state");
  });
});

describe("first and last name", () => {
  it("asks for each one", () => {
    const result = validateNewAccount(fields({ firstName: " ", lastName: "" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.firstName).toBe("Enter your first name");
    expect(result.errors.lastName).toBe("Enter your last name");
  });

  it("keeps them separate and tidy", () => {
    const result = validateNewAccount(fields({ firstName: " Jordan ", lastName: " Lee " }));
    expect(result.ok && [result.account.firstName, result.account.lastName]).toEqual(["Jordan", "Lee"]);
  });
});

describe("length limits", () => {
  it("keeps every field short enough for the account cookie", () => {
    const result = validateNewAccount(fields({ company: "x".repeat(101) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.company).toBe("Use 100 characters or fewer");
  });

  it("fits the longest allowed account in a cookie", () => {
    const long = "x".repeat(100);
    const result = validateNewAccount(
      fields({ firstName: long, lastName: long, role: long, company: long, address1: long, address2: long, city: long }),
    );
    if (!result.ok) throw new Error("expected a valid account");
    expect(encodeStoredAccount(result.account, "longenough").length).toBeLessThan(3800);
  });
});

describe("validateNewAccount when coming back from step 2", () => {
  it("lets both passwords be left blank to keep the one already chosen", () => {
    const result = validateNewAccount(fields({ password: "", confirmPassword: "" }), { passwordOptional: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.password).toBeNull();
  });

  it("still checks a new password when one is typed", () => {
    const result = validateNewAccount(fields({ password: "newpass12", confirmPassword: "different" }), {
      passwordOptional: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.confirmPassword).toBe("Passwords don't match");
  });
});

describe("stored account", () => {
  it("can be re-encoded with an existing password hash", () => {
    const result = validateNewAccount(fields());
    if (!result.ok) throw new Error("expected a valid account");
    const first = decodeStoredAccount(encodeStoredAccount(result.account, "longenough"));
    if (!first) throw new Error("expected a stored account");
    const again = decodeStoredAccount(encodeStored({ account: { ...result.account, city: "Vancouver" }, passwordHash: first.passwordHash }));
    expect(again?.account.city).toBe("Vancouver");
    expect(verifyPassword("longenough", again?.passwordHash ?? "")).toBe(true);
  });

  it("round-trips through the cookie value with a hashed password", () => {
    const result = validateNewAccount(fields());
    if (!result.ok) throw new Error("expected a valid account");
    const value = encodeStoredAccount(result.account, "longenough");
    expect(value).not.toContain("longenough");
    const stored = decodeStoredAccount(value);
    expect(stored?.account).toEqual(result.account);
    expect(verifyPassword("longenough", stored?.passwordHash ?? "")).toBe(true);
  });

  it("still reads accounts saved with one name field, splitting at the first space", () => {
    const old = { account: { ...validAccount(), firstName: undefined, lastName: undefined, name: "Mary Ann Smith" }, passwordHash: "scrypt$00$00" };
    const stored = decodeStoredAccount(Buffer.from(JSON.stringify(old)).toString("base64url"));
    expect([stored?.account.firstName, stored?.account.lastName]).toEqual(["Mary", "Ann Smith"]);
    expect(stored?.account).not.toHaveProperty("name");
  });

  it("ignores missing, corrupted, or incomplete cookie values", () => {
    expect(decodeStoredAccount(undefined)).toBeNull();
    expect(decodeStoredAccount("not base64 json")).toBeNull();
    expect(decodeStoredAccount(Buffer.from(JSON.stringify({ account: { email: "a@b.co" } })).toString("base64url"))).toBeNull();
  });
});
