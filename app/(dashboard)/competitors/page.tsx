import type { Metadata } from "next";
import { ComingSoon } from "../_components/coming-soon";

export const metadata: Metadata = {
  title: "Competitors",
};

// Planned features from docs/DISCOVERY.md (Dashboard: competitor activities overview).
const FEATURES = [
  "Competitor posting frequency and engagement",
  "Competitors' top and bottom performing posts",
  "Hashtags competitors use most",
  "Active ads from the Meta, TikTok, and Google ad libraries",
];

export default function CompetitorsPage() {
  return <ComingSoon title="Competitors" features={FEATURES} />;
}
