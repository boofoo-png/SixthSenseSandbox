import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { formatChange } from "@/lib/analytics/change";
import { todayIsoDate } from "@/lib/analytics/dates";
import { formatPercent } from "@/lib/analytics/summary";
import { competitorActivity, weeklyEngagement } from "@/lib/competitors/activity";
import { FINDINGS, findPosts, formatPostDate, isFinding, type FindingId } from "@/lib/competitors/findings";
import { hospitalityAds, hospitalityPostsBetween } from "@/lib/competitors/hospitality";
import { recurringThemes } from "@/lib/competitors/themes";
import { pageDates, withQuery } from "@/lib/date-range";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { availableCompetitors, competitorsForAudience, selectedAudience, trackedCompetitors } from "@/lib/hub/tracking";
import { DateRangeBar } from "../_components/date-range-bar";
import { cardClass, cardHeadingClass, pageClass, subtitleClass, titleClass } from "../_components/styles";
import { saveTrackedCompetitors } from "./actions";
import { EngagementChart } from "./_components/engagement-chart";

export const metadata: Metadata = {
  title: "Research Competitors",
  description: "Track your competitors' posts, engagement, ads, and recurring campaign themes.",
};

// Research Competitors (docs/FUNCTIONALITY.md: competitor tracking, trend and campaign pattern
// detection, audience-based selection; mid-fi "COMPETITORS"). All figures are sample data.

const chipClass = (active: boolean) =>
  `inline-flex h-8 items-center rounded-full px-3 text-[13px] leading-[18px] tracking-[0.16px] transition-colors ${
    active ? "bg-primary text-primary-contrast" : "bg-selected text-ink hover:bg-ink/15"
  }`;
const tagClass = "inline-flex h-6 items-center rounded-full bg-selected px-2 text-[12px] tracking-[0.16px] text-ink";

/** The page's own address with some parameters changed (null removes one). */
function hrefWith(base: string, changes: Record<string, string | null>): string {
  const params = new URLSearchParams(base);
  params.delete("saved");
  for (const [key, value] of Object.entries(changes)) {
    if (value === null) params.delete(key);
    else params.set(key, value);
  }
  const query = params.toString();
  return query ? `/competitors?${query}` : "/competitors";
}

