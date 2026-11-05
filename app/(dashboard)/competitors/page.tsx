import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { LineIcon } from "@/components/line-icons";
import { formatShortDate, todayIsoDate } from "@/lib/analytics/dates";
import { engagementRate } from "@/lib/analytics/kpis";
import { formatPercent } from "@/lib/analytics/summary";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import { competitorActivity } from "@/lib/competitors/activity";
import { hospitalityAds, hospitalityPostsBetween } from "@/lib/competitors/hospitality";
import type { CompetitorPost } from "@/lib/competitors/types";
import {
  attentionShare,
  audienceMatch,
  channelActivity,
  competitorSummary,
  newCampaigns,
  themePatterns,
} from "@/lib/competitors/watchlist";
import { pageDates, withQuery } from "@/lib/date-range";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { availableCompetitors, competitorsForAudience, selectedAudience, trackedCompetitors } from "@/lib/hub/tracking";
import { DateRangeBar } from "../_components/date-range-bar";
import { MakePageHeader, PanelHeading, StatCard, chipClass, makePageClass, panelClass, softLinkClass } from "../_components/make-ui";
import { saveTrackedCompetitors } from "./actions";

export const metadata: Metadata = {
  title: "Research Competitors",
  description: "Track your competitors' posting, engagement, best and worst posts, hashtags, ads, and recurring campaign themes.",
};

// Research Competitors, laid out like the Competitors page of the team's Figma Make "Marketing
// Intelligence Hub" (docs/FUNCTIONALITY.md: competitor tracking, trend and campaign pattern
// detection, audience-based selection). All posts, ads, and figures are generated sample data.

const LOGO_STYLES = ["bg-brand-teal text-brand-cream", "bg-brand-navy text-brand-lime", "bg-brand-lime text-brand-teal"];

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

