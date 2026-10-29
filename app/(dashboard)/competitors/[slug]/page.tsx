import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { todayIsoDate } from "@/lib/analytics/dates";
import { competitorDetail, platformActivity } from "@/lib/competitors/activity";
import { hospitalityAds, hospitalityPostsBetween } from "@/lib/competitors/hospitality";
import { pageDates } from "@/lib/date-range";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { availableCompetitors } from "@/lib/hub/tracking";
import { DateRangeBar } from "../../_components/date-range-bar";
import { CompetitorDetail } from "../_components/competitor-detail";

/** A competitor this account can track (from sign-up or the sample suppliers), or undefined. */
async function findCompetitor(slug: string) {
  const store = await cookies();
  const profile = profileForSession(store, store.get(SESSION_COOKIE)?.value ?? "");
  return availableCompetitors(profile).find((competitor) => competitor.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/competitors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await findCompetitor(slug))?.name ?? "Competitor" };
}

// Thin async wrapper: the content is the synchronous CompetitorDetail component, which is unit tested.
export default async function CompetitorPage({ params, searchParams }: PageProps<"/competitors/[slug]">) {
  const { slug } = await params;
  const competitor = await findCompetitor(slug);
  if (!competitor) {
    notFound();
  }
  const today = todayIsoDate();
  const dates = pageDates(await searchParams, today);
  const posts = hospitalityPostsBetween([competitor], dates.dataRange);
  const detail = competitorDetail(slug, posts, hospitalityAds([competitor], dates.ranges.current.end), dates.ranges);
  return (
    <CompetitorDetail
      competitor={competitor}
      detail={detail}
      platforms={platformActivity(slug, posts, dates.ranges)}
      query={dates.query}
      dateBar={<DateRangeBar key={dates.query} resolved={dates.resolved} today={today} />}
      note={
        competitor.source === "sign-up"
          ? `Sample data: these numbers are made up to show how tracking will work. They are not real figures for ${competitor.name}.`
          : undefined
      }
    />
  );
}
