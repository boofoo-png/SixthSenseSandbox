import { describe, expect, it } from "vitest";
import { isPublicPath, redirectFor } from "./routing";

const signedOut = { signedIn: false, onboarded: false, signingUp: false };
const signingUp = { signedIn: false, onboarded: false, signingUp: true };
const newUser = { signedIn: true, onboarded: false, signingUp: false };
const member = { signedIn: true, onboarded: true, signingUp: false };

describe("isPublicPath", () => {
  it("treats the sign-in pages as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/create-account")).toBe(true);
    expect(isPublicPath("/forgot-password")).toBe(true);
  });

  it("treats the reset-password page as public, so a signed-out person can use the link", () => {
    expect(isPublicPath("/reset-password")).toBe(true);
    expect(redirectFor("/reset-password", "?token=abc", { signedIn: false, onboarded: false, signingUp: false })).toBeNull();
  });

  it("treats every app page, and onboarding, as private", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/campaigns")).toBe(false);
    expect(isPublicPath("/onboarding")).toBe(false);
    expect(isPublicPath("/login-help")).toBe(false);
  });
});

describe("redirectFor", () => {
  it("sends signed-out visitors to the login page, remembering where they were going", () => {
    expect(redirectFor("/", "", signedOut)).toBe("/login");
    expect(redirectFor("/competitors", "?period=last-30-days", signedOut)).toBe(
      "/login?next=%2Fcompetitors%3Fperiod%3Dlast-30-days",
    );
  });

  it("sends visitors who have not done step 1 from step 2 to step 1", () => {
    expect(redirectFor("/onboarding", "", signedOut)).toBe("/create-account");
  });

  it("lets someone part-way through signing up move between step 1 and step 2", () => {
    expect(redirectFor("/onboarding", "", signingUp)).toBeNull();
    expect(redirectFor("/create-account", "", signingUp)).toBeNull();
    expect(redirectFor("/campaigns", "", signingUp)).toBe("/login?next=%2Fcampaigns");
  });

  it("lets signed-out visitors use the sign-in pages", () => {
    expect(redirectFor("/login", "", signedOut)).toBeNull();
    expect(redirectFor("/create-account", "", signedOut)).toBeNull();
  });

  it("sends new users to the second Create an Account page until they finish it", () => {
    expect(redirectFor("/", "", newUser)).toBe("/onboarding");
    expect(redirectFor("/campaigns", "", newUser)).toBe("/onboarding");
    expect(redirectFor("/login", "", newUser)).toBe("/onboarding");
    expect(redirectFor("/onboarding", "", newUser)).toBeNull();
    expect(redirectFor("/forgot-password", "", newUser)).toBeNull();
  });

  it("sends finished users from the sign-in and onboarding pages to the dashboard", () => {
    expect(redirectFor("/login", "", member)).toBe("/");
    expect(redirectFor("/create-account", "", member)).toBe("/");
    expect(redirectFor("/onboarding", "", member)).toBe("/");
  });

  it("lets finished users use the app and the forgot-password page", () => {
    expect(redirectFor("/campaigns", "", member)).toBeNull();
    expect(redirectFor("/forgot-password", "", member)).toBeNull();
  });
});
