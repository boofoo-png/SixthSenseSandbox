/** Placeholder until the product is named (see the open question in docs/IMPLEMENTATION_PLAN.md). */
export const APP_NAME = "Marketing Dashboard";

export type NavStatus = "ready" | "coming-soon";

export type NavItem = {
  href: string;
  label: string;
  status: NavStatus;
};

/** App sections in sidebar order (see docs/DECISIONS.md: app shell). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Overview", status: "ready" },
  { href: "/analytics", label: "Analytics", status: "ready" },
  { href: "/competitors", label: "Competitors", status: "ready" },
  { href: "/ai-studio", label: "AI Studio", status: "ready" },
  { href: "/reports", label: "Reports", status: "ready" },
];

/** True when `pathname` is the section at `href` or one of its sub-pages. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
