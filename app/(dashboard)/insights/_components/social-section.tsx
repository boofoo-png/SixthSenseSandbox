import Link from "next/link";
import type { GraphError } from "@/lib/social/meta/graph";
import type { SocialReport } from "@/lib/social/meta/stats";

// Reports' "Instagram and Facebook" section (plan 3.3): live numbers for the business chosen in the
// top bar when it has connected Instagram in Settings, otherwise a prompt to connect.

export type SocialSectionState =
  | { status: "not-configured" }
  | { status: "not-connected" }
  | { status: "failed"; error: GraphError }
  | { status: "live"; report: SocialReport };

const card =
  "mt-4 min-w-0 rounded-[22px] border border-brand-cream/70 bg-brand-cream/94 p-5 text-brand-navy shadow-[0_7px_0_rgba(0,31,62,0.16),0_18px_35px_rgba(0,31,62,0.12)] backdrop-blur-[18px] print:hidden";
const link = "font-bold text-brand-teal underline";

const count = (value: number | null) => (value === null ? "No data yet" : value.toLocaleString("en-CA"));
const signed = (value: number | null) => (value === null ? null : `${value >= 0 ? "+" : ""}${value.toFixed(1)}% vs the previous period`);
const shortDate = (iso: string) => {
  const time = Date.parse(iso.replace(/\+0000$/, "Z"));
  return Number.isNaN(time) ? "" : new Date(time).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

function Figures({ items }: { items: readonly (readonly [string, string, string | null])[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 min-[901px]:grid-cols-4">
      {items.map(([term, value, note]) => (
        <div key={term} className="grid gap-0.5 rounded-[12px] bg-white/70 p-3">
          <dt className="text-[11px] font-semibold text-[#53676a]">{term}</dt>
          <dd className="text-[22px] text-brand-navy">{value}</dd>
          {note && <dd className="text-[11px] text-[#5f6b6d]">{note}</dd>}
        </div>
      ))}
    </dl>
  );
}

function PostList({ posts }: { posts: readonly { id: string; text: string; meta: string; permalink: string; site: string }[] }) {
  return (
    <ol className="grid gap-2 min-[901px]:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id} className="grid min-w-0 gap-1 rounded-[12px] bg-white/70 p-3 text-[12px]">
          <span className="line-clamp-2 break-words text-brand-navy">{post.text || "(no caption)"}</span>
          <span className="text-[#5f6b6d]">{post.meta}</span>
          <a href={post.permalink} target="_blank" rel="noopener noreferrer" className={`${link} w-fit`}>
            Open on {post.site}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

const subheading = "mt-5 mb-2 text-[13px] font-bold text-brand-teal";

export function SocialSection({ state, business, period }: { state: SocialSectionState; business: string; period: string }) {
  return (
    <section aria-labelledby="social-title" className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.11em] text-brand-coral uppercase">Organic social</p>
          <h2 id="social-title" className="text-[18px] font-semibold">
            Instagram and Facebook
          </h2>
        </div>
        {state.status === "live" && (
          <span className="inline-flex items-center gap-1 rounded-[10px] bg-brand-teal px-2 py-0.5 text-[10px] font-bold text-brand-cream">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-lime-bright" />
            Live from @{state.report.username}
          </span>
        )}
      </div>

      {state.status === "live" ? (
        <>
          <h3 className={subheading}>Instagram (@{state.report.username})</h3>
          <Figures
            items={[
              ["Followers", count(state.report.followers), null],
              [`Reach, last ${period}`, count(state.report.reach), signed(state.report.reachChange)],
              [`Views, last ${period}`, count(state.report.views), null],
              ["Engagement rate", state.report.engagementRate === null ? "No data yet" : `${state.report.engagementRate}%`, "interactions per account reached"],
            ]}
          />
          <h4 className="mt-3 mb-2 text-[12px] font-semibold text-[#3f4b4d]">Top Instagram posts by likes and comments</h4>
          {state.report.topPosts.length === 0 ? (
            <p className="text-[13px] text-[#5f6b6d]">No posts yet on @{state.report.username}.</p>
          ) : (
            <PostList
              posts={state.report.topPosts.map((post) => ({
                id: post.id,
                text: post.caption,
                meta: [shortDate(post.timestamp), `${post.likes} likes`, `${post.comments} comments`].filter(Boolean).join(" · "),
                permalink: post.permalink,
                site: "Instagram",
              }))}
            />
          )}

          <h3 className={subheading}>Facebook Page</h3>
          {state.report.facebook ? (
            <>
              <Figures
                items={[
                  ["Page followers", count(state.report.pageFollowers), null],
                  [`Viewers, last ${period}`, count(state.report.facebook.viewers), signed(state.report.facebook.viewersChange) ?? "accounts that saw the Page's content"],
                  [`Views, last ${period}`, count(state.report.facebook.views), null],
                  [`Post engagement, last ${period}`, count(state.report.facebook.engagements), "reactions, comments, shares and clicks"],
                ]}
              />
              {state.report.facebook.views === null && state.report.facebook.viewers === null && state.report.facebook.engagements === null && (
                <p className="mt-2 text-[12px] text-[#5f6b6d]">
                  Meta isn&apos;t reporting views or engagement for this Page yet. That&apos;s normal for a new Page with few followers or little activity; the numbers appear once
                  Meta has some, which can take a day or two.
                </p>
              )}
              <h4 className="mt-3 mb-2 text-[12px] font-semibold text-[#3f4b4d]">Top Facebook posts by reactions, comments and shares</h4>
              {state.report.facebook.topPosts.length === 0 ? (
                <p className="text-[13px] text-[#5f6b6d]">No posts yet on the Page.</p>
              ) : (
                <PostList
                  posts={state.report.facebook.topPosts.map((post) => ({
                    id: post.id,
                    text: post.message,
                    meta: [shortDate(post.createdTime), `${post.reactions} reactions`, `${post.comments} comments`, `${post.shares} shares`].filter(Boolean).join(" · "),
                    permalink: post.permalink,
                    site: "Facebook",
                  }))}
                />
              )}
            </>
          ) : (
            <Figures items={[["Page followers", count(state.report.pageFollowers), "Page views and posts couldn't be read just now"]]} />
          )}
          <p className="mt-3 text-[11px] text-[#5f6b6d]">Live organic numbers for {business}, refreshed every 15 minutes. Ad results above are still sample data.</p>
        </>
      ) : (
        <p role={state.status === "failed" ? "status" : undefined} className="mt-3 text-[13px] text-[#3f4b4d]">
          {state.status === "failed" ? (
            <>
              {state.error === "expired" || state.error === "permission" ? "Instagram access for this business has expired or was removed. " : "Instagram couldn't be reached just now. "}
              <Link href="/settings?section=workspace" className={link}>
                {state.error === "expired" || state.error === "permission" ? "Reconnect in Settings" : "Check the connection in Settings"}
              </Link>
            </>
          ) : state.status === "not-connected" ? (
            <>
              Connect {business}&apos;s Instagram professional account to see its real followers, reach, views, and top posts here.{" "}
              <Link href="/settings?section=workspace" className={link}>
                Connect in Settings
              </Link>
            </>
          ) : (
            "Live Instagram and Facebook numbers will appear here once the Meta app is set up for this copy of Sixth Sense."
          )}
        </p>
      )}
    </section>
  );
}
