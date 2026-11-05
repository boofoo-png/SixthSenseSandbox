import type { Metadata } from "next";
import { cookies } from "next/headers";
import { todayIsoDate } from "@/lib/analytics/dates";
import { defaultAudienceSlug, findAudience } from "@/lib/hub/audience";
import { SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { nextPublishingWindow } from "@/lib/hub/overview";
import { makePageClass } from "../_components/make-ui";
import { CampaignBuilder } from "./_components/campaign-builder";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Set goals, an offer, and an audience, then generate an editable campaign draft.",
};

// Campaigns from the team's updated Figma Make (2026-11-05). The launch date starts on the next
// recommended publishing window shown on the Overview.
export default async function CampaignsPage() {
  const jar = await cookies();
  const email = jar.get(SESSION_COOKIE)?.value ?? "";
  const profile = email ? profileForSession(jar, email) : null;
  const today = todayIsoDate();
  return (
    <main className={`${makePageClass} max-w-[1480px] pb-20`}>
      <CampaignBuilder today={today} launchDate={nextPublishingWindow(today)} defaultAudience={findAudience(defaultAudienceSlug(profile))?.name ?? ""} />
    </main>
  );
}
