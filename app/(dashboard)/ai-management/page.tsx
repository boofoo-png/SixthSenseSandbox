import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import { cookies } from "next/headers";
import { findBusiness, recommendationsFor } from "@/lib/hub/posting-plan";
import { workspaceFor } from "@/lib/hub/workspace";
import { makePageClass } from "../_components/make-ui";
import { PostingPlan } from "./_components/posting-plan";

export const metadata: Metadata = {
  title: "AI Management",
  description: "AI posting plan: recommended frequency, days, times, and content mix, with a content calendar and upcoming posts.",
};

// AI Management as the functionality list and the team's design file describe it (2026-11-05).
export default async function AiManagementPage() {
  // The business chosen in the top bar's company menu.
  const { business: chosen } = workspaceFor(await cookies());
  const business = findBusiness(chosen.id, chosen.name);
  return (
    <main className={makePageClass}>
      <PostingPlan key={business.id} businessId={business.id} businessName={business.name} today={todayIsoDate()} rec={recommendationsFor(business)} />
    </main>
  );
}
