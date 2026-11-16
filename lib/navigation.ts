/** Product name from the team's mid-fi screens (see docs/DECISIONS.md, 2026-10-22). */
export const APP_NAME = "Sixth Sense";

export type NavStatus = "ready" | "coming-soon";

/** A page in the navigation. Unbuilt pages say what is planned for them. */
export type NavItem = { href: string; label: string } & (
  | { status: "ready" }
  | {
      status: "coming-soon";
      /** One sentence on what the page is for. */
      summary: string;
      /** Features planned from the mid-fi, shown on the "Coming soon" page. */
      planned: readonly string[];
      /** A finished feature people can use in the meantime. */
      availableNow?: { href: string; label: string; description: string };
    }
);

/** The dashboard and the seven areas, in the order of the dashboard tiles (mid-fi). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", status: "ready" },
  { href: "/insights", label: "Insight Report", status: "ready" },
  { href: "/competitors", label: "Research Competitors", status: "ready" },
  { href: "/explore", label: "Explore Audience and Trend", status: "ready" },
  { href: "/ai-management", label: "AI Management", status: "ready" },
  { href: "/content", label: "Content Creation", status: "ready" },
  { href: "/campaigns", label: "Campaigns", status: "ready" },
];

/** Pages behind the profile and settings buttons in the top bar. */
export const ACCOUNT_ITEMS: readonly NavItem[] = [
  { href: "/profile", label: "Profile", status: "ready" },
  { href: "/settings", label: "Settings", status: "ready" },
];

/**
 * The sidebar menu from the Figma Make "Marketing Intelligence Hub", in its order and wording.
 * Updated by the team on 2026-11-05; Reports opens Insight Report.
 */
export const SIDEBAR_ITEMS = [
  { label: "Overview", href: "/", icon: "overview" },
  { label: "Audience Trends", href: "/explore", icon: "audience" },
  { label: "Competitors", href: "/competitors", icon: "building" },
  { label: "Content Creation", href: "/content", icon: "download" },
  { label: "Campaigns", href: "/campaigns", icon: "campaign" },
  { label: "AI Management", href: "/ai-management", icon: "sparkles" },
  { label: "Reports", href: "/insights", icon: "clipboard" },
] as const;

/** True when `pathname` is the page at `href` or one of its sub-pages. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
