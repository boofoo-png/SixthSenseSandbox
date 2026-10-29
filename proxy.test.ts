// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { DEMO_ACCOUNT, SESSION_COOKIE, SIGNUP_COOKIE } from "@/lib/hub/constants";
import { validateOnboarding, emptyOnboardingDraft } from "@/lib/hub/onboarding";
import { PROFILE_COOKIE, encodeProfile, profileCookieName } from "@/lib/hub/profile";
import { config, proxy } from "./proxy";

function profileFor(email: string) {
  const result = validateOnboarding(
    {
      ...emptyOnboardingDraft(),
      industries: ["Wholesale"],
      regions: [{ country: "CA", province: "BC", area: "" }],
      audiences: ["Commercial"],
      goals: ["traffic"],
      website: "example.com",
    },
    email,
  );
  if (!result.ok) throw new Error("expected a profile");
  return encodeProfile(result.profile);
}

function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, "http://localhost:3000"));
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

const location = (path: string, cookies?: Record<string, string>) => proxy(request(path, cookies)).headers.get("location");

describe("proxy", () => {
  it("sends signed-out visitors to the login page, keeping where they were going", () => {
    const response = proxy(request("/campaigns?tab=new"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fcampaigns%3Ftab%3Dnew");
  });

  it("lets signed-out visitors open the login page", () => {
    expect(location("/login")).toBeNull();
  });

  it("sends a new account to onboarding until its profile is saved", () => {
    const session = { [SESSION_COOKIE]: "jordan@example.com" };
    expect(location("/", session)).toBe("http://localhost:3000/onboarding");
    expect(location("/onboarding", session)).toBeNull();
    const finished = { ...session, [profileCookieName("jordan@example.com")]: profileFor("jordan@example.com") };
    expect(location("/", finished)).toBeNull();
    expect(location("/onboarding", finished)).toBe("http://localhost:3000/");
  });

  it("lets someone who finished step 1 open step 2 before the account exists", () => {
    expect(location("/onboarding")).toBe("http://localhost:3000/create-account");
    const signup = { [SIGNUP_COOKIE]: "pending" };
    expect(location("/onboarding", signup)).toBeNull();
    expect(location("/create-account", signup)).toBeNull();
    expect(location("/", signup)).toBe("http://localhost:3000/login");
  });

  it("still accepts a profile saved the old way, in the single shared cookie", () => {
    expect(location("/", { [SESSION_COOKIE]: "jordan@example.com", [PROFILE_COOKIE]: profileFor("jordan@example.com") })).toBeNull();
  });

  it("does not count another account's profile in the same browser", () => {
    expect(location("/", { [SESSION_COOKIE]: "sam@example.com", [PROFILE_COOKIE]: profileFor("jordan@example.com") })).toBe(
      "http://localhost:3000/onboarding",
    );
  });

  it("lets the demo account straight into the app", () => {
    const demo = { [SESSION_COOKIE]: DEMO_ACCOUNT.email };
    expect(location("/competitors", demo)).toBeNull();
    expect(location("/login", demo)).toBe("http://localhost:3000/");
  });

  it("does not run for Next.js files, images, or the favicon", () => {
    const pattern = new RegExp(`^${config.matcher[0]}$`);
    expect(pattern.test("/campaigns")).toBe(true);
    expect(pattern.test("/_next/static/chunks/app.js")).toBe(false);
    expect(pattern.test("/_next/image")).toBe(false);
    expect(pattern.test("/favicon.ico")).toBe(false);
    expect(pattern.test("/components/progress-ring.svg")).toBe(false);
  });
});
