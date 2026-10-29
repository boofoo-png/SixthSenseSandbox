import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { emptyOnboardingDraft, validateOnboarding } from "@/lib/hub/onboarding";
import { decodeProfile, encodeProfile, profileCookieName } from "@/lib/hub/profile";

type Cookie = { value: string; options?: Record<string, unknown> };
const jar = new Map<string, Cookie>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => jar.set(name, { value, options }),
    delete: (name: string) => jar.delete(name),
  }),
}));

class RedirectSignal extends Error {
  constructor(public url: string) {
    super(`redirect ${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

const { saveTrackedCompetitors } = await import("./actions");

async function redirectedTo(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectSignal) return error.url;
    throw error;
  }
  throw new Error("expected a redirect");
}

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

function signedInWithProfile(tracked?: string[]) {
  const result = validateOnboarding(
    {
      ...emptyOnboardingDraft(),
      industries: ["Wholesale"],
      regions: [{ country: "CA", province: "BC", area: "" }],
      audiences: ["Commercial", "Institutional"],
      goals: ["competitors"],
      website: "example.com",
      competitors: [{ name: "Pacific Room Supply", website: "" }],
    },
    "jordan@example.com",
  );
  if (!result.ok) throw new Error("expected a profile");
  jar.set(SESSION_COOKIE, { value: "jordan@example.com" });
  jar.set(profileCookieName("jordan@example.com"), { value: encodeProfile({ ...result.profile, ...(tracked ? { trackedCompetitors: tracked } : {}) }) });
}

const saved = (email = "jordan@example.com") => decodeProfile(jar.get(profileCookieName(email))?.value)?.trackedCompetitors;

beforeEach(() => jar.clear());

describe("saveTrackedCompetitors", () => {
  it("saves the ticked competitors and goes back to the page", async () => {
    signedInWithProfile();
    const url = await redirectedTo(() =>
      saveTrackedCompetitors(
        form([
          ["shown", "pacific-room-supply"],
          ["shown", "coastline-linen-co"],
          ["shown", "evergreen-amenities"],
          ["track", "coastline-linen-co"],
          ["track", "evergreen-amenities"],
          ["query", "period=last-30-days&audience=Commercial"],
        ]),
      ),
    );
    expect(url).toBe("/competitors?period=last-30-days&audience=Commercial&saved=1");
    expect(saved()).toEqual(["coastline-linen-co", "evergreen-amenities"]);
    expect(jar.get(profileCookieName("jordan@example.com"))?.options).toMatchObject({ httpOnly: true });
  });

  it("keeps tracked competitors that were not shown for the chosen audience", async () => {
    signedInWithProfile(["granite-facility-goods", "pacific-room-supply"]);
    await redirectedTo(() =>
      saveTrackedCompetitors(form([["shown", "pacific-room-supply"], ["shown", "evergreen-amenities"], ["track", "evergreen-amenities"]])),
    );
    expect(saved()).toEqual(["granite-facility-goods", "evergreen-amenities"]);
  });

  it("ignores competitors that do not exist", async () => {
    signedInWithProfile();
    await redirectedTo(() => saveTrackedCompetitors(form([["shown", "made-up"], ["track", "made-up"]])));
    expect(saved()).toEqual(["pacific-room-supply"]);
  });

  it("can save the demo account's choice", async () => {
    jar.set(SESSION_COOKIE, { value: DEMO_ACCOUNT.email });
    await redirectedTo(() => saveTrackedCompetitors(form([["shown", "island-linens"], ["shown", "coastline-linen-co"], ["track", "coastline-linen-co"]])));
    expect(saved(DEMO_ACCOUNT.email)).toEqual(["pacific-room-supply", "coastline-linen-co"]);
  });

  it("only returns to the competitors page", async () => {
    signedInWithProfile();
    expect(await redirectedTo(() => saveTrackedCompetitors(form([["query", "x=1#evil"], ["shown", "pacific-room-supply"]])))).toBe(
      "/competitors?x=1&saved=1",
    );
  });

  it("sends anyone without a session to log in", async () => {
    expect(await redirectedTo(() => saveTrackedCompetitors(form([])))).toBe("/login");
  });
});
