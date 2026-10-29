import { describe, expect, it } from "vitest";
import { encodeStored, encodeStoredAccount, type Account } from "./account";
import { MAX_ACCOUNTS, accountCookieName, accountsToEvict, findAccount } from "./accounts";
import { ACCOUNT_COOKIE } from "./constants";
import { PROFILE_COOKIE, profileCookieName, profileValueFor } from "./profile";

function account(email: string): Account {
  return {
    firstName: "Test",
    lastName: "Person",
    role: "Owner",
    company: "Harbourline Supply Co.",
    address1: "1 Test Way",
    city: "Richmond",
    country: "CA",
    province: "BC",
    postalCode: "V6X 1A1",
    email,
    phone: "604 555 0100",
  };
}

function jarOf(entries: Record<string, string>) {
  return { get: (name: string) => (name in entries ? { value: entries[name] } : undefined) };
}

describe("cookie names", () => {
  it("give each account and its answers their own cookie", () => {
    expect(accountCookieName("a@example.com")).not.toBe(accountCookieName("b@example.com"));
    expect(accountCookieName("a@example.com")).toMatch(/^ss_account_[\w-]+$/);
    expect(profileCookieName("a@example.com")).toMatch(/^ss_profile_[\w-]+$/);
    expect(accountCookieName("A@Example.com")).toBe(accountCookieName("a@example.com"));
  });
});

describe("findAccount", () => {
  it("finds any account saved in this browser by its email", () => {
    const jar = jarOf({
      [accountCookieName("a@example.com")]: encodeStoredAccount(account("a@example.com"), "password-a"),
      [accountCookieName("b@example.com")]: encodeStoredAccount(account("b@example.com"), "password-b"),
    });
    expect(findAccount(jar, "a@example.com")?.account.email).toBe("a@example.com");
    expect(findAccount(jar, "b@example.com")?.account.email).toBe("b@example.com");
    expect(findAccount(jar, "c@example.com")).toBeNull();
  });

  it("still finds an account saved the old way, in the single shared cookie", () => {
    const jar = jarOf({ [ACCOUNT_COOKIE]: encodeStoredAccount(account("old@example.com"), "password-old") });
    expect(findAccount(jar, "old@example.com")?.account.email).toBe("old@example.com");
    expect(findAccount(jar, "other@example.com")).toBeNull();
  });
});

describe("profileValueFor", () => {
  it("reads the account's own answers, or the old shared cookie", () => {
    expect(profileValueFor(jarOf({ [profileCookieName("a@example.com")]: "mine" }), "a@example.com")).toBe("mine");
    expect(profileValueFor(jarOf({ [PROFILE_COOKIE]: "old" }), "a@example.com")).toBe("old");
    expect(profileValueFor(jarOf({}), "a@example.com")).toBeUndefined();
  });
});

describe("accountsToEvict", () => {
  const saved = (email: string, savedAt: number) => ({
    name: accountCookieName(email),
    value: encodeStored({ account: account(email), passwordHash: "scrypt$00$00", savedAt }),
  });

  it(`keeps up to ${MAX_ACCOUNTS} accounts, dropping the oldest first`, () => {
    const cookies = Array.from({ length: MAX_ACCOUNTS + 2 }, (_, i) => saved(`p${i}@example.com`, i));
    expect(accountsToEvict(cookies, `p${MAX_ACCOUNTS + 1}@example.com`)).toEqual(["p0@example.com", "p1@example.com"]);
  });

  it("never drops the account being saved", () => {
    const cookies = Array.from({ length: MAX_ACCOUNTS + 1 }, (_, i) => saved(`p${i}@example.com`, i));
    expect(accountsToEvict(cookies, "p0@example.com")).toEqual(["p1@example.com"]);
  });

  it("also drops old accounts when all the cookies together get too big for a request", () => {
    const big = "x".repeat(4000);
    const cookies = [
      saved("old@example.com", 1),
      saved("new@example.com", 2),
      { name: profileCookieName("old@example.com"), value: big },
      { name: profileCookieName("new@example.com"), value: big },
      { name: "ss_other", value: big },
      { name: "ss_more", value: big },
    ];
    expect(accountsToEvict(cookies, "new@example.com")).toEqual(["old@example.com"]);
  });

  it("drops nothing when there is room", () => {
    expect(accountsToEvict([saved("a@example.com", 1), saved("b@example.com", 2)], "b@example.com")).toEqual([]);
  });
});
