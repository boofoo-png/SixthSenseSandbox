import { findAccount } from "./accounts";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "./constants";
import { BUSINESS_COOKIE, OWN_BUSINESS_ID, SIXTH_SENSE, pickBusiness, type WorkspaceBusiness } from "./businesses";
import { DEMO_COMPANY, profileForSession } from "./demo-profile";
import { hasSavedSettings, settingsFor } from "./settings";

// Who is signed in and which business they are working on, for the top bar's company menu,
// the welcome message, and pages whose data depends on the business.

type CookieReader = { get(name: string): { value: string } | undefined };

export type Workspace = {
  name: string;
  firstName: string;
  initials: string;
  /** The chosen business's name (shown in the top bar). */
  company: string;
  email: string;
  /** Businesses this workspace manages: two for the demo account, one otherwise. */
  businesses: WorkspaceBusiness[];
  /** The business chosen in the top bar's company menu. */
  business: WorkspaceBusiness;
  /** Competitors added at sign-up, by name. */
  competitors: string[];
};

const NO_COMPANY = "Your business";

/** "John Doe" -> "JD"; one name gives one letter. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

/** The signed-in person and business, from the session and the account saved in this browser. */
export function workspaceFor(jar: CookieReader): Workspace {
  const email = jar.get(SESSION_COOKIE)?.value ?? "";
  const competitors = email ? (profileForSession(jar, email)?.competitors ?? []).map((competitor) => competitor.name) : [];

  let name: string;
  let company = NO_COMPANY;
  if (email === DEMO_ACCOUNT.email) {
    name = DEMO_ACCOUNT.name;
    company = DEMO_COMPANY;
  } else {
    const account = email ? findAccount(jar, email)?.account : undefined;
    name = account ? `${account.firstName} ${account.lastName}`.trim() : "";
    if (account?.company.trim()) company = account.company.trim();
    if (!name) name = email ? email.split("@")[0] : "Guest";
  }

  // Names and company saved on the Settings page win over the sign-up answers.
  if (email && hasSavedSettings(jar, email)) {
    const saved = settingsFor(jar, email);
    name = `${saved.firstName} ${saved.lastName}`.trim() || name;
    company = saved.company || company;
  }

  const businesses: WorkspaceBusiness[] =
    email === DEMO_ACCOUNT.email
      ? [{ id: SIXTH_SENSE.id, name: company }]
      : [{ id: OWN_BUSINESS_ID, name: company }];
  const business = pickBusiness(businesses, jar.get(BUSINESS_COOKIE)?.value);

  return { name, firstName: name.split(/\s+/)[0], initials: initialsOf(name), company: business.name, email, competitors, businesses, business };
}
