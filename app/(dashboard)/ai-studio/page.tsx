import type { Metadata } from "next";
import { connection } from "next/server";
import { shiftDate, todayIsoDate } from "@/lib/analytics/dates";
import { sampleDataBetween } from "@/lib/analytics/sample-data";
import { rankPlatforms } from "@/lib/ai-studio/ideas";
import { SAMPLE_TRENDS } from "@/lib/competitors/sample-data";
import { pageClass, subtitleClass, titleClass } from "../_components/styles";
import { AiStudio } from "./_components/ai-studio";
import { BestTimesCard } from "./_components/best-times-card";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Content ideas, captions, best times to post, and a content calendar.",
};

/** Sample stand-in for the cafe's own best-performing hashtags until real accounts are connected. */
const SAMPLE_OWN_TAGS = ["#latteart", "#coffeelover"];

export default async function AiStudioPage() {
  // Render on each visit: the calendar month and earliest date depend on today (Next.js 16 connection()).
  await connection();
  const today = todayIsoDate();
  // Rank platforms by the last 30 days of sample engagement.
  const bestPlatforms = rankPlatforms(sampleDataBetween({ start: shiftDate(today, -29), end: today }));

  return (
    <main className={pageClass}>
      <h1 className={titleClass}>AI Studio</h1>
      <p className={subtitleClass}>Plan posts from trending ideas, then schedule them on your calendar. Showing sample data.</p>

      <div className="mt-6 space-y-8">
        <AiStudio trends={SAMPLE_TRENDS} bestPlatforms={bestPlatforms} ownTags={SAMPLE_OWN_TAGS} today={today} />
        <BestTimesCard />
      </div>
    </main>
  );
}
