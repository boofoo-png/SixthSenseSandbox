import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNT } from "./constants";
import { validateOnboarding, emptyOnboardingDraft } from "./onboarding";
import { decodeProfile, encodeProfile, isOnboarded } from "./profile";

function profile(email = "jordan@example.com") {
  const result = validateOnboarding(
    {
      ...emptyOnboardingDraft(),
      industries: ["Wholesale"],
      regions: [{ country: "CA", province: "BC", area: "" }],
      audience: "Commercial",
      goals: ["traffic"],
      website: "example.com",
    },
    email,
  );
  if (!result.ok) throw new Error("expected a valid profile");
  return result.profile;
}

describe("profile cookie", () => {
  it("round-trips a business profile", () => {
    expect(decodeProfile(encodeProfile(profile()))).toEqual(profile());
  });

  it("ignores missing or corrupted values", () => {
    expect(decodeProfile(undefined)).toBeNull();
    expect(decodeProfile("garbage")).toBeNull();
    expect(decodeProfile(Buffer.from(JSON.stringify({ email: 5 })).toString("base64url"))).toBeNull();
  });

  it("refuses to write a profile too big for a cookie (validation stops these first)", () => {
    const big = {
      ...profile(),
      regions: Array.from({ length: 5 }, () => ({ country: "CA" as const, province: "BC", area: "x".repeat(100) })),
      competitors: Array.from({ length: 5 }, () => ({ name: "x".repeat(100), website: "https://example.com" })),
      documents: Array.from({ length: 10 }, () => "x".repeat(100)),
      invites: Array.from({ length: 10 }, (_, i) => `person${i}@example.com`),
    };
    expect(() => encodeProfile(big)).toThrow("too large");
  });
});

describe("isOnboarded", () => {
  it("is true when the saved profile belongs to the signed-in email", () => {
    expect(isOnboarded("jordan@example.com", encodeProfile(profile()))).toBe(true);
  });

  it("is false with no profile, or a profile from another account in this browser", () => {
    expect(isOnboarded("jordan@example.com", undefined)).toBe(false);
    expect(isOnboarded("sam@example.com", encodeProfile(profile()))).toBe(false);
  });

  it("treats the demo account as already set up", () => {
    expect(isOnboarded(DEMO_ACCOUNT.email, undefined)).toBe(true);
  });
});
