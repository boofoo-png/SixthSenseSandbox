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
    }
);

/** The dashboard and the seven areas, in the order of the dashboard tiles (mid-fi). */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard", status: "ready" },
  { href: "/insights", label: "Insight Report", status: "ready" },
  {
    href: "/findings",
    label: "Revisit Findings",
    status: "coming-soon",
    summary: "Come back to the research you saved.",
    planned: [
      "Saved trends, audiences, and competitor insights in one place",
      "Filter by trends, audiences, or competitors",
      "Turn any finding into a campaign",
    ],
  },
  { href: "/competitors", label: "Research Competitors", status: "ready" },
  {
    href: "/explore",
    label: "Explore Audience and Trend",
    status: "coming-soon",
    summary: "Find out what your customers care about and what is changing in your market.",
    planned: [
      "Search trends by industry, location, and time period",
      "Trend details with related keywords and sources",
      "Audience profiles with needs, challenges, and interests",
      "Save what you find or start a campaign from it",
    ],
  },
  {
    href: "/ai-management",
    label: "AI Management",
    status: "coming-soon",
    summary: "Plan when and how often to post.",
    planned: [
      "A posting plan: how often, the best days and times, and the content mix",
      "A content calendar for each platform",
      "Upcoming posts and connected accounts",
      "Auto publishing is coming later; for now you post yourself",
    ],
  },
  {
    href: "/content",
    label: "Content Creation",
    status: "coming-soon",
    summary: "Create, re-purpose, and edit content with the help of AI.",
    planned: [
      "Social posts: caption, visual guidelines, keywords, and hashtags",
      "Ideas for videos, blogs, and ad copy",
      "Edit posts, improve copy, and repurpose content for other platforms",
    ],
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    status: "coming-soon",
    summary: "Turn your research into a campaign.",
    planned: [
      "Choose the products, the goal (awareness, leads, or sales), and the audience",
      "Build an audience, or let Sixth Sense suggest one",
      "A campaign brief: objective, audience, key message, channels, and next steps",
    ],
  },
];

/** Pages behind the profile and settings buttons in the top bar. */
export const ACCOUNT_ITEMS: readonly NavItem[] = [
  {
    href: "/profile",
    label: "Profile",
    status: "coming-soon",
    summary: "Your account details.",
    planned: ["Your name, role, and contact details", "Sign out"],
  },
  {
    href: "/settings",
    label: "Settings",
    status: "coming-soon",
    summary: "Tailor Sixth Sense to your business.",
    planned: [
      "Your industry, target regions, and audience",
      "Your marketing goals",
      "Connected accounts and the competitors you follow",
    ],
  },
];

/** True when `pathname` is the page at `href` or one of its sub-pages. */
export function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
