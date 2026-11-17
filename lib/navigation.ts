/** Product name from the team's mid-fi screens (see docs/DECISIONS.md, 2026-10-22). */
export const APP_NAME = "Sixth Sense";

/**
 * The sidebar menu from the Figma Make "Marketing Intelligence Hub", in its order and wording.
 * Re-checked 2026-11-16: Campaigns left the menu and opens from Content Creation, so that item
 * stays active there (`also`). Reports opens Insight Report.
 */
export const SIDEBAR_ITEMS: readonly { label: string; href: string; icon: "overview" | "audience" | "building" | "download" | "sparkles" | "clipboard"; also?: readonly string[] }[] = [
  { label: "Overview", href: "/", icon: "overview" },
  { label: "Audience Trends", href: "/explore", icon: "audience" },
  { label: "Competitors", href: "/competitors", icon: "building" },
  { label: "Content Creation", href: "/content", icon: "download", also: ["/campaigns"] },
  { label: "AI Management", href: "/ai-management", icon: "sparkles" },
  { label: "Reports", href: "/insights", icon: "clipboard" },
];

/** True when `pathname` is the page at `href` or one of its sub-pages. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
