import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNT, SESSION_COOKIE } from "@/lib/hub/constants";
import { profileForSession } from "@/lib/hub/demo-profile";
import { SECTIONS, settingsFor, type Section } from "@/lib/hub/settings";
import { workspaceFor } from "@/lib/hub/workspace";
import { summaryFor } from "@/lib/social/meta/access";
import { parseMetaResult } from "@/lib/social/meta/results";
import { makePageClass } from "../_components/make-ui";
import { SettingsView } from "./_components/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your personal details, workspace preferences, notifications, and account security.",
};

// Settings ("Profile and settings") from the team's Figma Make (2026-11-06). The company name in the
// top bar and the gear in the sidebar both open it; ?section= opens one section.
export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { section: raw, meta } = await searchParams;
  const jar = await cookies();
  const email = jar.get(SESSION_COOKIE)?.value;
  if (!email) redirect("/login");
  const start = SECTIONS.find((item) => item.toLowerCase() === (typeof raw === "string" ? raw.toLowerCase() : "")) ?? "Profile";
  const { business } = workspaceFor(jar);
  const metaCard = { summary: summaryFor(jar, email, business.id), result: parseMetaResult(meta), businessName: business.name };
  const connected = (profileForSession(jar, email)?.socials ?? []).filter((social) => social.verified).map((social) => social.platform);

  return (
    <main className={makePageClass}>
      <SettingsView initial={settingsFor(jar, email)} startSection={start as Section} isDemo={email === DEMO_ACCOUNT.email} connected={connected} metaCard={metaCard} />
    </main>
  );
}
