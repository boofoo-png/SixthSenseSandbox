import { hashPassword } from "./password";
import { COUNTRIES, REGIONS, isCountryCode, type CountryCode } from "./regions";

// The Create an Account form from the mid-fi (SIXTH SENSE Figma, "Create an account").

/** Raw form values, exactly as typed. */
export type NewAccountFields = {
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  country: string;
  province: string;
  postalCode: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type NewAccountField = keyof NewAccountFields;

/** A saved account, without the password. */
export type Account = {
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  address1: string;
  address2?: string;
  city: string;
  country: CountryCode;
  province: string;
  postalCode: string;
  email: string;
  phone: string;
};

export type AccountErrors = Partial<Record<NewAccountField, string>>;

export type NewAccountResult =
  /** `password` is null when it was left blank to keep the one already chosen. */
  | { ok: true; account: Account; password: string | null }
  | { ok: false; errors: AccountErrors };

const REQUIRED: readonly [NewAccountField, string][] = [
  ["firstName", "Enter your first name"],
  ["lastName", "Enter your last name"],
  ["role", "Enter your role at the company"],
  ["company", "Enter your company name"],
  ["address1", "Enter your street address"],
  ["city", "Enter your city"],
  ["country", "Choose a country"],
  ["province", "Choose a province"],
  ["postalCode", "Enter your postal code"],
  ["email", "Enter your email address"],
  ["phone", "Enter your phone number"],
  ["password", "Create a password"],
  ["confirmPassword", "Re-type your password"],
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL: Record<CountryCode, { pattern: RegExp; message: string }> = {
  CA: { pattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, message: "Enter a postal code like A1B 2C3" },
  US: { pattern: /^\d{5}(-\d{4})?$/, message: "Enter a ZIP code like 98101" },
};

export const MIN_PASSWORD_LENGTH = 8;

/** Check the Create an Account form and return a tidy account, or a message per problem field. */
export function validateNewAccount(
  fields: NewAccountFields,
  { passwordOptional = false }: { passwordOptional?: boolean } = {},
): NewAccountResult {
  const value = (key: NewAccountField) => (key === "password" || key === "confirmPassword" ? fields[key] : fields[key].trim());
  const errors: AccountErrors = {};
  // Coming back from step 2, blank passwords mean "keep the one already chosen".
  const keepPassword = passwordOptional && fields.password === "" && fields.confirmPassword === "";

  for (const [key, message] of REQUIRED) {
    if (keepPassword && (key === "password" || key === "confirmPassword")) continue;
    if (value(key) === "") errors[key] = message;
  }

  const country = value("country");
  const email = value("email").toLowerCase();
  const postalCode = value("postalCode").toUpperCase();

  if (email && !EMAIL.test(email)) errors.email = "Enter an email address like name@example.com";
  if (value("phone") && value("phone").replace(/\D/g, "").length < 10) {
    errors.phone = "Enter a phone number with at least 10 digits";
  }
  if (country && !isCountryCode(country)) errors.country = "Choose a country";
  if (isCountryCode(country)) {
    const label = COUNTRIES.find((entry) => entry.code === country)?.regionLabel.toLowerCase() ?? "province";
    if (!REGIONS[country].some((region) => region.code === value("province"))) errors.province = `Choose a ${label}`;
    if (postalCode && !POSTAL[country].pattern.test(postalCode)) errors.postalCode = POSTAL[country].message;
  }
  if (fields.password && fields.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (fields.confirmPassword && fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords don't match";
  }

  if (Object.keys(errors).length > 0 || !isCountryCode(country)) {
    return { ok: false, errors };
  }

  const address2 = value("address2");
  return {
    ok: true,
    password: keepPassword ? null : fields.password,
    account: {
      firstName: value("firstName"),
      lastName: value("lastName"),
      role: value("role"),
      company: value("company"),
      address1: value("address1"),
      ...(address2 ? { address2 } : {}),
      city: value("city"),
      country,
      province: value("province"),
      postalCode,
      email,
      phone: value("phone"),
    },
  };
}

/** What the account cookie holds: the account and a salted hash of its password. */
export type StoredAccount = { account: Account; passwordHash: string };

/** Turn an account into the account cookie's value (base64url JSON, password hashed). */
export function encodeStoredAccount(account: Account, password: string): string {
  return encodeStored({ account, passwordHash: hashPassword(password) });
}

/** Encode an account whose password is already hashed. */
export function encodeStored(stored: StoredAccount): string {
  return Buffer.from(JSON.stringify(stored)).toString("base64url");
}

/** Read the account cookie's value; null when it is missing, corrupted, or incomplete. */
export function decodeStoredAccount(value: string | undefined): StoredAccount | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const { account: raw, passwordHash } = parsed as Partial<StoredAccount>;
    if (typeof passwordHash !== "string" || !raw || typeof raw !== "object") return null;
    // Accounts saved before first and last name were separate had one "name" field.
    const { name: legacyName, ...rest } = raw as Account & { name?: unknown };
    const account = rest as Account;
    if (typeof legacyName === "string" && account.firstName === undefined) {
      const [first, ...others] = legacyName.trim().split(/\s+/);
      account.firstName = first ?? "";
      account.lastName = others.join(" ");
    }
    const required: (keyof Account)[] = ["firstName", "lastName", "role", "company", "address1", "city", "country", "province", "postalCode", "email", "phone"];
    if (!required.every((key) => typeof account[key] === "string" && account[key] !== "")) return null;
    if (!isCountryCode(account.country)) return null;
    return { account, passwordHash };
  } catch {
    return null;
  }
}
