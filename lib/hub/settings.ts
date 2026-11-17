import { findAccount, settingsCookieName } from "./accounts";
import { DEMO_ACCOUNT } from "./constants";
import { decodeCookieJson, isRecord } from "./cookie-json";
import { DEMO_COMPANY, profileForSession } from "./demo-profile";
import { INDUSTRIES } from "./onboarding";
import { MAX_TEXT } from "./text";

// The Settings page from the team's Figma Make (2026-11-06): profile, workspace, and notification
// preferences, saved per account in its own cookie. Email stays as it is: it is how people sign in.

/** The Settings page's sections, in the Make's order. Kept here so server pages can read them. */
export const SECTIONS = ["Profile", "Workspace", "Notifications", "Security"] as const;
export type Section = (typeof SECTIONS)[number];

export const TIME_ZONES = ["Pacific Time (PT)", "Mountain Time (MT)", "Central Time (CT)", "Eastern Time (ET)", "Atlantic Time (AT)"] as const;
export type TimeZone = (typeof TIME_ZONES)[number];

export const NOTIFICATION_TYPES = [
  { id: "competitor", title: "Competitor campaign alerts", detail: "When a watched competitor launches a new campaign." },
  { id: "trends", title: "Trend spike alerts", detail: "When a relevant topic gains unusual momentum." },
  { id: "reports", title: "Report reminders", detail: "Before your weekly report is ready to review." },
  { id: "posts", title: "Scheduled post reminders", detail: "Before a post on your content calendar goes out." },
] as const;
export type NotificationId = (typeof NOTIFICATION_TYPES)[number]["id"];

export type AccountSettings = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  company: string;
  website: string;
  industry: string;
  timeZone: TimeZone;
  notifications: Record<NotificationId, boolean>;
};

type CookieReader = { get(name: string): { value: string } | undefined };

const DEFAULT_NOTIFICATIONS: Record<NotificationId, boolean> = { competitor: true, trends: true, reports: false, posts: true };

/** Settings before anything is saved: from the account and sign-up answers (or the demo business). */
export function defaultSettings(jar: CookieReader, email: string): AccountSettings {
  const profile = profileForSession(jar, email);
  const base = {
    email,
    website: profile?.website ?? "",
    industry: profile?.industries[0] ?? "Wholesale",
    timeZone: "Pacific Time (PT)" as TimeZone,
    notifications: { ...DEFAULT_NOTIFICATIONS },
  };
  if (email === DEMO_ACCOUNT.email) {
    const [firstName, ...rest] = DEMO_ACCOUNT.name.split(" ");
    return { ...base, firstName, lastName: rest.join(" "), role: "Marketing lead", phone: "", company: DEMO_COMPANY };
  }
  const account = findAccount(jar, email)?.account;
  return {
    ...base,
    firstName: account?.firstName ?? email.split("@")[0],
    lastName: account?.lastName ?? "",
    role: account?.role ?? "",
    phone: account?.phone ?? "",
    company: account?.company ?? "",
  };
}

function isSettings(value: unknown): value is AccountSettings {
  if (!isRecord(value) || !isRecord(value.notifications)) return false;
  const strings = ["email", "firstName", "lastName", "role", "phone", "company", "website", "industry", "timeZone"] as const;
  return (
    strings.every((key) => typeof value[key] === "string") &&
    (TIME_ZONES as readonly string[]).includes(value.timeZone as string) &&
    NOTIFICATION_TYPES.every((type) => typeof (value.notifications as Record<string, unknown>)[type.id] === "boolean")
  );
}

/** The saved settings for `email`, or the defaults. */
export function settingsFor(jar: CookieReader, email: string): AccountSettings {
  const saved = decodeCookieJson(jar.get(settingsCookieName(email))?.value, isSettings);
  return saved && saved.email === email ? saved : defaultSettings(jar, email);
}

/** True once the person has saved Settings (so their name and company override the account's). */
export function hasSavedSettings(jar: CookieReader, email: string): boolean {
  return decodeCookieJson(jar.get(settingsCookieName(email))?.value, isSettings)?.email === email;
}

export type SettingsField = "firstName" | "lastName" | "role" | "phone" | "company" | "website" | "industry" | "timeZone";
export type SettingsErrors = Partial<Record<SettingsField, string>>;

const PHONE = /^[0-9+()\-.\s]{7,20}$/;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** The Settings form as submitted, checked; the email always stays the signed-in one. */
export function readSettingsForm(formData: FormData, email: string): { ok: true; settings: AccountSettings } | { ok: false; errors: SettingsErrors; values: AccountSettings } {
  const values: AccountSettings = {
    email,
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    role: text(formData, "role"),
    phone: text(formData, "phone"),
    company: text(formData, "company"),
    website: text(formData, "website"),
    industry: text(formData, "industry"),
    timeZone: text(formData, "timeZone") as TimeZone,
    notifications: Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type.id, formData.get(`notify-${type.id}`) === "on"])) as Record<NotificationId, boolean>,
  };
  const errors: SettingsErrors = {};
  if (!values.firstName) errors.firstName = "Enter your first name.";
  if (!values.lastName) errors.lastName = "Enter your last name.";
  if (!values.company) errors.company = "Enter your company name.";
  for (const key of ["firstName", "lastName", "role", "company"] as const) {
    if (!errors[key] && values[key].length > MAX_TEXT) errors[key] = `Keep this under ${MAX_TEXT} characters.`;
  }
  if (values.phone && !PHONE.test(values.phone)) errors.phone = "Enter a phone number, like 604-555-0148.";
  if (values.website) {
    const withScheme = /^https?:\/\//i.test(values.website) ? values.website : `https://${values.website}`;
    try {
      const url = new URL(withScheme);
      if (!url.hostname.includes(".") || withScheme.length > 200) throw new Error("bad");
      values.website = withScheme;
    } catch {
      errors.website = "Enter a website address, like sixthsense.example.";
    }
  }
  if (!INDUSTRIES.includes(values.industry)) errors.industry = "Choose an industry.";
  if (!(TIME_ZONES as readonly string[]).includes(values.timeZone)) errors.timeZone = "Choose a time zone.";
  return Object.keys(errors).length > 0 ? { ok: false, errors, values } : { ok: true, settings: values };
}