function signed(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function Logo({ name, index, size = "size-[38px] text-[15px]" }: { name: string; index: number; size?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-[10px] font-bold ${size} ${LOGO_STYLES[index % LOGO_STYLES.length]}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function PostCard({ label, post, tone }: { label: string; post: CompetitorPost; tone: "best" | "worst" }) {
  return (
    <article className={`grid gap-2 rounded-[10px] border p-3.5 ${tone === "best" ? "border-[rgba(116,195,101,0.6)] bg-[#f1f8ef]" : "border-brand-coral/40 bg-[#fff5f3]"}`}>
      <div className="grid gap-1">
        <span className="text-[10px] font-bold tracking-[0.08em] text-brand-slate uppercase">{label}</span>
        <small className={chipClass}>{PLATFORM_LABELS[post.platform]} · {formatShortDate(post.date)}</small>
        <strong className="text-[14px] text-brand-navy">{post.caption}</strong>
      </div>
      {post.summary && <p className="text-[12px] leading-normal text-[#5f6366]">{post.summary}</p>}
      <footer className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-brand-teal">
        <span>{formatPercent(engagementRate(post.engagements, post.impressions), 1)} engagement</span>
        <span>{post.engagements.toLocaleString("en-CA")} engagements</span>
        <span>{post.impressions.toLocaleString("en-CA")} impressions</span>
      </footer>
    </article>
  );
}

export default async function CompetitorsPage({ searchParams }: PageProps<"/competitors">) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const store = await cookies();
  const profile = profileForSession(store, store.get(SESSION_COOKIE)?.value ?? "");

  const available = availableCompetitors(profile);
  const tracked = trackedCompetitors(profile, available);
  const trackedSlugs = new Set(tracked.map((competitor) => competitor.slug));
  const audience = selectedAudience(one("audience"), profile);
  const choices = competitorsForAudience(available, audience)
    .map((competitor) => ({ competitor, match: audienceMatch(competitor, audience) }))
    // Sign-up competitors first (docs/FUNCTIONALITY.md), then the closest audience match.
    .sort((a, b) => Number(b.competitor.source === "sign-up") - Number(a.competitor.source === "sign-up") || b.match - a.match);

  const today = todayIsoDate();
  const dates = pageDates(params, today);
  const posts = hospitalityPostsBetween(tracked, dates.dataRange);
  const ads = hospitalityAds(tracked, dates.ranges.current.end);
  const activity = competitorActivity(tracked, posts, ads, dates.ranges);
  const share = attentionShare(tracked, posts, dates.ranges);
  const activeAds = activity.reduce((sum, row) => sum + row.activeAds, 0);
  const patterns = themePatterns(posts, tracked, dates.ranges);

  const selected = tracked.find((competitor) => competitor.slug === one("competitor")) ?? tracked[0];
  const summary = selected ? competitorSummary(selected.slug, posts, ads, dates.ranges) : null;
  const channels = selected ? channelActivity(selected.slug, posts, ads, dates.ranges.current) : [];
  const latestAd = summary?.activeAds.toSorted((a, b) => b.startDate.localeCompare(a.startDate))[0];

  // Keeps the dates, the chosen audience, and the chosen competitor when moving around the page.
  const pageQuery = new URLSearchParams(dates.query);
  if (audience) pageQuery.set("audience", audience);
  if (selected && one("competitor") === selected.slug) pageQuery.set("competitor", selected.slug);
  const base = pageQuery.toString();

  return (
    <main className={makePageClass}>
      <MakePageHeader
        eyebrow="Competitive intelligence"
        title="See what your market is responding to"
        description="Track posting frequency, engagement, active ads, hashtags, and campaign patterns across your competitor watchlist."
        question="How are competitors reaching hotels?"
      />

      <div className={`${panelClass} mb-3 grid gap-3`}>
        <p className="text-[12px] leading-normal text-[#4f5d5f]">
          <strong className="text-brand-navy">Sample data:</strong> the posts, numbers, and ads below are made up to show how tracking
          will work. They are not real figures for these companies.
        </p>
        <DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />
      </div>
      {one("saved") === "1" && (
        <p role="status" className="mb-3 rounded-[10px] border border-[rgba(116,195,101,0.52)] bg-brand-cream/90 px-3.5 py-3 text-[12px] font-semibold text-brand-teal">
          Your competitor list was saved.
        </p>
      )}

      <div className="mb-3 grid gap-3 min-[621px]:grid-cols-2 min-[901px]:grid-cols-3">
        <StatCard
          icon="target"
          label="Share of attention"
          value={share ? formatPercent(share.share, 1) : "—"}
          detail={share ? `${share.leader} leads the ${share.competitors} you track` : "No engagement in this period"}
        />
        <StatCard icon="activity" label="Active competitor ads" value={String(activeAds)} detail="Across Meta, Google, and TikTok" warm />
        <StatCard
          icon="bell"
          label="New campaigns"
          value={String(newCampaigns(ads, dates.ranges.current))}
          detail={`Started ${dates.currentLabel}`}
          warm
        />
      </div>

      <section aria-labelledby="watchlist-title" className={`${panelClass} mb-3`}>
        <PanelHeading id="watchlist-title" eyebrow="Audience-based selection" title="Track the competitors your audience is likely to compare">
          <span className="text-[11px] text-[#6f7377]">{tracked.length} tracked</span>
        </PanelHeading>
        {(profile?.audiences.length ?? 0) > 0 && (
          <div className="mt-3.5 flex flex-col items-start gap-2 rounded-lg bg-[#e8efdc] px-2.5 py-2 min-[621px]:flex-row min-[621px]:items-center min-[621px]:gap-3">
            <span className="text-[11px] font-semibold whitespace-nowrap text-[#4f5d5f]">Selected audience</span>
            <nav aria-label="Audience" className="flex flex-wrap gap-1">
              {[null, ...(profile?.audiences ?? [])].map((option) => {
                const current = audience === option;
                return (
                  <Link
                    key={option ?? "all"}
                    href={hrefWith(base, { audience: option, competitor: null })}
                    scroll={false}
                    aria-current={current ? "page" : undefined}
                    className={`rounded-md px-[11px] py-[7px] text-[11px] ${current ? "bg-brand-cream font-semibold text-brand-navy shadow-sm" : "text-[#4f5357] hover:text-brand-navy"}`}
                  >
                    {option ?? "All your audiences"}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
        <ul className="mt-3 grid gap-2 min-[621px]:grid-cols-2 min-[1101px]:grid-cols-4">
          {choices.map(({ competitor, match }, index) => {
            const isTracked = trackedSlugs.has(competitor.slug);
            return (
              <li
                key={competitor.slug}
                className={`grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 rounded-[9px] border p-3 ${isTracked ? "border-brand-lime bg-[#f2f7f6]" : "border-brand-teal/12 bg-[#fafaf8]"}`}
              >
                <Logo name={competitor.name} index={index} />
                <div className="grid min-w-0 gap-[3px]">
                  <strong className="truncate text-[13px] text-brand-navy">{competitor.name}</strong>
                  <p className="text-[11px] text-[#5f6366]">
                    {competitor.source === "sign-up" ? "Added during sign-up" : `Sells to ${competitor.audiences.join(", ")}`}
                  </p>
                  <span className="text-[10px] font-bold text-brand-teal">{match}% audience match</span>
                </div>
                <form action={saveTrackedCompetitors} className="col-span-full">
                  <input type="hidden" name="query" value={base} />
                  <input type="hidden" name="shown" value={competitor.slug} />
                  {!isTracked && <input type="hidden" name="track" value={competitor.slug} />}
                  <button
                    type="submit"
                    aria-label={`${isTracked ? "Stop tracking" : "Track"} ${competitor.name}`}
                    className={`inline-flex min-h-[29px] w-full items-center justify-center gap-1.5 rounded-md border text-[11px] font-semibold ${
                      isTracked
                        ? "border-brand-teal bg-brand-teal text-brand-cream hover:bg-[#00545f]"
                        : "border-brand-teal/15 bg-[#fafaf9] text-[#4f5357] hover:border-brand-teal hover:text-brand-teal"
                    }`}
                  >
                    {isTracked ? "Tracking" : "Track"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      {!selected || !summary ? (
        <p className={`${panelClass} text-[13px]`}>You&apos;re not tracking any competitors yet. Choose Track on a competitor above to see their activity.</p>
      ) : (
        <>
          <div className="grid gap-3 min-[901px]:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
            <section aria-labelledby="tracking-title" className={`${panelClass} min-[901px]:min-h-[380px]`}>
              <PanelHeading id="tracking-title" eyebrow="Competitor tracking" title={`${selected.name} performance`}>
                <Link href={withQuery(`/competitors/${selected.slug}`, dates.query)} className={softLinkClass}>
                  Full profile <LineIcon name="chevron" size={14} />
                </Link>
              </PanelHeading>
              <nav aria-label="Tracked competitors" className="mt-3.5 flex flex-wrap gap-1.5">
                {tracked.map((competitor, index) => {
                  const current = competitor.slug === selected.slug;
                  return (
                    <Link
                      key={competitor.slug}
                      href={hrefWith(base, { competitor: competitor.slug })}
                      scroll={false}
                      aria-current={current ? "true" : undefined}
                      className={`flex min-h-[34px] items-center gap-[7px] rounded-[20px] border py-1 pr-2.5 pl-[5px] text-[11px] ${
                        current ? "border-brand-teal bg-brand-teal text-brand-cream" : "border-brand-teal/15 bg-[#fafaf8] text-[#4f5357] hover:border-brand-teal"
                      }`}
                    >
                      <Logo name={competitor.name} index={index} size="size-6 text-[11px] rounded-full" />
                      {competitor.name}
                    </Link>
                  );
                })}
              </nav>
              <dl className="mt-3.5 grid gap-2 min-[621px]:grid-cols-3">
                <div className="grid gap-1 rounded-[9px] bg-[#f0f4ea] p-3">
                  <dt className="text-[11px] text-[#5f6366]">Posting frequency</dt>
                  <dd className="text-[20px] font-semibold text-brand-navy">{summary.postsPerWeek} / week</dd>
                  <dd className="text-[11px] font-semibold text-brand-teal">
                    {summary.postsChange === null ? "No posts to compare" : `${signed(summary.postsChange * 100)}% vs ${dates.comparisonLabel}`}
                  </dd>
                </div>
                <div className="grid gap-1 rounded-[9px] bg-[#f0f4ea] p-3">
                  <dt className="text-[11px] text-[#5f6366]">Average engagement</dt>
                  <dd className="text-[20px] font-semibold text-brand-navy">{formatPercent(summary.engagementRate, 1)}</dd>
                  <dd className="text-[11px] font-semibold text-brand-teal">
                    {summary.engagementChangePoints === null ? "No posts to compare" : `${signed(summary.engagementChangePoints, 1)} points`}
                  </dd>
                </div>
                <div className="grid gap-1 rounded-[9px] bg-[#f0f4ea] p-3">
                  <dt className="text-[11px] text-[#5f6366]">Active ads</dt>
                  <dd className="text-[20px] font-semibold text-brand-navy">{summary.activeAds.length}</dd>
                  <dd className="text-[11px] text-[#5f6366]">{summary.adLibraries.join(" · ") || "None running"}</dd>
                </div>
              </dl>
              {summary.best ? (
                <div className="mt-3 grid gap-2 min-[621px]:grid-cols-2">
                  <PostCard label="Best-performing post" post={summary.best} tone="best" />
                  {summary.worst && <PostCard label="Lowest-performing post" post={summary.worst} tone="worst" />}
                </div>
              ) : (
                <p className="mt-3 text-[12px] text-[#5f6366]">No posts from {selected.name} in this period.</p>
              )}
              {summary.hashtags.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 min-[621px]:flex-row min-[621px]:items-center">
                  <span className="text-[11px] font-semibold whitespace-nowrap text-[#4f5d5f]">Most-used hashtags</span>
                  <ul className="flex flex-wrap gap-1.5">
                    {summary.hashtags.map((tag) => (
                      <li key={tag.tag} className="rounded-[20px] bg-[#e3eeee] px-2 py-1 text-[11px] font-semibold text-brand-teal">
                        {tag.tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section aria-labelledby="channels-title" className={panelClass}>
              <PanelHeading id="channels-title" eyebrow="Campaign sources" title={`${selected.name} channel activity`}>
                <span className="rounded-[20px] bg-brand-coral px-2 py-1 text-[10px] font-bold text-brand-navy">Sample</span>
              </PanelHeading>
              {latestAd && (
                <div className="mt-3.5 flex items-center gap-3 rounded-[10px] bg-brand-navy p-3 text-brand-cream">
                  <span aria-hidden="true" className="grid size-[45px] shrink-0 place-items-center rounded-xl bg-brand-lime text-[17px] font-bold text-brand-navy">
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="grid min-w-0 gap-0.5">
                    <small className="text-[10px] text-brand-cream/75">Latest ad · Sponsored {latestAd.format}</small>
                    <strong className="truncate text-[13px]">{latestAd.headline}</strong>
                    <p className="text-[11px] text-brand-cream/80">Running since {formatShortDate(latestAd.startDate)}</p>
                  </div>
                </div>
              )}
              {channels.length === 0 ? (
                <p className="mt-3 text-[12px] text-[#5f6366]">No posts or ads in this period.</p>
              ) : (
                <ul className="mt-2">
                  {channels.map((item) => (
                    <li key={item.key} className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-x-2 gap-y-0.5 border-b border-brand-teal/12 px-0.5 py-2.5">
                      <span className="row-span-2 text-[10px] font-bold text-brand-teal">
                        {item.channel}
                        <small className="block font-normal text-[#6f7377]">{item.format}</small>
                      </span>
                      <strong className="truncate text-[12px] text-brand-navy">{item.title}</strong>
                      <small className="text-[11px] text-[#6f7377]">{item.detail}</small>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="mt-2">
                {[
                  ["Posting frequency", summary.postsChange === null ? "—" : `${signed(summary.postsChange * 100)}%`],
                  ["Top hashtag", summary.hashtags[0]?.tag ?? "—"],
                  ["Engagement", formatPercent(summary.engagementRate, 1)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 border-b border-brand-teal/12 px-0.5 py-2.5 text-[12px] text-[#5f6366]">
                    <dt>{label}</dt>
                    <dd className="font-semibold text-brand-teal">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section aria-labelledby="patterns-title" className={`${panelClass} mt-3`}>
            <PanelHeading id="patterns-title" eyebrow="Trend and campaign pattern detection" title="Recurring themes across competitor campaigns">
              <span className="text-[11px] text-[#6f7377]">All tracked competitors</span>
            </PanelHeading>
            {patterns.length === 0 ? (
              <p className="mt-3 text-[12px] text-[#5f6366]">No theme is shared by two or more of your competitors in this period.</p>
            ) : (
              <>
                <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-[10px] border border-[rgba(116,195,101,0.52)] bg-brand-lime/40 px-3.5 py-3 min-[621px]:flex-nowrap">
                  <span className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-brand-lime-bright text-brand-navy">
                    <LineIcon name="sparkles" size={18} />
                  </span>
                  <p className="grid flex-1 gap-[3px] text-[12px] leading-[1.45] text-[#4f5d5f]">
                    <strong className="text-[13px] text-brand-navy">{patterns[0].theme} is the most shared theme.</strong>
                    {patterns[0].competitors.length} tracked competitors used it in {patterns[0].posts} posts, {dates.currentLabel}. Best example:{" "}
                    {patterns[0].example.competitor}, &ldquo;{patterns[0].example.caption}&rdquo;.
                  </p>
                  <span className="text-[11px] font-bold whitespace-nowrap text-brand-teal">
                    {patterns[0].competitors.length >= 3 ? "High confidence" : "Early signal"}
                  </span>
                </div>
                <ol className="mt-2.5 grid gap-2 min-[901px]:grid-cols-3">
                  {patterns.slice(0, 3).map((pattern, index) => (
                    <li key={pattern.theme} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 rounded-[9px] border border-brand-teal/12 bg-[#fafaf8] p-3">
                      <span aria-hidden="true" className="grid size-[34px] place-items-center rounded-[9px] bg-brand-navy text-[12px] font-bold text-brand-lime">
                        0{index + 1}
                      </span>
                      <div className="grid gap-[3px]">
                        <strong className="text-[13px] text-brand-navy">{pattern.theme}</strong>
                        <p className="text-[11px] text-[#5f6366]">
                          Appeared in {pattern.posts} posts by {pattern.competitors.join(", ")}
                        </p>
                        <small className="text-[10px] text-[#6f7377]">{pattern.channels.join(" · ")}</small>
                      </div>
                      <span className="text-[12px] font-bold text-brand-teal">
                        {pattern.change === null ? "New" : `${signed(pattern.change * 100)}%`}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
