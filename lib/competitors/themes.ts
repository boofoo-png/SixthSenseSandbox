import { engagementRate } from "@/lib/analytics/kpis";
import type { Competitor, CompetitorPost } from "./types";

// Trend and campaign pattern detection (docs/FUNCTIONALITY.md): campaign themes that more than
// one tracked competitor is using.

export type RecurringTheme = {
  theme: string;
  /** Names of the competitors using it, in the order they were given. */
  competitors: string[];
  posts: number;
  /** The theme's best-performing post (highest engagement rate). */
  example: { competitor: string; caption: string };
};

export const MIN_COMPETITORS_FOR_PATTERN = 2;

/** Themes used by at least two of `competitors`, most widespread first, then most posts. */
export function recurringThemes(posts: readonly CompetitorPost[], competitors: readonly Competitor[]): RecurringTheme[] {
  const names = new Map(competitors.map((competitor) => [competitor.slug, competitor.name]));
  const byTheme = new Map<string, CompetitorPost[]>();
  for (const post of posts) {
    if (!post.theme || !names.has(post.competitor)) continue;
    byTheme.set(post.theme, [...(byTheme.get(post.theme) ?? []), post]);
  }

  const themes: RecurringTheme[] = [];
  for (const [theme, themed] of byTheme) {
    const users = competitors.filter((competitor) => themed.some((post) => post.competitor === competitor.slug)).map((c) => c.name);
    if (users.length < MIN_COMPETITORS_FOR_PATTERN) continue;
    const best = [...themed].sort((a, b) => engagementRate(b.engagements, b.impressions) - engagementRate(a.engagements, a.impressions))[0];
    themes.push({
      theme,
      competitors: users,
      posts: themed.length,
      example: { competitor: names.get(best.competitor) ?? best.competitor, caption: best.caption },
    });
  }
  return themes.sort((a, b) => b.competitors.length - a.competitors.length || b.posts - a.posts);
}
