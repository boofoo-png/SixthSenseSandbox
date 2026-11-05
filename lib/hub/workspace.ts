import { findAccount } from "./accounts";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "./constants";
import { DEMO_COMPANY, profileForSession } from "./demo-profile";

// Who is signed in, for the sidebar profile, the company button, and the welcome message.

type CookieReader = { get(name: string): { value: string } | undefined };

export type Workspace = {
  name: string;
  firstName: string;
  initials: string;
  company: string;
  email: string;
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

  return { name, firstName: name.split(/\s+/)[0], initials: initialsOf(name), company, email, competitors };
}
