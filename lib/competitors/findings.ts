import { daysInRange } from "@/lib/analytics/dates";
import { recurringThemes } from "./themes";
import type { Competitor, CompetitorPost } from "./types";

// "Filter by findings" on Research Competitors (mid-fi). Only the filters sample data can
// answer are offered; "Most popular item", "Common reused layouts", and "Most used by users"
// need data the prototype does not have.

export const FINDINGS = [
  { id: "most-viewed", label: "Most viewed post" },
  { id: "most-liked", label: "Most liked post" },
  { id: "popular-trends", label: "Most popular trends" },
] as const;

export type FindingId = (typeof FINDINGS)[number]["id"];

export function isFinding(value: unknown): value is FindingId {
  return FINDINGS.some((finding) => finding.id === value);
}

export type PostCard = { post: CompetitorPost; competitorName: string; tags: string[] };

/** Post cards for the chosen finding (newest first when none), from tracked competitors only. */
export function findPosts(
  posts: readonly CompetitorPost[],
  competitors: readonly Competitor[],
  finding: FindingId | null,
  limit = 6,
): PostCard[] {
  const names = new Map(competitors.map((competitor) => [competitor.slug, competitor.name]));
  const tracked = posts.filter((post) => names.has(post.competitor));
  const byViews = [...tracked].sort((a, b) => b.impressions - a.impressions);
  const byLikes = [...tracked].sort((a, b) => b.engagements - a.engagements);
  const topTheme = recurringThemes(tracked, competitors)[0]?.theme;

  let chosen: CompetitorPost[];
  if (finding === "most-viewed") chosen = byViews;
  else if (finding === "most-liked") chosen = byLikes;
  else if (finding === "popular-trends") chosen = byLikes.filter((post) => topTheme !== undefined && post.theme === topTheme);
  else chosen = [...tracked].sort((a, b) => b.date.localeCompare(a.date) || b.engagements - a.engagements);

  return chosen.slice(0, limit).map((post) => ({
    post,
    competitorName: names.get(post.competitor) ?? post.competitor,
    tags: [
      ...(post.theme ? [post.theme] : []),
      ...(post === byViews[0] ? ["Most viewed post"] : []),
      ...(post === byLikes[0] ? ["Most liked post"] : []),
      ...(topTheme !== undefined && post.theme === topTheme ? ["Most popular trend"] : []),
    ],
  }));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct 8 (1 day ago)", like the mid-fi's "21 Oct (12hr ago)", in the app's month-first style. */
export function formatPostDate(date: string, today: string): string {
  const [, month, day] = date.split("-").map(Number);
  const daysAgo = date >= today ? 0 : daysInRange({ start: date, end: today }) - 1;
  const ago =
    daysAgo === 0 ? "today" : daysAgo === 1 ? "1 day ago" : daysAgo < 7 ? `${daysAgo} days ago` : daysAgo < 14 ? "1 week ago" : `${Math.floor(daysAgo / 7)} weeks ago`;
  return `${MONTHS[month - 1]} ${day} (${ago})`;
}
