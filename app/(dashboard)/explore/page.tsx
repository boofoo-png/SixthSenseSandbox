import type { Metadata } from "next";
import { MakePageHeader, makePageClass } from "../_components/make-ui";
import { TrendTracker } from "./_components/trend-tracker";

export const metadata: Metadata = {
  title: "Audience Trends",
  description: "Follow the trends your audiences care about: filter live signals by audience and source, then turn the strongest into campaign direction.",
};

// The Audience Trends page from the team's Figma Make "Marketing Intelligence Hub" (re-fetched
// 2026-11-16). docs/FUNCTIONALITY.md no longer describes this page, so the Make is the source.

export default function AudiencePage() {
  return (
    <main className={makePageClass}>
      <MakePageHeader
        eyebrow="Audience research"
        title="Follow the trends your audiences care about"
        description="Filter live signals by audience and source, then turn the strongest opportunities into campaign direction."
        question="Which trend should we act on for our audiences?"
      />
      <TrendTracker />
    </main>
  );
}
