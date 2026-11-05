import type { Metadata } from "next";
import { MakePageHeader, makePageClass } from "../_components/make-ui";
import { CommunityInbox } from "./_components/community-inbox";

export const metadata: Metadata = {
  title: "AI Management",
  description: "Review suggested replies, monitor sentiment, and manage comments and messages from every connected channel.",
};

// AI Management as the team's updated Figma Make shows it (2026-11-05): AI community management.
export default function AiManagementPage() {
  return (
    <main className={makePageClass}>
      <MakePageHeader
        eyebrow="AI community management"
        title="Keep every conversation moving"
        description="Review suggested replies, monitor sentiment, and manage comments and messages from every connected channel."
        question="Which conversations need a reply first?"
      />
      <CommunityInbox />
    </main>
  );
}
