import { beforeEach, describe, expect, it, vi } from "vitest";
import { encodeStoredAccount, decodeStoredAccount, type Account } from "@/lib/hub/account";
import { accountCookieName, settingsCookieName } from "@/lib/hub/accounts";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { verifyPassword } from "@/lib/hub/password";
import { settingsFor } from "@/lib/hub/settings";
import { changePassword, saveSettings } from "./actions";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

beforeEach(() => jar.clear());

const account: Account = {
  firstName: "Jane",
  lastName: "Doe",
  role: "Owner",
  company: "Doe Supply",
  address1: "1 Main St",
  city: "Richmond",
  country: "CA",
  province: "BC",
  postalCode: "V6X 1A1",
  email: "jane@example.com",
  phone: "604-555-0100",
};

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const reader = { get: (name: string) => (jar.has(name) ? { value: jar.get(name) as string } : undefined) };

describe("saveSettings", () => {
  const fields = { firstName: "Dana", lastName: "Lee", role: "Owner", phone: "", company: "Lee Linens", website: "", industry: "Hospitality and Tourism", timeZone: "Eastern Time (ET)", "notify-trends": "on" };

  it("saves the settings for the signed-in account", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    const result = await saveSettings({ status: "idle", errors: {} }, form(fields));
    expect(result.status).toBe("saved");
    expect(jar.has(settingsCookieName(DEMO_ACCOUNT.email))).toBe(true);
    expect(settingsFor(reader, DEMO_ACCOUNT.email)).toMatchObject({ company: "Lee Linens", timeZone: "Eastern Time (ET)", notifications: { trends: true, competitor: false } });
  });

  it("returns the problems without saving", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    const result = await saveSettings({ status: "idle", errors: {} }, form({ ...fields, company: "" }));
    expect(result).toMatchObject({ status: "invalid", errors: { company: "Enter your company name." } });
    expect(jar.has(settingsCookieName(DEMO_ACCOUNT.email))).toBe(false);
  });

  it("sends a signed-out visitor to log in", async () => {
    await expect(saveSettings({ status: "idle", errors: {} }, form(fields))).rejects.toThrow("REDIRECT /login");
  });
});

describe("changePassword", () => {
  beforeEach(() => {
    jar.set(SESSION_COOKIE, account.email);
    jar.set(accountCookieName(account.email), encodeStoredAccount(account, "old-password"));
  });

  it("changes the password after checking the current one", async () => {
    const result = await changePassword({ status: "idle", errors: {} }, form({ current: "old-password", password: "new-password", confirmPassword: "new-password" }));
    expect(result.status).toBe("changed");
    const stored = decodeStoredAccount(jar.get(accountCookieName(account.email)));
    expect(stored && verifyPassword("new-password", stored.passwordHash)).toBe(true);
  });

  it("refuses a wrong current password or a mismatched new one", async () => {
    expect((await changePassword({ status: "idle", errors: {} }, form({ current: "nope", password: "new-password", confirmPassword: "new-password" }))).errors).toEqual({
      current: "That isn't your current password.",
    });
    expect((await changePassword({ status: "idle", errors: {} }, form({ current: "old-password", password: "short", confirmPassword: "other" }))).errors).toEqual({
      password: "Use at least 8 characters",
      confirmPassword: "Passwords don't match",
    });
  });

  it("keeps the demo account's password fixed", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    const result = await changePassword({ status: "idle", errors: {} }, form({ current: DEMO_ACCOUNT.password, password: "new-password", confirmPassword: "new-password" }));
    expect(result.errors.form).toMatch(/demo account's password can't be changed/);
  });
});
