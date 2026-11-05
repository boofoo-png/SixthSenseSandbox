import { beforeEach, describe, expect, it, vi } from "vitest";
import { decodeProfile, profileCookieName } from "@/lib/hub/profile";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { saveDefaultAudience } from "./actions";

const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => jar.set(name, value),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

beforeEach(() => jar.clear());

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const savedDefault = () => decodeProfile(jar.get(profileCookieName(DEMO_ACCOUNT.email)))?.defaultAudience;

describe("saveDefaultAudience", () => {
  it("saves the audience in the business profile and returns to the same view", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    await expect(
      saveDefaultAudience(form({ audience: "senior-living-teams", query: "age=35-64&audience=senior-living-teams&saved=1" })),
    ).rejects.toThrow("REDIRECT /explore?age=35-64&audience=senior-living-teams&saved=1");
    expect(savedDefault()).toBe("senior-living-teams");
  });

  it("can save a suggested audience", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    await expect(saveDefaultAudience(form({ audience: "care-facility-procurement-leads", query: "" }))).rejects.toThrow(
      "REDIRECT /explore?audience=care-facility-procurement-leads&saved=1",
    );
    expect(savedDefault()).toBe("care-facility-procurement-leads");
  });

  it("ignores an unknown audience", async () => {
    jar.set(SESSION_COOKIE, DEMO_ACCOUNT.email);
    await expect(saveDefaultAudience(form({ audience: "made-up", query: "view=chart" }))).rejects.toThrow("REDIRECT /explore?view=chart");
    expect(savedDefault()).toBeUndefined();
  });

  it("sends a signed-out visitor to log in", async () => {
    await expect(saveDefaultAudience(form({ audience: "senior-living-teams" }))).rejects.toThrow("REDIRECT /login");
  });
});
