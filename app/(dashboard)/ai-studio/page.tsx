import type { Metadata } from "next";
import { ComingSoon } from "../_components/coming-soon";

export const metadata: Metadata = {
  title: "AI Studio",
};

// Planned features from docs/DISCOVERY.md (AI in action: brainstorm and planning).
const FEATURES = [
  "Content and campaign ideas based on current trends",
  "Caption and hashtag suggestions",
  "Recommendations for what to do next",
  "Best times to post, with posts scheduled on an auto-post calendar",
];

export default function AiStudioPage() {
  return <ComingSoon title="AI Studio" features={FEATURES} />;
}
