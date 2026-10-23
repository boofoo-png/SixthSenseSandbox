import type { Metadata } from "next";
import { ComingSoon, comingSoonItem } from "../_components/coming-soon";

const item = comingSoonItem("/ai-management");

export const metadata: Metadata = { title: item.label, description: item.summary };

export default function AiManagementPage() {
  return <ComingSoon item={item} />;
}
