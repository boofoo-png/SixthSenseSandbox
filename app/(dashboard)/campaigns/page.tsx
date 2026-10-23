import type { Metadata } from "next";
import { ComingSoon, comingSoonItem } from "../_components/coming-soon";

const item = comingSoonItem("/campaigns");

export const metadata: Metadata = { title: item.label, description: item.summary };

export default function CampaignsPage() {
  return <ComingSoon item={item} />;
}
