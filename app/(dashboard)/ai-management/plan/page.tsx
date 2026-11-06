import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import { findBusiness } from "@/lib/hub/posting-plan";
import { makePageClass } from "../../_components/make-ui";
import { PlanWizard } from "../_components/plan-wizard";

export const metadata: Metadata = {
  title: "Generate a new plan",
  description: "Tell AI what to create and when to publish, review the suggestions, and add them to your calendar.",
};

// The three-step plan generator from the team's design file (2026-11-05).
export default async function GeneratePlanPage({ searchParams }: PageProps<"/ai-management/plan">) {
  const { business: raw } = await searchParams;
  const business = findBusiness(typeof raw === "string" ? raw : undefined);
  return (
    <main className={makePageClass}>
      <PlanWizard key={business.id} businessId={business.id} today={todayIsoDate()} />
    </main>
  );
}
