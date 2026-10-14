import Link from "next/link";
import { engagementRate } from "@/lib/analytics/kpis";
import { formatPercent } from "@/lib/analytics/summary";
import { PLATFORM_LABELS } from "@/lib/analytics/types";
import type { CompetitorDetail as Detail, PlatformActivity } from "@/lib/competitors/activity";
import { AD_LIBRARY_LABELS, type Competitor, type CompetitorPost } from "@/lib/competitors/types";
import { withQuery } from "@/lib/date-range";
import type { ReactNode } from "react";
import { cardClass, cardHeadingClass, linkClass, pageClass, subtitleClass, titleClass } from "../../_components/styles";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={cardClass}>
      <h2 id={id} className={cardHeadingClass}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function PostList({ posts }: { posts: readonly CompetitorPost[] }) {
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {posts.map((post, index) => (
        <li key={`${post.date}-${index}`} className="py-2">
          <p className="text-zinc-900 dark:text-zinc-100">{post.caption}</p>
          <div className="mt-0.5 flex flex-wrap justify-between gap-x-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{`${PLATFORM_LABELS[post.platform]}, ${post.date}`}</span>
            <span>{`${formatPercent(engagementRate(post.engagements, post.impressions), 1)} engagement`}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PlatformList({ platforms }: { platforms: readonly PlatformActivity[] }) {
  return (
    <ul className="space-y-1">
      {platforms.map(({ platform, posts, engagementRate: rate }) => (
        <li key={platform} className="flex justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{PLATFORM_LABELS[platform]}</span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {`${posts} ${posts === 1 ? "post" : "posts"}, ${formatPercent(rate, 1)} engagement`}
          </span>
        </li>
      ))}
    </ul>
  );
}

type CompetitorDetailProps = {
  competitor: Competitor;
  detail: Detail;
  platforms?: readonly PlatformActivity[];
  /** The date bar's query string, kept in the link back. */
  query?: string;
  /** The date bar, rendered above the details. */
  dateBar?: ReactNode;
};

/** Everything about one competitor in the selected period: platforms, best and worst posts, hashtags, and running ads. */
export function CompetitorDetail({ competitor, detail, platforms = [], query = "", dateBar }: CompetitorDetailProps) {
  return (
    <main className={pageClass}>
      <Link href={withQuery("/competitors", query)} className={linkClass}>All competitors</Link>
      <h1 className={`mt-3 ${titleClass}`}>{competitor.name}</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{competitor.handle}</p>
      <p className={subtitleClass}>Sample data: a fictional business used to show how competitor tracking will work.</p>

      {dateBar && <div className="mt-6">{dateBar}</div>}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Section id="by-platform" title="By platform">
          {platforms.length === 0 ? <Empty>No posts in this period.</Empty> : <PlatformList platforms={platforms} />}
        </Section>
        <Section id="top-posts" title="Top posts">
          {detail.topPosts.length === 0 ? <Empty>No posts in this period.</Empty> : <PostList posts={detail.topPosts} />}
        </Section>
        <Section id="bottom-posts" title="Lowest performing posts">
          {detail.bottomPosts.length === 0 ? (
            <Empty>Not enough posts in this period to compare.</Empty>
          ) : (
            <PostList posts={detail.bottomPosts} />
          )}
        </Section>
        <Section id="hashtags" title="Most used hashtags">
          {detail.topHashtags.length === 0 ? (
            <Empty>No hashtags used yet.</Empty>
          ) : (
            <ul className="space-y-1">
              {detail.topHashtags.map(({ tag, count }) => (
                <li key={tag} className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{tag}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{`${count} posts`}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section id="active-ads" title="Active ads">
          {detail.activeAds.length === 0 ? (
            <Empty>No ads running right now.</Empty>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {detail.activeAds.map((ad) => (
                <li key={`${ad.library}-${ad.headline}`} className="py-2">
                  <p className="text-zinc-900 dark:text-zinc-100">{ad.headline}</p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {`${AD_LIBRARY_LABELS[ad.library]} ad library, ${ad.format}, running since ${ad.startDate}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </main>
  );
}
