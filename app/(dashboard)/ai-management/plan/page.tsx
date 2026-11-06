import type { Metadata } from "next";
import { todayIsoDate } from "@/lib/analytics/dates";
import { cookies } from "next/headers";
import { findBusiness } from "@/lib/hub/posting-plan";
import { workspaceFor } from "@/lib/hub/workspace";
import { makePageClass } from "../../_components/make-ui";
import { PlanWizard } from "../_components/plan-wizard";

export const metadata: Metadata = {
  title: "Generate a new plan",
  description: "Tell AI what to create and when to publish, review the suggestions, and add them to your calendar.",
};

// The three-step plan generator from the team's design file (2026-11-05).
export default async function GeneratePlanPage() {
  // The business chosen in the top bar's company menu.
  const { business: chosen } = workspaceFor(await cookies());
  const business = findBusiness(chosen.id, chosen.name);
  return (
    <main className={makePageClass}>
      <PlanWizard key={business.id} businessId={business.id} businessName={business.name} today={todayIsoDate()} />
    </main>
  );
}
