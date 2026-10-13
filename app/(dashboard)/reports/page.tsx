import type { Metadata } from "next";
import { ComingSoon } from "../_components/coming-soon";

export const metadata: Metadata = {
  title: "Reports",
};

// Planned features from docs/DISCOVERY.md (Performance: automated reporting).
const FEATURES = [
  "Automated reports sent on a schedule",
  "PDF downloads of your dashboard",
  "Executive overview summaries for stakeholders",
];

export default function ReportsPage() {
  return <ComingSoon title="Reports" features={FEATURES} />;
}