export default async function CompetitorsPage({ searchParams }: PageProps<"/competitors">) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const store = await cookies();
  const profile = profileForSession(store, store.get(SESSION_COOKIE)?.value ?? "");

  const available = availableCompetitors(profile);
  const tracked = trackedCompetitors(profile, available);
  const audience = selectedAudience(one("audience"), profile);
  const finding: FindingId | null = isFinding(one("finding")) ? (one("finding") as FindingId) : null;

  const today = todayIsoDate();
  const dates = pageDates(params, today);
  const posts = hospitalityPostsBetween(tracked, dates.dataRange);
  const current = posts.filter((post) => post.date >= dates.ranges.current.start && post.date <= dates.ranges.current.end);
  const activity = competitorActivity(tracked, posts, hospitalityAds(tracked, dates.ranges.current.end), dates.ranges);
  const themes = recurringThemes(current, tracked);
  const cards = findPosts(current, tracked, finding);
  const trackedSlugs = new Set(tracked.map((competitor) => competitor.slug));
  const choices = competitorsForAudience(available, audience);
  // Keeps the dates and the chosen audience and finding when moving around the page.
  const pageQuery = new URLSearchParams(dates.query);
  if (audience) pageQuery.set("audience", audience);
  if (finding) pageQuery.set("finding", finding);
  const base = pageQuery.toString();

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>Review your competitors.</h1>
      <p className={subtitleClass}>Review public messaging and recent campaign examples.</p>
      <Alert severity="info" className="mt-4 max-w-3xl">
        Sample data: the posts, numbers, and ads below are made up to show how tracking will work. They are not real figures for
        these companies.
      </Alert>
      {one("saved") === "1" && (
        <Alert severity="info" className="mt-4 max-w-3xl">
          Your competitor list was saved.
        </Alert>
      )}

      <div className="mt-6">
        <DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />
      </div>

      <section aria-labelledby="choose-heading" className={`mt-6 ${cardClass}`}>
        <h2 id="choose-heading" className={cardHeadingClass}>
          Competitors you track
        </h2>
        <p className="mt-1 text-[14px] leading-[1.43] text-ink-muted">
          Start with the competitors you added at sign-up, and add others that sell to your audiences.
        </p>
        {(profile?.audiences.length ?? 0) > 0 && (
          <nav aria-label="Audience" className="mt-4 flex flex-wrap gap-2">
            <Link href={hrefWith(base, { audience: null })} aria-current={audience === null ? "page" : undefined} className={chipClass(audience === null)}>
              All your audiences
            </Link>
            {profile?.audiences.map((option) => (
              <Link
                key={option}
                href={hrefWith(base, { audience: option })}
                aria-current={audience === option ? "page" : undefined}
                className={chipClass(audience === option)}
              >
                {option}
              </Link>
            ))}
          </nav>
        )}
        <form action={saveTrackedCompetitors} className="mt-4">
          <input type="hidden" name="query" value={base} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {choices.map((competitor) => (
              <li key={competitor.slug}>
                <input type="hidden" name="shown" value={competitor.slug} />
                <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-2 hover:bg-hover">
                  <input
                    type="checkbox"
                    name="track"
                    value={competitor.slug}
                    defaultChecked={trackedSlugs.has(competitor.slug)}
                    className="mt-[3px] size-[18px] shrink-0 cursor-pointer accent-primary"
                  />
                  <span>
                    <span className="block text-[16px] leading-[1.5] text-ink">{competitor.name}</span>
                    <span className="block text-[12px] leading-[1.66] tracking-[0.4px] text-ink-muted">
                      {competitor.source === "sign-up" ? "Added at sign-up" : `Sells to ${competitor.audiences.join(", ")}`}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Button type="submit" variant="contained" className="mt-4">
            Save competitors
          </Button>
        </form>
      </section>

      {tracked.length === 0 ? (
        <p className="mt-6 text-ink">You&apos;re not tracking any competitors yet. Tick some above and save to see their activity.</p>
      ) : (
        <>
          <section aria-labelledby="tracking-heading" className={`mt-6 ${cardClass}`}>
            <h2 id="tracking-heading" className={cardHeadingClass}>
              Competitor tracking
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-xl text-left text-sm">
                <caption className="sr-only">Posting frequency, engagement, and active ads for each tracked competitor</caption>
                <thead className="text-ink-muted">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-medium">Competitor</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Posts</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Engagement rate</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Change</th>
                    <th scope="col" className="py-2 font-medium">Active ads</th>
                  </tr>
                </thead>
                <tbody className="text-ink">
                  {activity.map((row) => (
                    <tr key={row.competitor.slug} className="border-t border-divider">
                      <th scope="row" className="py-3 pr-4 font-medium">
                        <Link href={withQuery(`/competitors/${row.competitor.slug}`, dates.query)} className="text-primary underline underline-offset-4">
                          {row.competitor.name}
                        </Link>
                      </th>
                      <td className="py-3 pr-4">{row.postsThisWeek}</td>
                      <td className="py-3 pr-4">{formatPercent(row.engagementRate, 1)}</td>
                      <td className="py-3 pr-4">{formatChange(row.engagementRateChange)}</td>
                      <td className="py-3">{row.activeAds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[12px] leading-[1.66] tracking-[0.4px] text-ink-muted">
              Open a competitor for its best and worst posts, most used hashtags, and running ads.
            </p>
          </section>

          <section aria-labelledby="posts-heading" className="mt-8">
            <h2 id="posts-heading" className={cardHeadingClass}>
              Recent posts
            </h2>
            <p className="mt-3 text-[14px] leading-[1.43] tracking-[0.17px] text-ink">Filter by findings:</p>
            <nav aria-label="Findings" className="mt-2 flex flex-wrap gap-2">
              <Link href={hrefWith(base, { finding: null })} aria-current={finding === null ? "page" : undefined} className={chipClass(finding === null)}>
                Newest
              </Link>
              {FINDINGS.map((option) => (
                <Link
                  key={option.id}
                  href={hrefWith(base, { finding: option.id })}
                  aria-current={finding === option.id ? "page" : undefined}
                  className={chipClass(finding === option.id)}
                >
                  {option.label}
                </Link>
              ))}
            </nav>
            {cards.length === 0 ? (
              <p className="mt-4 text-ink-muted">No posts match this finding in the selected period.</p>
            ) : (
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map(({ post, competitorName, tags }) => (
                  <article key={`${post.competitor}-${post.date}-${post.caption}`} className="flex flex-col rounded bg-paper p-4 shadow-elevation-1">
                    <p className="text-[14px] leading-[1.57] tracking-[0.1px] font-medium text-primary">
                      {`${competitorName} - ${formatPostDate(post.date, today)}`}
                    </p>
                    <h3 className="mt-2 text-[20px] leading-[1.6] tracking-[0.15px] font-medium text-ink">{post.caption}</h3>
                    {post.summary && <p className="mt-2 text-[16px] leading-[1.5] tracking-[0.15px] text-ink-muted">{post.summary}</p>}
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <li key={tag} className={tagClass}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="themes-heading" className={`mt-8 ${cardClass}`}>
            <h2 id="themes-heading" className={cardHeadingClass}>
              Recurring themes
            </h2>
            <p className="mt-1 text-[14px] leading-[1.43] text-ink-muted">Campaign themes used by two or more of the competitors you track.</p>
            {themes.length === 0 ? (
              <p className="mt-3 text-ink">No theme is shared by two or more of your competitors in this period.</p>
            ) : (
              <ul className="mt-3 divide-y divide-divider">
                {themes.map((theme) => (
                  <li key={theme.theme} className="py-3">
                    <h3 className="text-[16px] leading-[1.5] font-medium text-ink">{theme.theme}</h3>
                    <p className="text-[14px] leading-[1.43] text-ink-muted">
                      {`Used by ${theme.competitors.join(", ")} in ${theme.posts} ${theme.posts === 1 ? "post" : "posts"}.`}
                    </p>
                    <p className="text-[14px] leading-[1.43] text-ink">{`Best example: ${theme.example.competitor}, "${theme.example.caption}"`}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8">
            <EngagementChart data={weeklyEngagement(tracked, posts, dates.ranges.current)} />
          </div>
        </>
      )}
    </main>
  );
}
