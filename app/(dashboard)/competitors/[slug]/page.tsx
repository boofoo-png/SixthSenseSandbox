import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { todayIsoDate } from "@/lib/analytics/dates";
import { competitorDetail, platformActivity } from "@/lib/competitors/activity";
import { SAMPLE_COMPETITORS, createSampleAds, createSamplePosts } from "@/lib/competitors/sample-data";
import { CompetitorDetail } from "../_components/competitor-detail";

// Only the sample competitors exist; any other slug is a 404 (see docs/DECISIONS.md).
export const dynamicParams = false;

export function generateStaticParams() {
  return SAMPLE_COMPETITORS.map((competitor) => ({ slug: competitor.slug }));
}

function findCompetitor(slug: string) {
  return SAMPLE_COMPETITORS.find((competitor) => competitor.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/competitors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: findCompetitor(slug)?.name ?? "Competitor" };
}

// Thin async wrapper: the content is the synchronous CompetitorDetail component, which is unit tested.
export default async function CompetitorPage({ params }: PageProps<"/competitors/[slug]">) {
  const { slug } = await params;
  const competitor = findCompetitor(slug);
  if (!competitor) {
    notFound();
  }
  const today = todayIsoDate();
  const posts = createSamplePosts(today);
  const detail = competitorDetail(slug, posts, createSampleAds(today));
  return <CompetitorDetail competitor={competitor} detail={detail} platforms={platformActivity(slug, posts)} />;
}
