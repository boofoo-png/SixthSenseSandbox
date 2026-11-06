import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import { findBusiness, recommendationsFor } from "@/lib/hub/posting-plan";
import { makePageClass } from "../_components/make-ui";
import { PostingPlan } from "./_components/posting-plan";

export const metadata: Metadata = {
  title: "AI Management",
  description: "AI posting plan: recommended frequency, days, times, and content mix, with a content calendar and upcoming posts.",
};

// AI Management as the functionality list and the team's design file describe it (2026-11-05).
export default async function AiManagementPage({ searchParams }: PageProps<"/ai-management">) {
  const { business: raw } = await searchParams;
  const business = findBusiness(typeof raw === "string" ? raw : undefined);
  return (
    <main className={makePageClass}>
      <PostingPlan key={business.id} businessId={business.id} today={todayIsoDate()} rec={recommendationsFor(business)} />
    </main>
  );
}
